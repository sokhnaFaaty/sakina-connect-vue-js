<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast, useConfirm, useModal } from '@/composables/index.js'
import { useAuthStore } from '@/stores/auth.js'
import {
  getAnnonces,
  createAnnonce,
  updateAnnonce,
  deleteAnnonce,
} from '@/services/annonceService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getGuides } from '@/services/guideService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getPelerins } from '@/services/pelerinService.js'
import { getProcheByUtilisateurId } from '@/services/procheService.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import AnnonceForm from '@/components/forms/AnnonceForm.vue'

// Port fidèle de js/pages/annoncePage.js
const ROLE_LABELS = { ADMIN: 'Administrateur', GUIDE: 'Guide', PELERIN: 'Pèlerin', PROCHE: 'Proche' }
const PER_PAGE = 3

// Aides reprises de js/services/annonceService.js (les services Vue restent du CRUD simple)
const STATUT_ANNONCE = { EN_ATTENTE: 'EN_ATTENTE', APPROUVE: 'APPROUVE', REJETE: 'REJETE' }
function statutAnnonce(a) {
  return a.statut || STATUT_ANNONCE.APPROUVE
}

const STATUT_TABS = [
  { key: 'TOUS', label: 'Tous', icon: 'fa-layer-group' },
  { key: STATUT_ANNONCE.EN_ATTENTE, label: 'En attente', icon: 'fa-clock' },
  { key: STATUT_ANNONCE.APPROUVE, label: 'Approuvé', icon: 'fa-circle-check' },
  { key: STATUT_ANNONCE.REJETE, label: 'Rejeté', icon: 'fa-circle-xmark' },
]

const { success, error: toastError } = useToast()
const { askConfirmation } = useConfirm()
const { open: openModal, isOpen: modalOuvert } = useModal()
const auth = useAuthStore()

const annonces = ref([])
const utilisateurs = ref([])
const guides = ref([])
const groupes = ref([])
const pelerins = ref([])
const monGroupeId = ref(null)

async function charger() {
  try {
    const role = auth.role
    ;[annonces.value, utilisateurs.value, guides.value, groupes.value, pelerins.value] = await Promise.all([
      getAnnonces(), getUtilisateurs(), getGuides(), role === 'ADMIN' ? getGroupes() : Promise.resolve([]), getPelerins(),
    ])
    monGroupeId.value = await resoudreGroupeIdDuLecteur(auth.user, role)
    annonces.value.sort((a, b) => String(b.datePublication).localeCompare(String(a.datePublication)))
  } catch (e) { toastError(e.message) }
}

async function resoudreGroupeIdDuLecteur(user, role) {
  if (role === 'GUIDE') {
    const guide = guides.value.find((g) => g.utilisateurId === user.id)
    return groupes.value.find((g) => g.guideId === guide?.id)?.id || null
  }
  if (role === 'PELERIN') {
    return pelerins.value.find((p) => p.utilisateurId === user.id)?.groupeId || null
  }
  if (role === 'PROCHE') {
    const proche = await getProcheByUtilisateurId(user.id)
    if (!proche) return null
    return pelerins.value.find((p) => p.id === proche.pelerinId)?.groupeId || null
  }
  return null
}

onMounted(charger)

// Rechargement après fermeture du formulaire (AnnonceForm émet 'close')
let formOuvertIci = false
watch(modalOuvert, async (ouvert) => {
  if (!ouvert && formOuvertIci) {
    formOuvertIci = false
    await charger()
  }
})

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])))
const guideMap = computed(() => Object.fromEntries(guides.value.map((g) => [g.id, g])))
const groupeMap = computed(() => Object.fromEntries(groupes.value.map((g) => [g.id, g.nom])))

const role = computed(() => auth.role)
const peutPublier = computed(() => role.value === 'ADMIN' || (role.value === 'GUIDE' && !!monGroupeId.value))
const groupeIdPublication = computed(() => (role.value === 'GUIDE' ? monGroupeId.value : null))

function auteur(a) {
  let u = a.auteurId ? utilisateurMap.value[a.auteurId] : null
  if (!u && a.guideId && guideMap.value[a.guideId]) u = utilisateurMap.value[guideMap.value[a.guideId].utilisateurId]
  const nom = u?.nomComplet || 'Auteur inconnu'
  const roleLabel = u ? (ROLE_LABELS[u.role] || u.role) : ''
  return roleLabel ? `${nom} (${roleLabel})` : nom
}
const peutSupprimer = (a) => role.value === 'ADMIN' || (a.auteurId && a.auteurId === auth.user.id)
const peutModifier = (a) => role.value === 'ADMIN' || (a.auteurId && a.auteurId === auth.user.id)

function libelleCible(a) {
  if (!a.groupeId) return 'Général'
  const nom = groupeMap.value[a.groupeId]
  return nom ? `Groupe : ${nom}` : 'Mon groupe'
}

// Filtres + pagination locale (fidèles au Vanilla)
const search = ref('')
const urgentOnly = ref(false)
const statutFilter = ref('TOUS')
const page = ref(1)

const countStatut = (key) =>
  key === 'TOUS' ? annonces.value.length : annonces.value.filter((a) => statutAnnonce(a) === key).length

const listeFiltree = computed(() => {
  let list = annonces.value
  if (role.value === 'ADMIN' && statutFilter.value !== 'TOUS') list = list.filter((a) => statutAnnonce(a) === statutFilter.value)
  if (urgentOnly.value) list = list.filter((a) => a.urgence)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((a) => `${a.titre} ${a.contenu}`.toLowerCase().includes(q))
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(listeFiltree.value.length / PER_PAGE)))
const itemsPage = computed(() => {
  if (page.value > totalPages.value) page.value = totalPages.value
  const start = (page.value - 1) * PER_PAGE
  return listeFiltree.value.slice(start, start + PER_PAGE)
})

// Pagination affichée (fenêtre avec ellipsis, comme js/components/pagination.js)
const pagesVisibles = computed(() => {
  const total = totalPages.value
  const courante = page.value
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - courante) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  return pages
})
function allerPage(p) {
  if (p < 1 || p > totalPages.value || p === '…') return
  page.value = p
}

function basculerUrgent() {
  urgentOnly.value = !urgentOnly.value
  page.value = 1
}

function ouvrirForm(annonce = null) {
  formOuvertIci = true
  openModal(AnnonceForm, {
    title: annonce ? 'Modifier le communiqué' : 'Diffuser un message système',
    props: { annonce, user: auth.user, role: role.value, groupes: groupes.value },
  })
}

async function supprimer(a) {
  if (!await askConfirmation('Voulez-vous supprimer ce communiqué ?')) return
  try {
    await deleteAnnonce(a.id)
    success('Communiqué supprimé.')
    await charger()
  } catch (e) { toastError(e.message) }
}

// Modération inline (admin)
async function approuver(a) {
  try {
    await updateAnnonce(a.id, { statut: STATUT_ANNONCE.APPROUVE, motifRejet: '' })
    success('Communiqué approuvé.')
    await charger()
  } catch (e) { toastError(e.message) }
}

// Modale de rejet : le motif est obligatoire
const rejetOuvert = ref(false)
const annonceRejetee = ref(null)
const motifRejet = ref('')
const motifErreur = ref('')

function ouvrirRejet(a) {
  annonceRejetee.value = a
  motifRejet.value = ''
  motifErreur.value = ''
  rejetOuvert.value = true
}

async function confirmerRejet() {
  const motif = motifRejet.value.trim()
  if (!motif) {
    motifErreur.value = 'Le motif est obligatoire.'
    return
  }
  try {
    await updateAnnonce(annonceRejetee.value.id, { statut: STATUT_ANNONCE.REJETE, motifRejet: motif })
    rejetOuvert.value = false
    success('Communiqué rejeté.')
    await charger()
  } catch (e) { toastError(e.message) }
}
</script>

<template>
  <section>
    <PageHeader kicker="Communication" title="Tableau d'affichage des communiqués" subtitle="Alertes en temps réel, consignes quotidiennes.">
      <template #actions>
        <button
          v-if="peutPublier"
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
          @click="ouvrirForm()"
        >
          <i class="fa-solid fa-plus"></i>
          <span>Publier un Communiqué</span>
        </button>
      </template>
    </PageHeader>

    <div class="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input v-model="search" type="text" placeholder="Rechercher des communiqués" class="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm" @input="page = 1" />
      </div>
      <button
        type="button"
        class="rounded-2xl border px-4 py-3 text-sm font-bold transition"
        :class="urgentOnly ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
        @click="basculerUrgent"
      >
        {{ urgentOnly ? 'Afficher tous les communiqués' : 'Afficher uniquement les urgentes' }}
      </button>
    </div>

    <!-- Onglets de statut (admin) -->
    <div v-if="role === 'ADMIN'" class="mb-6 flex flex-wrap gap-2">
      <button
        v-for="t in STATUT_TABS"
        :key="t.key"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition"
        :class="statutFilter === t.key ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        @click="statutFilter = t.key; page = 1"
      >
        <i class="fa-solid" :class="t.icon"></i> {{ t.label }}
        <span class="rounded-full px-2 py-0.5 text-xs font-black" :class="statutFilter === t.key ? 'bg-white/20 text-white' : 'bg-white text-slate-600'">{{ countStatut(t.key) }}</span>
      </button>
    </div>

    <!-- Liste des communiqués -->
    <div class="grid gap-4">
      <template v-if="itemsPage.length">
        <article
          v-for="a in itemsPage"
          :key="a.id"
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          :class="a.urgence ? 'border-l-4 border-l-[#B40909]' : ''"
        >
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">A-{{ String(annonces.indexOf(a) + 1).padStart(2, '0') }}</span>
              <span v-if="a.groupeId" class="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700"><i class="fa-solid fa-people-group"></i> {{ libelleCible(a) }}</span>
              <span v-else class="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700"><i class="fa-solid fa-globe"></i> Général</span>
              <span v-if="a.urgence" class="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-700">Alerte Urgente</span>
              <span v-if="statutAnnonce(a) === STATUT_ANNONCE.EN_ATTENTE" class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700"><i class="fa-solid fa-clock"></i> En attente de validation</span>
              <span v-if="statutAnnonce(a) === STATUT_ANNONCE.REJETE" class="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700"><i class="fa-solid fa-circle-xmark"></i> Rejeté</span>
            </div>
            <div class="flex items-center gap-4 text-xs text-slate-500">
              <span><i class="fa-regular fa-calendar"></i> {{ (a.datePublication || '').slice(0, 10) }}</span>
              <span><i class="fa-regular fa-user"></i> {{ auteur(a) }}</span>
              <button v-if="peutModifier(a)" type="button" class="text-amber-500 hover:text-amber-700" title="Modifier" @click="ouvrirForm(a)"><i class="fa-solid fa-pen"></i></button>
              <button v-if="peutSupprimer(a)" type="button" class="text-rose-500 hover:text-rose-700" title="Supprimer" @click="supprimer(a)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <h3 class="font-black text-slate-950">{{ a.titre }}</h3>
          <p class="mt-1 whitespace-pre-line text-sm text-slate-600">{{ a.contenu }}</p>
          <div v-if="statutAnnonce(a) === STATUT_ANNONCE.REJETE && a.motifRejet" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            <i class="fa-solid fa-circle-exclamation"></i> Motif du rejet : {{ a.motifRejet }}
          </div>
          <div v-if="role === 'ADMIN' && (statutAnnonce(a) === STATUT_ANNONCE.EN_ATTENTE || statutAnnonce(a) === STATUT_ANNONCE.REJETE)" class="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
            <button type="button" class="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-emerald-700" @click="approuver(a)">
              <i class="fa-solid fa-check"></i> Approuver
            </button>
            <button v-if="statutAnnonce(a) === STATUT_ANNONCE.EN_ATTENTE" type="button" class="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-extrabold text-rose-600 transition hover:bg-rose-50" @click="ouvrirRejet(a)">
              <i class="fa-solid fa-ban"></i> Rejeter
            </button>
          </div>
        </article>
      </template>
      <div v-else class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        Aucun communiqué{{ urgentOnly || search ? ' ne correspond à ce filtre' : '' }}.
      </div>
    </div>

    <!-- Pagination -->
    <nav class="mt-8 flex items-center justify-center gap-1">
      <button
        type="button"
        :disabled="page === 1"
        class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        @click="allerPage(page - 1)"
      ><i class="fa-solid fa-chevron-left text-xs"></i></button>
      <button
        v-for="(p, i) in pagesVisibles"
        :key="`${p}-${i}`"
        type="button"
        class="h-9 min-w-9 rounded-xl px-2 text-sm font-extrabold transition"
        :class="p === page ? 'bg-[#333D2A] text-white shadow' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
        :disabled="p === '…'"
        @click="allerPage(p)"
      >{{ p }}</button>
      <button
        type="button"
        :disabled="page === totalPages"
        class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        @click="allerPage(page + 1)"
      ><i class="fa-solid fa-chevron-right text-xs"></i></button>
    </nav>

    <!-- Modale de rejet -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="rejetOuvert" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" @click="rejetOuvert = false">
          <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" @click.stop>
            <div class="mb-4 flex items-start gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><i class="fa-solid fa-circle-xmark"></i></span>
              <h2 class="text-lg font-black text-slate-950">Rejeter le communiqué</h2>
            </div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="motifRejet">Motif du rejet *</label>
            <textarea id="motifRejet" v-model="motifRejet" rows="3" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Explique au guide pourquoi sa publication est refusée..."></textarea>
            <p class="mt-1 text-xs text-rose-600">{{ motifErreur }}</p>
            <div class="mt-5 flex justify-end gap-3">
              <button type="button" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50" @click="rejetOuvert = false">Annuler</button>
              <button type="button" class="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700" @click="confirmerRejet">
                <i class="fa-solid fa-ban"></i> Confirmer le rejet
              </button>
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
