<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast, useConfirm, useDrawer } from '@/composables/index.js'
import { getGroupes, deleteGroupe } from '@/services/index.js'
import { getGuides } from '@/services/guideService.js'
import { getHotels } from '@/services/hotelService.js'
import { getPelerins } from '@/services/pelerinService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ViewToggle from '@/components/ui/ViewToggle.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import GroupeForm from '@/components/forms/GroupeForm.vue'

// Port fidèle de js/pages/groupesPage.js
const router = useRouter()
const { success, error: toastError } = useToast()
const { askConfirmation } = useConfirm()
const { open: openDrawer, isOpen: drawerOuvert } = useDrawer()

const groupes = ref([])
const guides = ref([])
const hotels = ref([])
const pelerins = ref([])
const utilisateurs = ref([])

const vue = ref(localStorage.getItem('sakina:view:groupes') || 'table')
function changerVue(v) {
  vue.value = v
  try { localStorage.setItem('sakina:view:groupes', v) } catch { /* ignore */ }
}

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])))

async function charger() {
  try {
    ;[groupes.value, guides.value, hotels.value, pelerins.value, utilisateurs.value] = await Promise.all([
      getGroupes(), getGuides(), getHotels(), getPelerins(), getUtilisateurs(),
    ])
  } catch (e) { toastError(e.message) }
}
onMounted(charger)

// Rechargement après fermeture du formulaire (GroupeForm émet 'close')
let formOuvertIci = false
watch(drawerOuvert, async (ouvert) => {
  if (!ouvert && formOuvertIci) {
    formOuvertIci = false
    await charger()
  }
})

function guideNom(g) {
  const guide = guides.value.find((x) => x.id === g.guideId)
  return utilisateurMap.value[guide?.utilisateurId]?.nomComplet || '-'
}

const nbPelerinsParGroupe = computed(() => {
  const compteur = {}
  pelerins.value.forEach((p) => {
    if (p.groupeId) compteur[p.groupeId] = (compteur[p.groupeId] || 0) + 1
  })
  return compteur
})

function ouvrirForm(groupe = null) {
  formOuvertIci = true
  openDrawer(GroupeForm, {
    title: groupe ? 'Modifier le groupe de Voyage' : 'Ajouter un groupe de Voyage',
    props: { groupe, guides: guides.value, hotels: hotels.value },
  })
}

async function supprimer(groupe) {
  if (!await askConfirmation(`Êtes-vous sûr de vouloir supprimer le groupe "${groupe.nom}" ? Il sera archivé et pourra être restauré.`)) return
  try {
    await deleteGroupe(groupe.id)
    success('Groupe archivé.')
    await charger()
  } catch (e) { toastError(e.message) }
}

// Modale détail du groupe
const detailOuvert = ref(false)
const groupeDetaille = ref(null)

function ouvrirDetail(groupe) {
  groupeDetaille.value = groupe
  detailOuvert.value = true
  searchTermDetail.value = ''
  pageDetail.value = 1
}

const hotelMecqueNom = computed(() => hotels.value.find((h) => h.id === groupeDetaille.value?.hotelMecqueId)?.nom || '-')
const hotelMedineNom = computed(() => hotels.value.find((h) => h.id === groupeDetaille.value?.hotelMedineId)?.nom || '-')
const guideDetailNom = computed(() => {
  const guide = guides.value.find((g) => g.id === groupeDetaille.value?.guideId)
  return guide ? utilisateurMap.value[guide.utilisateurId]?.nomComplet || '-' : '-'
})
const MEMBRES_PAR_PAGE = 5
const searchTermDetail = ref('')
const pageDetail = ref(1)

const pelerinsDuGroupe = computed(() =>
  groupeDetaille.value ? pelerins.value.filter((p) => p.groupeId === groupeDetaille.value.id) : []
)

const membresFiltres = computed(() => {
  const terme = searchTermDetail.value.trim().toLowerCase()
  return pelerinsDuGroupe.value.filter((p) => {
    const nom = String(utilisateurMap.value[p.utilisateurId]?.nomComplet || '').toLowerCase()
    const passeport = String(p.numeroPasseport || '').toLowerCase()
    return !terme || nom.includes(terme) || passeport.includes(terme)
  })
})
const totalPagesMembres = computed(() => Math.max(1, Math.ceil(membresFiltres.value.length / MEMBRES_PAR_PAGE)))
const pageSafeMembres = computed(() => Math.min(pageDetail.value, totalPagesMembres.value))
const membresPage = computed(() => {
  const debut = (pageSafeMembres.value - 1) * MEMBRES_PAR_PAGE
  return membresFiltres.value.slice(debut, debut + MEMBRES_PAR_PAGE)
})

function resetPageDetail() { pageDetail.value = 1 }
</script>

<template>
  <section>
    <PageHeader kicker="Organisation" title="Liste des Groupes" subtitle="Créer les groupes, assigner un guide et consulter les pèlerins affectés.">
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
          @click="router.push('/archives')"
        >
          <i class="fa-solid fa-trash-can-arrow-up"></i>
          <span>Corbeille</span>
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
          @click="ouvrirForm()"
        >
          <i class="fa-solid fa-plus"></i>
          <span>Nouveau groupe</span>
        </button>
      </template>
    </PageHeader>

    <div class="mb-4 flex justify-end">
      <ViewToggle :model-value="vue" @update:model-value="changerVue" />
    </div>

    <!-- Vue tableau -->
    <article v-if="vue === 'table'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div v-if="groupes.length" class="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead class="bg-slate-50">
              <tr>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">ID</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Nom du groupe</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Guide responsable</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Nombre de pèlerins</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="g in groupes" :key="g.id" class="transition hover:bg-slate-50">
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700"><span class="text-xs font-bold text-slate-400">{{ String(g.id).slice(0, 6).toUpperCase() }}</span></td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700"><strong class="font-bold text-slate-950">{{ g.nom }}</strong></td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ guideNom(g) }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ nbPelerinsParGroupe[g.id] || 0 }} pèlerins</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <div class="flex items-center gap-3 text-base">
                    <button type="button" class="text-slate-500 hover:text-slate-800" title="Voir" @click="ouvrirDetail(g)"><i class="fa-solid fa-eye"></i></button>
                    <button type="button" class="text-indigo-500 hover:text-indigo-700" title="Modifier" @click="ouvrirForm(g)"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="text-rose-500 hover:text-rose-700" title="Supprimer" @click="supprimer(g)"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucun groupe enregistré.
      </div>
    </article>

    <!-- Vue cartes -->
    <template v-else>
      <div v-if="groupes.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="g in groupes" :key="g.id" class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="flex-1 p-5">
            <div class="mb-2 flex items-start justify-between gap-2">
              <h3 class="font-black text-slate-950">{{ g.nom }}</h3>
              <span class="rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">{{ String(g.id).slice(0, 6).toUpperCase() }}</span>
            </div>
            <div class="mt-3 grid gap-2 text-sm text-slate-600">
              <p class="flex items-center gap-2"><i class="fa-solid fa-user-tie w-4 text-[#333D2A]"></i> {{ guideNom(g) }}</p>
              <p class="flex items-center gap-2"><i class="fa-solid fa-users w-4 text-[#333D2A]"></i> {{ nbPelerinsParGroupe[g.id] || 0 }} pèlerins</p>
              <p class="flex items-center gap-2"><i class="fa-solid fa-plane-departure w-4 text-[#333D2A]"></i> {{ g.dateDepart || '-' }} → {{ g.dateRetour || '-' }}</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 bg-[#F2F2DE]/70 px-5 py-3 text-base">
            <button type="button" class="text-slate-500 hover:text-slate-800" title="Voir" @click="ouvrirDetail(g)"><i class="fa-solid fa-eye"></i></button>
            <button type="button" class="text-indigo-500 hover:text-indigo-700" title="Modifier" @click="ouvrirForm(g)"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="text-rose-500 hover:text-rose-700" title="Supprimer" @click="supprimer(g)"><i class="fa-solid fa-trash"></i></button>
          </div>
        </article>
      </div>
      <div v-else class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Aucun groupe enregistré.</div>
    </template>

    <!-- Modale détail du groupe -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="detailOuvert && groupeDetaille" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" @click="detailOuvert = false">
          <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" @click.stop>
            <div class="mb-5 flex items-center justify-between">
              <h2 class="text-xl font-black text-slate-950"><i class="fa-solid fa-people-group mr-2 text-slate-700"></i>Détail du {{ groupeDetaille.nom }}</h2>
              <button type="button" class="text-slate-400 hover:text-slate-700" @click="detailOuvert = false"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl bg-[#F2F2DE] p-5">
                <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800">
                  <i class="fa-solid fa-user text-[#07744E]"></i> Informations générales
                </p>
                <dl class="grid gap-2 text-sm">
                  <div class="flex justify-between"><dt class="text-slate-500">ID du groupe :</dt><dd class="font-semibold">{{ String(groupeDetaille.id).slice(0, 6).toUpperCase() }}</dd></div>
                  <div class="flex justify-between"><dt class="text-slate-500">Nom :</dt><dd class="font-semibold">{{ groupeDetaille.nom }}</dd></div>
                  <div class="flex justify-between"><dt class="text-slate-500">Guide responsable :</dt><dd class="font-semibold">{{ guideDetailNom }}</dd></div>
                  <div class="flex justify-between"><dt class="text-slate-500">Pèlerins inscrits :</dt><dd class="font-semibold">{{ pelerinsDuGroupe.length }}</dd></div>
                </dl>
              </div>
              <div class="rounded-2xl bg-[#F2F2DE] p-4">
                <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800">
                  <i class="fa-solid fa-location-dot text-[#07744E]"></i> Informations de voyage
                </p>
                <dl class="grid gap-2 text-sm">
                  <div class="flex justify-between"><dt class="text-slate-500">Hôtel Mecque :</dt><dd class="font-semibold">{{ hotelMecqueNom }}</dd></div>
                  <div class="flex justify-between"><dt class="text-slate-500">Hôtel Médine :</dt><dd class="font-semibold">{{ hotelMedineNom }}</dd></div>
                  <div class="flex justify-between"><dt class="text-slate-500">Jour de départ :</dt><dd class="font-semibold">{{ groupeDetaille.dateDepart }}</dd></div>
                  <div class="flex justify-between"><dt class="text-slate-500">Jour de retour :</dt><dd class="font-semibold">{{ groupeDetaille.dateRetour }}</dd></div>
                </dl>
              </div>
            </div>

            <div class="mt-4">
              <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800">
                <i class="fa-solid fa-users text-[#07744E]"></i> Membres du groupe ({{ pelerinsDuGroupe.length }})
              </p>
              <div class="mb-3 relative">
                <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
                <input
                  v-model="searchTermDetail"
                  type="search"
                  placeholder="Rechercher un pèlerin (nom, passeport)…"
                  class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm"
                  @input="resetPageDetail"
                />
              </div>
              <div class="rounded-2xl border border-slate-200 p-4">
                <template v-if="membresPage.length">
                  <div v-for="p in membresPage" :key="p.id" class="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                    <span class="font-bold text-slate-800">{{ utilisateurMap[p.utilisateurId]?.nomComplet || '-' }}</span>
                    <span class="text-xs text-slate-500">Passeport : {{ p.numeroPasseport }} &nbsp; ID : {{ String(p.id).slice(0, 6).toUpperCase() }}</span>
                  </div>
                </template>
                <p v-else class="text-sm text-slate-400">Aucun pèlerin ne correspond à votre recherche.</p>
              </div>
              <AppPagination :current-page="pageSafeMembres" :total-pages="totalPagesMembres" @navigate="pageDetail = $event" />
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
                @click="detailOuvert = false"
              >Fermer</button>
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
