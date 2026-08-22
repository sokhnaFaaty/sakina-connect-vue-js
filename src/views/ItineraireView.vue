<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useToast, useConfirm, useDrawer } from '@/composables/index.js'
import { getGroupes, getCategories, getPlanning, deletePlanningEvent, updatePlanningEvent } from '@/services/index.js'
import { getGuideByUtilisateurId } from '@/services/guideService.js'
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js'
import { STATUT_EVENEMENT } from '@/config/constantes.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import PlanningForm from '@/components/forms/PlanningForm.vue'
import { creerCarte, centrerCarteSur } from '@/components/leafletMap.js'

// Port fidèle de js/pages/itinerairePage.js
const EVENEMENTS_PAR_PAGE = 2

const STATUT_TABS_EVT = [
  { key: 'tous', label: 'Tous' },
  { key: STATUT_EVENEMENT.EN_ATTENTE, label: 'En attente' },
  { key: STATUT_EVENEMENT.APPROUVE, label: 'Approuvé' },
  { key: STATUT_EVENEMENT.REJETE, label: 'Rejeté' },
]

const auth = useAuthStore()
const { success, error: toastError } = useToast()
const { askConfirmation } = useConfirm()
const { open: openDrawer, isOpen: drawerOuvert } = useDrawer()

const chargement = ref(true)
const messageInfo = ref(null) // 'guide-sans-profil' | 'guide-sans-groupe' | 'pelerin-sans-groupe' | 'aucun-groupe'

const groupesDisponibles = ref([])
const groupeSelectionne = ref(null)
const categories = ref([])
const planningGroupe = ref([])

const filtreJour = ref('tous')
const filtreCategorie = ref('tous')
const filtreStatut = ref('tous')
const pageActuelle = ref(1)

const rejetOuvert = ref(false)
const evenementARejeter = ref(null)
const motifRejet = ref('')
const erreurMotifRejet = ref('')

let carteInstance = null

const role = computed(() => auth.role)
const canEdit = computed(() => role.value === 'ADMIN' || role.value === 'GUIDE')
const afficherSelecteurGroupe = computed(() => role.value === 'ADMIN' && groupesDisponibles.value.length > 1)

// Statut effectif : les événements créés avant la modération sont considérés approuvés.
function statutEvenement(e) {
  return e.statut || STATUT_EVENEMENT.APPROUVE
}

// Visibilité : admin voit tout, l'auteur voit ses événements, les autres uniquement les approuvés.
function filtrerVisible(events) {
  if (role.value === 'ADMIN') return events
  return events.filter((e) => {
    if (e.auteurId && e.auteurId === auth.user.id) return true
    return statutEvenement(e) === STATUT_EVENEMENT.APPROUVE
  })
}

async function chargerDonnees() {
  chargement.value = true
  messageInfo.value = null
  try {
    let groupe = null
    if (role.value === 'GUIDE') {
      const guide = await getGuideByUtilisateurId(auth.user.id)
      if (!guide) { messageInfo.value = 'guide-sans-profil'; return }
      const tous = await getGroupes()
      groupe = tous.find((g) => g.guideId === guide.id) || null
      if (!groupe) { messageInfo.value = 'guide-sans-groupe'; return }
      groupesDisponibles.value = [groupe]
    } else if (role.value === 'PELERIN') {
      const pelerin = await getPelerinByUtilisateurId(auth.user.id)
      const tous = await getGroupes()
      groupe = pelerin ? tous.find((g) => g.id === pelerin.groupeId) : null
      if (!groupe) { messageInfo.value = 'pelerin-sans-groupe'; return }
      groupesDisponibles.value = [groupe]
    } else {
      groupesDisponibles.value = await getGroupes()
      groupe = groupesDisponibles.value[0] || null
      if (!groupe) { messageInfo.value = 'aucun-groupe'; return }
    }
    groupeSelectionne.value = groupe
    categories.value = await getCategories()
    await chargerPlanning()
  } catch (e) {
    toastError(e.message)
  } finally {
    chargement.value = false
  }
}

async function chargerPlanning() {
  try {
    const tous = await getPlanning()
    planningGroupe.value = filtrerVisible(
      tous
        .filter((e) => e.groupeId === groupeSelectionne.value?.id)
        .sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`))
    )
    await nextTick()
    initialiserCarte()
  } catch (e) { toastError(e.message) }
}

// ---------- Filtres ----------

const joursUniques = computed(() => [...new Set(planningGroupe.value.map((e) => e.date))].sort())
const numeroJour = (evenement) => joursUniques.value.indexOf(evenement.date) + 1
const categorieMap = computed(() => Object.fromEntries(categories.value.map((c) => [c.id, c.libelle])))

function compterParStatut(key) {
  return key === 'tous' ? planningGroupe.value.length : planningGroupe.value.filter((e) => statutEvenement(e) === key).length
}

const evenementsFiltres = computed(() =>
  planningGroupe.value.filter((e) => {
    const passeFiltreJour = filtreJour.value === 'tous' || e.date === filtreJour.value
    const passeFiltreCategorie = filtreCategorie.value === 'tous' || e.categorieId === filtreCategorie.value
    const passeFiltreStatut =
      role.value !== 'ADMIN' || filtreStatut.value === 'tous' || statutEvenement(e) === filtreStatut.value
    return passeFiltreJour && passeFiltreCategorie && passeFiltreStatut
  })
)

const totalPageEvenements = computed(() => Math.max(1, Math.ceil(evenementsFiltres.value.length / EVENEMENTS_PAR_PAGE)))
const pageSafe = computed(() => Math.min(pageActuelle.value, totalPageEvenements.value))
const evenementsPage = computed(() => {
  const debut = (pageSafe.value - 1) * EVENEMENTS_PAR_PAGE
  return evenementsFiltres.value.slice(debut, debut + EVENEMENTS_PAR_PAGE)
})

function reinitialiserPagination() { pageActuelle.value = 1 }

// ---------- Carte ----------

function initialiserCarte() {
  if (carteInstance) { carteInstance.remove(); carteInstance = null }
  const premierAvecPosition = planningGroupe.value.find((e) => e.latitude && e.longitude)
  const conteneur = document.getElementById('carteItineraire')
  if (!conteneur) return
  if (premierAvecPosition) {
    carteInstance = creerCarte('carteItineraire', premierAvecPosition.latitude, premierAvecPosition.longitude)
  } else {
    conteneur.innerHTML = '<div class="flex h-full items-center justify-center text-sm text-slate-400">Aucune position définie pour ce voyage.</div>'
  }
}

function voirSurCarte(evenement) {
  if (evenement && evenement.latitude && evenement.longitude && carteInstance) {
    centrerCarteSur(evenement.latitude, evenement.longitude, evenement.titre)
  } else {
    toastError('Position non définie pour cet événement.')
  }
}

// ---------- Actions ----------

function ouvrirFormulaireEvenement(evenement = null) {
  formOuvertIci = true
  openDrawer(PlanningForm, {
    title: evenement ? "Modifier l'evenement" : 'Ajouter un evenement',
    props: {
      evenement,
      categories: categories.value,
      groupeId: groupeSelectionne.value?.id,
      userId: auth.user.id,
      role: role.value,
    },
  })
}

// Le formulaire émet 'close' : on rafraîchit le planning à la fermeture du drawer.
let formOuvertIci = false
watch(
  () => drawerOuvert.value,
  async (ouvert) => {
    if (!ouvert && formOuvertIci) {
      formOuvertIci = false
      await chargerPlanning()
    }
  }
)

async function changerGroupe(event) {
  const groupe = groupesDisponibles.value.find((g) => g.id === event.target.value)
  if (!groupe) return
  groupeSelectionne.value = groupe
  filtreJour.value = 'tous'
  filtreCategorie.value = 'tous'
  filtreStatut.value = 'tous'
  reinitialiserPagination()
  await chargerPlanning()
}

async function supprimerEvenement(evenement) {
  if (!await askConfirmation('Êtes-vous sûr de vouloir supprimer cet événement ?')) return
  try {
    await deletePlanningEvent(evenement.id)
    success('Événement supprimé.')
    await chargerPlanning()
  } catch (e) { toastError(e.message) }
}

async function approuverEvenement(evenement) {
  try {
    await updatePlanningEvent(evenement.id, { ...evenement, statut: STATUT_EVENEMENT.APPROUVE, motifRejet: '' })
    success('Événement approuvé.')
    await chargerPlanning()
  } catch (e) { toastError(e.message) }
}

function ouvrirRejet(evenement) {
  evenementARejeter.value = evenement
  motifRejet.value = ''
  erreurMotifRejet.value = ''
  rejetOuvert.value = true
}

function fermerRejet() { rejetOuvert.value = false }

async function confirmerRejet() {
  const motif = motifRejet.value.trim()
  if (!motif) { erreurMotifRejet.value = 'Le motif de rejet est obligatoire.'; return }
  erreurMotifRejet.value = ''
  try {
    await updatePlanningEvent(evenementARejeter.value.id, {
      ...evenementARejeter.value,
      statut: STATUT_EVENEMENT.REJETE,
      motifRejet: motif,
    })
    success('Événement rejeté.')
    fermerRejet()
    await chargerPlanning()
  } catch (e) { toastError(e.message) }
}

onMounted(chargerDonnees)
onUnmounted(() => { if (carteInstance) carteInstance.remove() })
</script>

<template>
  <!-- Écrans d'information (aucun profil / aucun groupe assigné) -->
  <section v-if="messageInfo === 'guide-sans-profil'" class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
    <p class="text-sm font-semibold text-amber-700">Aucun profil guide associé à ce compte.</p>
  </section>
  <section v-else-if="messageInfo === 'guide-sans-groupe'" class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
    <p class="text-sm font-semibold text-slate-500">Aucun groupe ne t'a encore été assigné.</p>
  </section>
  <section v-else-if="messageInfo === 'pelerin-sans-groupe'" class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
    <p class="text-sm font-semibold text-slate-500">Aucun groupe ne t'est encore assigné.</p>
  </section>
  <section v-else-if="messageInfo === 'aucun-groupe'" class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
    <p class="text-sm font-semibold text-slate-500">Aucun groupe disponible.</p>
  </section>

  <section v-else>
    <PageHeader
      kicker="Voyage"
      title="Itinéraire de voyages & Rituels"
      subtitle="Chronologie épurée détaillant la logistique, le transport et les instructions spirituelles."
    >
      <template #actions>
        <button
          v-if="canEdit"
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
          @click="ouvrirFormulaireEvenement()"
        >
          <i class="fa-solid fa-plus"></i>
          <span>Ajouter un Evenement</span>
        </button>
      </template>
    </PageHeader>

    <!-- Sélecteur de groupe (admin, plusieurs groupes) -->
    <div v-if="afficherSelecteurGroupe" class="mb-4">
      <select
        class="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
        :value="groupeSelectionne?.id"
        @change="changerGroupe"
      >
        <option v-for="g in groupesDisponibles" :key="g.id" :value="g.id">{{ g.nom }}</option>
      </select>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <!-- Filtres -->
        <div class="mb-4 rounded-3xl border border-slate-200 bg-white p-4">
          <p class="mb-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Filtrer par jour</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
              :class="filtreJour === 'tous' ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600'"
              @click="filtreJour = 'tous'; reinitialiserPagination()"
            >Tout le voyage</button>
            <button
              v-for="(jour, index) in joursUniques"
              :key="jour"
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
              :class="filtreJour === jour ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600'"
              @click="filtreJour = jour; reinitialiserPagination()"
            >Jour {{ index + 1 }}</button>
          </div>

          <p class="mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Catégories</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
              :class="filtreCategorie === 'tous' ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600'"
              @click="filtreCategorie = 'tous'; reinitialiserPagination()"
            >Tous</button>
            <button
              v-for="c in categories"
              :key="c.id"
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
              :class="filtreCategorie === c.id ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600'"
              @click="filtreCategorie = c.id; reinitialiserPagination()"
            >{{ c.libelle }}</button>
          </div>

          <template v-if="role === 'ADMIN'">
            <p class="mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Statut de validation</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="t in STATUT_TABS_EVT"
                :key="t.key"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition"
                :class="filtreStatut === t.key ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600'"
                @click="filtreStatut = t.key; reinitialiserPagination()"
              >
                {{ t.label }}
                <span class="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-600">{{ compterParStatut(t.key) }}</span>
              </button>
            </div>
          </template>
        </div>

        <!-- Liste des événements -->
        <div class="grid gap-4">
          <template v-if="evenementsPage.length">
            <div v-for="evenement in evenementsPage" :key="evenement.id" class="rounded-2xl border border-slate-200 bg-white p-5">
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Jour {{ numeroJour(evenement) }}</span>
                  <span class="text-xs font-bold text-slate-400">{{ evenement.heure }}</span>
                  <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{{ categorieMap[evenement.categorieId] || '' }}</span>
                  <span v-if="statutEvenement(evenement) === STATUT_EVENEMENT.EN_ATTENTE" class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700"><i class="fa-solid fa-clock"></i> En attente</span>
                  <span v-else-if="statutEvenement(evenement) === STATUT_EVENEMENT.REJETE" class="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700"><i class="fa-solid fa-circle-xmark"></i> Rejeté</span>
                </div>
                <button
                  type="button"
                  class="flex items-center gap-1 text-xs font-bold text-[#333D2A] hover:underline"
                  @click="voirSurCarte(evenement)"
                >
                  <i class="fa-solid fa-location-dot"></i> {{ evenement.lieu }}
                </button>
              </div>

              <div v-if="evenement.etapeGuide" class="mb-2 rounded-xl bg-[#F2F2DE] px-3 py-2 text-xs font-semibold text-[#333D2A]">
                Étape de guidage : {{ evenement.etapeGuide }}
              </div>

              <h3 class="font-black text-slate-900">{{ evenement.titre }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ evenement.description }}</p>

              <div
                v-if="statutEvenement(evenement) === STATUT_EVENEMENT.REJETE && evenement.motifRejet"
                class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
              >
                <i class="fa-solid fa-circle-exclamation"></i> Motif du rejet : {{ evenement.motifRejet }}
              </div>

              <div v-if="canEdit" class="mt-3 flex gap-4 text-xs font-extrabold">
                <button type="button" class="text-amber-600 hover:underline" @click="ouvrirFormulaireEvenement(evenement)">Modifier</button>
                <button type="button" class="text-rose-600 hover:underline" @click="supprimerEvenement(evenement)">Supprimer</button>
              </div>

              <div
                v-if="role === 'ADMIN' && (statutEvenement(evenement) === STATUT_EVENEMENT.EN_ATTENTE || statutEvenement(evenement) === STATUT_EVENEMENT.REJETE)"
                class="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3"
              >
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-emerald-700"
                  @click="approuverEvenement(evenement)"
                ><i class="fa-solid fa-check"></i> Approuver</button>
                <button
                  v-if="statutEvenement(evenement) === STATUT_EVENEMENT.EN_ATTENTE"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50"
                  @click="ouvrirRejet(evenement)"
                ><i class="fa-solid fa-ban"></i> Rejeter</button>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-slate-400">Aucun événement pour ce filtre.</p>
        </div>

        <!-- Pagination ronde (style itinéraire) -->
        <div v-if="totalPageEvenements > 1" class="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            class="h-8 w-8 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100"
            @click="pageActuelle = Math.max(1, pageSafe - 1)"
          ><i class="fa-solid fa-chevron-left"></i></button>
          <button
            v-for="p in totalPageEvenements"
            :key="p"
            type="button"
            class="h-8 w-8 rounded-full text-xs font-bold transition"
            :class="p === pageSafe ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="pageActuelle = p"
          >{{ p }}</button>
          <button
            type="button"
            class="h-8 w-8 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100"
            @click="pageActuelle = Math.min(totalPageEvenements, pageSafe + 1)"
          ><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>

      <!-- Carte -->
      <div class="h-[500px] overflow-hidden rounded-[2rem] border border-slate-200 lg:sticky lg:top-20">
        <div id="carteItineraire" class="h-full w-full"></div>
      </div>
    </div>

    <!-- Modale de rejet (motif obligatoire) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="rejetOuvert" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" @click="fermerRejet">
          <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" @click.stop>
            <div class="mb-5 flex items-center gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600"><i class="fa-solid fa-circle-xmark"></i></span>
              <h2 class="text-xl font-black text-slate-950">Rejeter l'événement</h2>
            </div>

            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="motifRejetEvt">Motif du rejet *</label>
            <textarea
              id="motifRejetEvt"
              v-model="motifRejet"
              rows="3"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              placeholder="Explique au guide pourquoi son événement est refusé..."
            ></textarea>
            <p v-if="erreurMotifRejet" class="mt-1 text-xs text-rose-600">{{ erreurMotifRejet }}</p>

            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                @click="fermerRejet"
              >Annuler</button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700"
                @click="confirmerRejet"
              ><i class="fa-solid fa-ban"></i> Confirmer le rejet</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
