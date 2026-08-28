<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import {
  getAnnoncesVisibles,
  getGroupeIdDuLecteur,
  deleteAnnonce,
  statutAnnonce,
  STATUT_ANNONCE,
  approuverAnnonce
} from '@/services/annonceService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getGuides } from '@/services/guideService.js'
import { getGroupes } from '@/services/groupeService.js'
import { useToast, useConfirm, useModal } from '@/composables/index.js'
import AnnonceForm from '@/components/forms/AnnonceForm.vue'
import RejetMotifModal from '@/components/forms/RejetMotifModal.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { PageHeader, AppButton } from '@/components/ui/index.js'

const PER_PAGE = 3

const ROLE_LABELS = { ADMIN: 'Administrateur', GUIDE: 'Guide', PELERIN: 'Pèlerin', PROCHE: 'Proche' }
const STATUT_TABS = [
  { key: 'TOUS', label: 'Tous', icon: 'fa-layer-group' },
  { key: STATUT_ANNONCE.EN_ATTENTE, label: 'En attente', icon: 'fa-clock' },
  { key: STATUT_ANNONCE.APPROUVE, label: 'Approuvé', icon: 'fa-circle-check' },
  { key: STATUT_ANNONCE.REJETE, label: 'Rejeté', icon: 'fa-circle-xmark' },
]

const auth = useAuthStore()
const { open: openModal } = useModal()
const { askConfirmation } = useConfirm()
const { success, error } = useToast()

const annonces = ref([])
const groupes = ref([])
const utilisateurs = ref([])
const guides = ref([])
const monGroupeId = ref(null)
const search = ref('')
const urgentOnly = ref(false)
const statutFilter = ref('TOUS')
const chargement = ref(true)
const pageActuelle = ref(1)

const isAdmin = computed(() => auth.role === 'ADMIN')
const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map(u => [u.id, u])))
const guideMap = computed(() => Object.fromEntries(guides.value.map(g => [g.id, g])))

const peutPublier = computed(() => isAdmin.value || (auth.role === 'GUIDE' && !!monGroupeId.value))

async function charger() {
  chargement.value = true
  try {
    const [annoncesData, utilisateursData, guidesData, groupeIdLecteur, groupesData] = await Promise.all([
      getAnnoncesVisibles(auth.user, auth.role),
      getUtilisateurs(),
      getGuides(),
      getGroupeIdDuLecteur(auth.user, auth.role),
      auth.role === 'ADMIN' ? getGroupes() : Promise.resolve([]),
    ])
    annonces.value = annoncesData
    utilisateurs.value = utilisateursData
    guides.value = guidesData
    monGroupeId.value = groupeIdLecteur
    groupes.value = groupesData
  } catch (e) {
    error(e.message)
  } finally {
    chargement.value = false
  }
}
onMounted(charger)

function auteur(a) {
  let u = a.auteurId ? utilisateurMap.value[a.auteurId] : null
  if (!u && a.guideId && guideMap.value[a.guideId]) u = utilisateurMap.value[guideMap.value[a.guideId].utilisateurId]
  const nom = u?.nomComplet || 'Auteur inconnu'
  const roleLabel = u ? (ROLE_LABELS[u.role] || u.role) : ''
  return roleLabel ? `${nom} (${roleLabel})` : nom
}

const peutModifier = (a) => isAdmin.value || (a.auteurId && a.auteurId === auth.user?.id)
const peutSupprimer = (a) => peutModifier(a)

function libelleCible(a) {
  if (!a.groupeId) return 'Général'
  const nom = groupes.value.find(g => g.id === a.groupeId)?.nom
  return nom ? `Groupe : ${nom}` : 'Mon groupe'
}

const statutDe = (a) => statutAnnonce(a)
const numeroDe = (a) => annonces.value.indexOf(a) + 1

const annoncesFiltrees = computed(() => {
  let list = annonces.value
  if (isAdmin.value && statutFilter.value !== 'TOUS') list = list.filter(a => statutAnnonce(a) === statutFilter.value)
  if (urgentOnly.value) list = list.filter(a => a.urgence)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(a => `${a.titre} ${a.contenu}`.toLowerCase().includes(q))
  }
  return list
})

watch([search, urgentOnly, statutFilter], () => { pageActuelle.value = 1 })
const totalPages = computed(() => Math.max(1, Math.ceil(annoncesFiltrees.value.length / PER_PAGE)))
const annoncesPagines = computed(() =>
  annoncesFiltrees.value.slice((pageActuelle.value - 1) * PER_PAGE, pageActuelle.value * PER_PAGE)
)

const countStatut = (key) => {
  if (key === 'TOUS') return annonces.value.length
  return annonces.value.filter(a => statutAnnonce(a) === key).length
}

function ouvrirForm(annonce = null) {
  openModal(AnnonceForm, {
    title: annonce ? 'Modifier le communiqué' : 'Diffuser un message système',
    props: { annonce, user: auth.user, role: auth.role, groupes: groupes.value, monGroupeId: monGroupeId.value, onSuccess: charger }
  })
}

function ouvrirRejet(annonce) {
  openModal(RejetMotifModal, {
    title: 'Rejeter le communiqué',
    props: { annonce, onSuccess: charger }
  })
}

async function approuver(annonce) {
  try {
    await approuverAnnonce(annonce.id)
    success('Communiqué approuvé.')
    await charger()
  } catch (e) {
    error(e.message)
  }
}

async function supprimer(annonce) {
  const ok = await askConfirmation('Voulez-vous supprimer ce communiqué ?', { title: 'Confirmer la suppression', confirmLabel: 'OUI', cancelLabel: 'NON' })
  if (!ok) return
  try {
    await deleteAnnonce(annonce.id)
    success('Communiqué supprimé.')
    await charger()
  } catch (e) {
    error(e.message)
  }
}
</script>

<template>
  <section>
    <PageHeader kicker="Communication" title="Tableau d'affichage des communiqués" subtitle="Alertes en temps réel, consignes quotidiennes.">
      <template #actions>
        <AppButton v-if="peutPublier" @click="ouvrirForm()"><i class="fa-solid fa-plus"></i> Publier un Communiqué</AppButton>
      </template>
    </PageHeader>

    <div class="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800">
      <div class="relative flex-1">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
        <input v-model="search" type="text" placeholder="Rechercher des communiqués" class="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      <button @click="urgentOnly = !urgentOnly" type="button" class="rounded-2xl border px-4 py-3 text-sm font-bold transition" :class="urgentOnly ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-600'">
        {{ urgentOnly ? 'Afficher tous les communiqués' : 'Afficher uniquement les urgentes' }}
      </button>
    </div>

    <div v-if="isAdmin" class="mb-6 flex flex-wrap gap-2">
      <button v-for="tab in STATUT_TABS" :key="tab.key" @click="statutFilter = tab.key" class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition" :class="statutFilter === tab.key ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'">
        <i class="fa-solid" :class="tab.icon"></i> {{ tab.label }}
        <span class="rounded-full px-2 py-0.5 text-xs font-black" :class="statutFilter === tab.key ? 'bg-white/20 text-white' : 'bg-white text-slate-600 dark:bg-slate-600 dark:text-slate-100'">{{ countStatut(tab.key) }}</span>
      </button>
    </div>

    <AppLoader v-if="chargement" />
    <template v-else>
      <div class="grid gap-4">
        <div v-if="annoncesPagines.length === 0" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">Aucun communiqué{{ urgentOnly || search ? ' ne correspond à ce filtre' : '' }}.</div>
        <article v-for="annonce in annoncesPagines" :key="annonce.id" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800" :class="annonce.urgence ? 'border-l-4 border-l-[#B40909]' : ''">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A] dark:bg-slate-700/50 dark:text-[#BC7B3B]">A-{{ String(numeroDe(annonce)).padStart(2, '0') }}</span>
              <span v-if="annonce.groupeId" class="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-400"><i class="fa-solid fa-people-group"></i> {{ libelleCible(annonce) }}</span>
              <span v-else class="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-400"><i class="fa-solid fa-globe"></i> Général</span>
              <span v-if="annonce.urgence" class="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">Alerte Urgente</span>
              <span v-if="statutDe(annonce) === STATUT_ANNONCE.EN_ATTENTE" class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"><i class="fa-solid fa-clock"></i> En attente de validation</span>
              <span v-if="statutDe(annonce) === STATUT_ANNONCE.REJETE" class="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"><i class="fa-solid fa-circle-xmark"></i> Rejeté</span>
            </div>
            <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span><i class="fa-regular fa-calendar"></i> {{ (annonce.datePublication || '').slice(0, 10) }}</span>
              <span><i class="fa-regular fa-user"></i> {{ auteur(annonce) }}</span>
              <button v-if="peutModifier(annonce)" class="text-amber-500 hover:text-amber-700 dark:text-amber-400" title="Modifier" @click="ouvrirForm(annonce)"><i class="fa-solid fa-pen"></i></button>
              <button v-if="peutSupprimer(annonce)" class="text-rose-500 hover:text-rose-700 dark:text-rose-400" title="Supprimer" @click="supprimer(annonce)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <h3 class="font-black text-slate-950 dark:text-slate-100">{{ annonce.titre }}</h3>
          <p class="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{{ annonce.contenu }}</p>

          <div v-if="statutDe(annonce) === STATUT_ANNONCE.REJETE && annonce.motifRejet" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
            <i class="fa-solid fa-circle-exclamation"></i> Motif du rejet : {{ annonce.motifRejet }}
          </div>

          <div v-if="isAdmin && (statutDe(annonce) === STATUT_ANNONCE.EN_ATTENTE || statutDe(annonce) === STATUT_ANNONCE.REJETE)" class="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
            <button @click="approuver(annonce)" class="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-emerald-700">
              <i class="fa-solid fa-check"></i> Approuver
            </button>
            <button v-if="statutDe(annonce) === STATUT_ANNONCE.EN_ATTENTE" @click="ouvrirRejet(annonce)" class="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-extrabold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/40 dark:bg-slate-700 dark:text-rose-400 dark:hover:bg-rose-500/10">
              <i class="fa-solid fa-ban"></i> Rejeter
            </button>
          </div>
        </article>
      </div>
      <Pagination v-model:page="pageActuelle" :total-pages="totalPages" />
    </template>
  </section>
</template>
