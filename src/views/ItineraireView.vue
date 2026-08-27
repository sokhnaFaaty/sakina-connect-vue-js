<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useToast, useModal, useConfirm, useDrawer } from '@/composables/index.js'
import { getGuideByUtilisateurId, getGroupeDuGuide } from '@/services/guideService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js'
import { getCategories } from '@/services/categorieService.js'
import {
  getPlanningDuGroupe,
  deletePlanningEvent,
  filtrerPlanningVisible,
  statutEvenement,
  STATUT_EVENEMENT,
  approuverPlanningEvent,
  rejeterPlanningEvent,
} from '@/services/planningService.js'
import { PageHeader, AppButton } from '@/components/ui/index.js'
import PlanningForm from '@/components/forms/PlanningForm.vue'
import RejetMotifModal from '@/components/forms/RejetMotifModal.vue'
import { creerCarte, centrerCarteSur } from '@/components/leafletMap.js'

const PAR_PAGE = 2

const STATUT_TABS_EVT = [
  { key: 'tous', label: 'Tous' },
  { key: STATUT_EVENEMENT.EN_ATTENTE, label: 'En attente' },
  { key: STATUT_EVENEMENT.APPROUVE, label: 'Approuvé' },
  { key: STATUT_EVENEMENT.REJETE, label: 'Rejeté' },
]

const auth = useAuthStore()
const { open: openModal } = useModal()
const { open: openDrawer } = useDrawer()
const { askConfirmation } = useConfirm()
const { success, error } = useToast()

const etatVide = ref(null)
const groupes = ref([])
const planning = ref([])
const categories = ref([])
const groupeId = ref(null)
const filtreJour = ref('tous')
const filtreCategorie = ref('tous')
const filtreStatut = ref('tous')
const pageActuelle = ref(1)
const placeholderCarte = ref(false)

// Seuls l'admin et le guide peuvent créer/modifier/supprimer ; le pèlerin est en lecture seule.
const canEdit = computed(() => auth.role === 'ADMIN' || auth.role === 'GUIDE')

async function chargerGroupes() {
  const user = auth.user
  if (auth.role === 'GUIDE') {
    const guide = await getGuideByUtilisateurId(user.id)
    if (!guide) {
      etatVide.value = {
        classes: 'rounded-[2rem] border border-amber-200 bg-amber-50',
        texteClasse: 'text-amber-700',
        message: 'Aucun profil guide associé à ce compte.',
      }
      return false
    }
    const groupe = await getGroupeDuGuide(guide.id)
    if (!groupe) {
      etatVide.value = {
        classes: 'rounded-[2rem] border border-slate-200 bg-white',
        texteClasse: 'text-slate-500',
        message: "Aucun groupe ne t'a encore été assigné.",
      }
      return false
    }
    groupes.value = [groupe]
  } else if (auth.role === 'PELERIN') {
    const pelerin = await getPelerinByUtilisateurId(user.id)
    const tousGroupes = await getGroupes()
    const groupe = pelerin ? tousGroupes.find((g) => g.id === pelerin.groupeId) : null
    if (!groupe) {
      etatVide.value = {
        classes: 'rounded-[2rem] border border-slate-200 bg-white',
        texteClasse: 'text-slate-500',
        message: "Aucun groupe ne t'est encore assigné.",
      }
      return false
    }
    groupes.value = [groupe]
  } else {
    groupes.value = await getGroupes()
  }

  groupeId.value = groupes.value[0]?.id || null
  if (!groupeId.value) {
    etatVide.value = {
      classes: 'rounded-[2rem] border border-slate-200 bg-white',
      texteClasse: 'text-slate-500',
      message: 'Aucun groupe disponible.',
    }
    return false
  }

  categories.value = await getCategories()
  return true
}

async function chargerPlanningVisible() {
  planning.value = filtrerPlanningVisible(await getPlanningDuGroupe(groupeId.value), {
    role: auth.role,
    userId: auth.user.id,
  })
}

onMounted(async () => {
  try {
    const ok = await chargerGroupes()
    if (!ok) return
    await chargerPlanningVisible()
    await nextTick()
    initialiserCarte()
  } catch (e) {
    error(e.message)
  }
})

async function surChangementGroupe() {
  try {
    pageActuelle.value = 1
    await chargerPlanningVisible()
    initialiserCarte()
  } catch (e) {
    error(e.message)
  }
}

// ---------- Filtres ----------

const joursUniques = computed(() => [...new Set(planning.value.map((e) => e.date))].sort())
const boutonsJour = computed(() => [
  { jour: 'tous', label: 'Tout le voyage' },
  ...joursUniques.value.map((jour, index) => ({ jour, label: `Jour ${index + 1}` })),
])
const boutonsCategorie = computed(() => [{ id: 'tous', libelle: 'Tous' }, ...categories.value])

const compteStatut = (key) =>
  key === 'tous' ? planning.value.length : planning.value.filter((e) => statutEvenement(e) === key).length

function classeFiltre(actif) {
  return actif ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600'
}

function choisirJour(jour) {
  filtreJour.value = jour
  pageActuelle.value = 1
}
function choisirCategorie(cat) {
  filtreCategorie.value = cat
  pageActuelle.value = 1
}
function choisirStatut(statut) {
  filtreStatut.value = statut
  pageActuelle.value = 1
}

// ---------- Liste + pagination ----------

const evenementsFiltres = computed(() =>
  planning.value.filter((e) => {
    const passeFiltreJour = filtreJour.value === 'tous' || e.date === filtreJour.value
    const passeFiltreCategorie = filtreCategorie.value === 'tous' || e.categorieId === filtreCategorie.value
    const passeFiltreStatut =
      auth.role !== 'ADMIN' || filtreStatut.value === 'tous' || statutEvenement(e) === filtreStatut.value
    return passeFiltreJour && passeFiltreCategorie && passeFiltreStatut
  })
)

const totalPages = computed(() => Math.max(1, Math.ceil(evenementsFiltres.value.length / PAR_PAGE)))
watch(totalPages, (t) => {
  if (pageActuelle.value > t) pageActuelle.value = t
})
const evenementsPagines = computed(() => {
  const debut = (pageActuelle.value - 1) * PAR_PAGE
  return evenementsFiltres.value.slice(debut, debut + PAR_PAGE)
})

const categorieMap = computed(() => Object.fromEntries(categories.value.map((c) => [c.id, c.libelle])))

function numeroJour(evenement) {
  return joursUniques.value.indexOf(evenement.date) + 1
}

function changerPage(page) {
  if (page >= 1 && page <= totalPages.value) pageActuelle.value = page
}

// Badge de statut de validation d'un événement (visible surtout par l'auteur et l'admin)
const statutBadge = (evenement) => statutEvenement(evenement)
const montrerModeration = (evenement) =>
  auth.role === 'ADMIN' &&
  (statutEvenement(evenement) === STATUT_EVENEMENT.EN_ATTENTE || statutEvenement(evenement) === STATUT_EVENEMENT.REJETE)

// ---------- Carte ----------

function initialiserCarte() {
  const premierAvecPosition = planning.value.find((e) => e.latitude && e.longitude)
  if (premierAvecPosition) {
    placeholderCarte.value = false
    creerCarte('carteItineraire', premierAvecPosition.latitude, premierAvecPosition.longitude)
  } else {
    placeholderCarte.value = true
  }
}

function voirSurCarte(evenement) {
  if (evenement.latitude && evenement.longitude) {
    centrerCarteSur(evenement.latitude, evenement.longitude, evenement.titre)
  } else {
    error('Position non définie pour cet événement.')
  }
}

// ---------- Actions ----------

function ouvrirForm(evenement = null) {
  openDrawer(PlanningForm, {
    title: evenement ? "Modifier l'evenement" : 'Ajouter un evenement',
    icon: 'fa-calendar-day',
    props: {
      evenement,
      categories: categories.value,
      planning: planning.value,
      groupeId: groupeId.value,
      userId: auth.user?.id,
      role: auth.role,
      onSuccess: async () => {
        await chargerPlanningVisible()
      },
    },
  })
}

async function supprimer(evenement) {
  const ok = await askConfirmation('Êtes-vous sûr de vouloir supprimer cet événement ?')
  if (!ok) return
  try {
    await deletePlanningEvent(evenement.id)
    success('Événement supprimé.')
    await chargerPlanningVisible()
  } catch (e) {
    error(e.message)
  }
}

async function approuver(evenement) {
  try {
    await approuverPlanningEvent(evenement.id)
    success('Événement approuvé.')
    await chargerPlanningVisible()
  } catch (e) {
    error(e.message)
  }
}

function ouvrirRejet(evenement) {
  openModal(RejetMotifModal, {
    title: "Rejeter l'événement",
    props: {
      placeholder: 'Explique au guide pourquoi son événement est refusé...',
      toastSucces: 'Événement rejeté.',
      rejeterFn: async (motif) => {
        await rejeterPlanningEvent(evenement.id, motif)
        await chargerPlanningVisible()
      },
    },
  })
}
function ouvrirFormulaire(evenement = null) {
  openModal(PlanningForm, { title: evenement ? 'Modifier' : 'Ajouter', props: { evenement, categories: categories.value, groupeId: groupeId.value, userId: auth.utilisateur.id, role: auth.role, onSucces: charger } });
}
async function supprimer(e) {
  try { await deletePlanningEvent(e.id); success('Événement supprimé.'); charger(); } catch (e) { error(e.message); }
}
</script>

<template>
  <section v-if="etatVide" :class="etatVide.classes" class="p-8 text-center">
    <p class="text-sm font-semibold" :class="etatVide.texteClasse">{{ etatVide.message }}</p>
  </section>

  <section v-else>
    <PageHeader
      kicker="Voyage"
      title="Itinéraire de voyages & Rituels"
      subtitle="Chronologie épurée détaillant la logistique, le transport et les instructions spirituelles."
    >
      <template #actions>
        <AppButton v-if="canEdit" @click="ouvrirForm()"><i class="fa-solid fa-plus"></i> Ajouter un Evenement</AppButton>
      </template>
    </PageHeader>

    <!-- Sélecteur de groupe : admin uniquement si plusieurs groupes -->
    <div v-if="auth.role === 'ADMIN' && groupes.length > 1" class="mb-4">
      <select id="selectGroupeItineraire" v-model="groupeId" @change="surChangementGroupe" class="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
        <option v-for="g in groupes" :key="g.id" :value="g.id">{{ g.nom }}</option>
      </select>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <div class="mb-4 rounded-3xl border border-slate-200 bg-white p-4">
          <p class="mb-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Filtrer par jour</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="b in boutonsJour"
              :key="b.jour"
              @click="choisirJour(b.jour)"
              class="filtre-jour-btn rounded-xl px-3 py-1.5 text-xs font-bold"
              :class="classeFiltre(filtreJour === b.jour)"
            >
              {{ b.label }}
            </button>
          </div>

          <p class="mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Catégories</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="b in boutonsCategorie"
              :key="b.id"
              @click="choisirCategorie(b.id)"
              class="filtre-cat-btn rounded-xl px-3 py-1.5 text-xs font-bold"
              :class="classeFiltre(filtreCategorie === b.id)"
            >
              {{ b.libelle }}
            </button>
          </div>

          <template v-if="auth.role === 'ADMIN'">
            <p class="mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Statut de validation</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="t in STATUT_TABS_EVT"
                :key="t.key"
                @click="choisirStatut(t.key)"
                class="filtre-statut-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                :class="classeFiltre(filtreStatut === t.key)"
              >
                {{ t.label }}
                <span class="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-600">{{ compteStatut(t.key) }}</span>
              </button>
            </div>
          </template>
        </div>

        <div class="grid gap-4">
          <div v-for="e in evenementsPagines" :key="e.id" class="rounded-2xl border border-slate-200 bg-white p-5">
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Jour {{ numeroJour(e) }}</span>
                <span class="text-xs font-bold text-slate-400">{{ e.heure }}</span>
                <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{{ categorieMap[e.categorieId] || '' }}</span>
                <span v-if="statutBadge(e) === STATUT_EVENEMENT.EN_ATTENTE" class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700"><i class="fa-solid fa-clock"></i> En attente</span>
                <span v-if="statutBadge(e) === STATUT_EVENEMENT.REJETE" class="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700"><i class="fa-solid fa-circle-xmark"></i> Rejeté</span>
              </div>
              <button @click="voirSurCarte(e)" class="flex items-center gap-1 text-xs font-bold text-[#333D2A] hover:underline">
                <i class="fa-solid fa-location-dot"></i> {{ e.lieu }}
              </button>
            </div>

            <div v-if="e.etapeGuide" class="mb-2 rounded-xl bg-[#F2F2DE] px-3 py-2 text-xs font-semibold text-[#333D2A]">
              Étape de guidage : {{ e.etapeGuide }}
            </div>

            <h3 class="font-black text-slate-900">{{ e.titre }}</h3>
            <p class="mt-1 text-sm text-slate-500">{{ e.description }}</p>

            <div v-if="statutBadge(e) === STATUT_EVENEMENT.REJETE && e.motifRejet" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              <i class="fa-solid fa-circle-exclamation"></i> Motif du rejet : {{ e.motifRejet }}
            </div>

            <div v-if="canEdit" class="mt-3 flex gap-4 text-xs font-extrabold">
              <button @click="ouvrirForm(e)" class="text-amber-600 hover:underline">Modifier</button>
              <button @click="supprimer(e)" class="text-rose-600 hover:underline">Supprimer</button>
            </div>

            <div v-if="montrerModeration(e)" class="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button @click="approuver(e)" class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-emerald-700"><i class="fa-solid fa-check"></i> Approuver</button>
              <button v-if="statutBadge(e) === STATUT_EVENEMENT.EN_ATTENTE" @click="ouvrirRejet(e)" class="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50"><i class="fa-solid fa-ban"></i> Rejeter</button>
            </div>
          </div>
          <p v-if="evenementsPagines.length === 0" class="text-sm text-slate-400">Aucun événement pour ce filtre.</p>
        </div>

        <!-- Pagination : chevrons + numéros ronds -->
        <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-2">
          <button @click="changerPage(pageActuelle - 1)" class="h-8 w-8 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            @click="changerPage(page)"
            class="h-8 w-8 rounded-full text-xs font-bold transition"
            :class="page === pageActuelle ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            {{ page }}
          </button>
          <button @click="changerPage(pageActuelle + 1)" class="h-8 w-8 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div class="h-[500px] overflow-hidden rounded-[2rem] border border-slate-200 lg:sticky lg:top-20">
        <div v-if="placeholderCarte" class="flex h-full items-center justify-center text-sm text-slate-400">Aucune position définie pour ce voyage.</div>
        <div v-else id="carteItineraire" class="h-full w-full"></div>
      </div>
      <div class="h-[500px] rounded-2xl border overflow-hidden"><div ref="conteneurCarte" id="carteItineraire" class="h-full w-full"></div></div>
    </div>
  </section>
</template>
