<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast, useConfirm, useDrawer } from '@/composables/index.js'
import { getGuides, deleteGuide } from '@/services/guideService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getGroupes } from '@/services/groupeService.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ViewToggle from '@/components/ui/ViewToggle.vue'
import GuideForm from '@/components/forms/GuideForm.vue'

// Port fidèle de js/pages/guidesPage.js
const router = useRouter()
const { success, error: toastError } = useToast()
const { askConfirmation } = useConfirm()
const { open: openDrawer, isOpen: drawerOuvert } = useDrawer()

const guides = ref([])
const utilisateurs = ref([])
const groupes = ref([])

async function charger() {
  try {
    ;[guides.value, utilisateurs.value, groupes.value] = await Promise.all([
      getGuides(), getUtilisateurs(), getGroupes(),
    ])
  } catch (e) { toastError(e.message) }
}
onMounted(charger)

// Rechargement après fermeture du formulaire (GuideForm émet 'close')
let formOuvertIci = false
watch(drawerOuvert, async (ouvert) => {
  if (!ouvert && formOuvertIci) {
    formOuvertIci = false
    await charger()
  }
})

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])))

const groupesParGuide = computed(() => {
  const map = {}
  groupes.value.forEach((g) => {
    if (g.guideId) {
      ;(map[g.guideId] = map[g.guideId] || []).push(g)
    }
  })
  return map
})

function groupesLabel(guide) {
  const gs = groupesParGuide.value[guide.id] || []
  return gs.length ? gs.map((g) => g.nom).join(', ') : 'Aucun groupe assigné'
}

// Vue cartes / tableau (défaut "card" comme en Vanilla)
const vue = ref(localStorage.getItem('sakina:view:guides') || 'card')
function changerVue(v) {
  vue.value = v
  try { localStorage.setItem('sakina:view:guides', v) } catch { /* ignore */ }
}

// Filtres : recherche (nom / téléphone / email) + groupe assigné
const searchTerm = ref('')
const groupeFilter = ref('')

const guidesFiltres = computed(() => {
  const terme = searchTerm.value.trim().toLowerCase()
  return guides.value.filter((guide) => {
    const u = utilisateurMap.value[guide.utilisateurId] || {}
    const nom = String(u.nomComplet ?? '').toLowerCase()
    const tel = String(u.telephone ?? '').toLowerCase()
    const email = String(u.email ?? '').toLowerCase()
    const matcheRecherche = !terme || nom.includes(terme) || tel.includes(terme) || email.includes(terme)
    const matcheGroupe = !groupeFilter.value || (groupesParGuide.value[guide.id] || []).some((g) => g.id === groupeFilter.value)
    return matcheRecherche && matcheGroupe
  })
})

function ouvrirForm(guide = null) {
  formOuvertIci = true
  openDrawer(GuideForm, {
    title: guide ? 'Modifier un Guide' : 'Ajouter un Guide',
    icon: 'fa-user-tie',
    props: { guide },
  })
}

async function supprimer(guide) {
  const nom = utilisateurMap.value[guide?.utilisateurId]?.nomComplet || ''
  if (!await askConfirmation(`Êtes-vous sûr de vouloir supprimer le guide "${nom}" ?\nLe guide sera archivé et pourra être restauré.`)) return
  try {
    await deleteGuide(guide.id)
    success('Guide archivé.')
    await charger()
  } catch (e) { toastError(e.message) }
}
</script>

<template>
  <section>
    <PageHeader kicker="Équipe" title="Guides Spirituels (Oustadhs/Oustadhas)" subtitle="Gérez et affectez les guides et leurs groupes.">
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
          <i class="fa-solid fa-user-plus"></i>
          <span>Ajouter un guide</span>
        </button>
      </template>
    </PageHeader>

    <!-- Barre de filtres -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative flex-1 sm:max-w-xs">
          <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
          <input
            v-model="searchTerm"
            type="search"
            placeholder="Rechercher un guide (nom, tél, email)…"
            class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <select v-model="groupeFilter" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:w-56">
          <option value="">Tous les groupes</option>
          <option v-for="g in groupes" :key="g.id" :value="g.id">{{ g.nom }}</option>
        </select>
      </div>
      <ViewToggle :model-value="vue" @update:model-value="changerVue" />
    </div>

    <!-- Vue tableau -->
    <article v-if="vue === 'table'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div v-if="guidesFiltres.length" class="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead class="bg-slate-50">
              <tr>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Image</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Nom</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Téléphone</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Email</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Disponibilité</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Groupes assignés</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="guide in guidesFiltres" :key="guide.id" class="transition hover:bg-slate-50">
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <img v-if="utilisateurMap[guide.utilisateurId]?.photo" :src="utilisateurMap[guide.utilisateurId].photo" alt="" class="h-10 w-10 shrink-0 rounded-full object-cover" />
                  <div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2F2DE] text-[#333D2A]"><i class="fa-solid fa-user-tie"></i></div>
                </td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700"><strong class="font-bold text-slate-950">{{ utilisateurMap[guide.utilisateurId]?.nomComplet || '-' }}</strong></td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ utilisateurMap[guide.utilisateurId]?.telephone || '-' }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ utilisateurMap[guide.utilisateurId]?.email || '-' }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <span v-if="guide.disponibilite" class="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700">En Service</span>
                  <span v-else class="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500">Indisponible</span>
                </td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ groupesLabel(guide) }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <div class="flex items-center gap-3 text-base">
                    <button type="button" class="text-indigo-500 hover:text-indigo-700" title="Modifier" @click="ouvrirForm(guide)"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="text-rose-500 hover:text-rose-700" title="Archiver" @click="supprimer(guide)"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucun guide ne correspond à votre recherche.
      </div>
    </article>

    <!-- Vue cartes -->
    <template v-else>
      <div v-if="guidesFiltres.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="guide in guidesFiltres" :key="guide.id" class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="flex-1 p-5">
            <div class="mb-3 flex items-start justify-between gap-2">
              <div class="flex items-center gap-3">
                <img v-if="utilisateurMap[guide.utilisateurId]?.photo" :src="utilisateurMap[guide.utilisateurId].photo" alt="" class="h-12 w-12 shrink-0 rounded-full object-cover" />
                <div v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F2F2DE] text-[#333D2A]"><i class="fa-solid fa-user-tie"></i></div>
                <div>
                  <h3 class="font-black text-slate-950">{{ utilisateurMap[guide.utilisateurId]?.nomComplet || 'Guide inconnu' }}</h3>
                  <span class="mt-1 inline-block rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">{{ String(guide.id).slice(0, 6).toUpperCase() }}</span>
                </div>
              </div>
              <span v-if="guide.disponibilite" class="shrink-0 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700">En Service</span>
              <span v-else class="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500">Indisponible</span>
            </div>

            <div class="mt-4 grid gap-2 text-sm text-slate-600">
              <p class="flex items-center gap-2"><i class="fa-solid fa-phone w-4 text-[#333D2A]"></i> {{ utilisateurMap[guide.utilisateurId]?.telephone || '-' }}</p>
              <p class="flex items-center gap-2"><i class="fa-solid fa-envelope w-4 text-[#333D2A]"></i> {{ utilisateurMap[guide.utilisateurId]?.email || '-' }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 bg-[#F2F2DE]/70 px-5 py-3">
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Groupe assigné</p>
              <p class="text-sm font-bold text-slate-800">{{ groupesLabel(guide) }}</p>
            </div>
            <div class="flex items-center gap-3 text-base">
              <button type="button" class="text-indigo-500 hover:text-indigo-700" title="Modifier" @click="ouvrirForm(guide)"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="text-rose-500 hover:text-rose-700" title="Archiver" @click="supprimer(guide)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Aucun guide ne correspond à votre recherche.</div>
    </template>
  </section>
</template>
