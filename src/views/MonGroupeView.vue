<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast.js'
import { useAuthStore } from '@/stores/auth.js'
import { getGuideByUtilisateurId } from '@/services/guideService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getPelerins } from '@/services/pelerinService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getPlanning } from '@/services/planningService.js'
import { getHotels } from '@/services/hotelService.js'
import AppLoader from '@/components/ui/AppLoader.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import PelerinDetailModal from '@/components/ui/PelerinDetailModal.vue'

// Port fidèle de js/pages/monGroupePage.js — Mon groupe (côté GUIDE)
const PLANNING_PAR_PAGE = 2
const PELERINS_PAR_PAGE = 8

const auth = useAuthStore()
const { error: toastError } = useToast()

const chargement = ref(true)
const guide = ref(null)
const groupe = ref(null)
const pelerins = ref([])
const utilisateurs = ref([])
const planning = ref([])
const hotels = ref([])

onMounted(async () => {
  try {
    guide.value = await getGuideByUtilisateurId(auth.user.id)
    if (!guide.value) { chargement.value = false; return }

    const tousGroupes = await getGroupes()
    groupe.value = tousGroupes.find((g) => g.guideId === guide.value.id) || null
    if (!groupe.value) { chargement.value = false; return }

    const toutPlanning = await getPlanning()
    ;[pelerins.value, utilisateurs.value, hotels.value] = await Promise.all([
      getPelerins(), getUtilisateurs(), getHotels(),
    ])
    // Aides reprises des services Vanilla : getPelerinsDuGroupe + getPlanningDuGroupe
    pelerins.value = pelerins.value.filter((p) => p.groupeId === groupe.value.id && p.isActive !== false)
    planning.value = toutPlanning
      .filter((e) => e.groupeId === groupe.value.id)
      .sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`))
  } catch (e) { toastError(e.message) }
  finally { chargement.value = false }
})

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])))
const groupeMapSimple = computed(() => ({ [groupe.value?.id]: groupe.value }))
const nbApprouves = computed(() => pelerins.value.filter((p) => p.statutVisa === 'APPROUVE').length)
const pourcentageApprouves = computed(() =>
  pelerins.value.length ? Math.round((nbApprouves.value / pelerins.value.length) * 100) : 0
)

// Fiche détaillée d'un pèlerin du groupe
const pelerinDetaille = ref(null)

// Liste des pèlerins : recherche (nom / passeport) + pagination 8 par page
const searchTerm = ref('')
const pageActuelle = ref(1)

const pelerinsFiltres = computed(() => {
  const terme = searchTerm.value.trim().toLowerCase()
  return pelerins.value.filter((p) => {
    const nom = String(utilisateurMap.value[p.utilisateurId]?.nomComplet || '').toLowerCase()
    const passeport = String(p.numeroPasseport || '').toLowerCase()
    return !terme || nom.includes(terme) || passeport.includes(terme)
  })
})
const totalPagesPelerins = computed(() => Math.max(1, Math.ceil(pelerinsFiltres.value.length / PELERINS_PAR_PAGE)))
const pageSafePelerins = computed(() => Math.min(pageActuelle.value, totalPagesPelerins.value))
const pelerinsPage = computed(() => {
  const debut = (pageSafePelerins.value - 1) * PELERINS_PAR_PAGE
  return pelerinsFiltres.value.slice(debut, debut + PELERINS_PAR_PAGE)
})

// Planning : pagination locale 2 par page (boutons ronds comme en Vanilla)
const pagePlanning = ref(1)
const totalPagesPlanning = computed(() => Math.max(1, Math.ceil(planning.value.length / PLANNING_PAR_PAGE)))
const pageSafePlanning = computed(() => Math.min(pagePlanning.value, totalPagesPlanning.value))
const planningPage = computed(() => {
  const debut = (pageSafePlanning.value - 1) * PLANNING_PAR_PAGE
  return planning.value.slice(debut, debut + PLANNING_PAR_PAGE)
})

// Modale détail d'un événement du planning
const evenementDetaille = ref(null)
</script>

<template>
  <AppLoader v-if="chargement" message="Chargement de ton groupe…" />

  <!-- Aucun profil guide associé -->
  <section v-else-if="!guide" class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
    <p class="text-sm font-semibold text-amber-700">Aucun profil guide associé à ce compte.</p>
  </section>

  <!-- Aucun groupe assigné -->
  <section v-else-if="!groupe" class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
    <p class="text-sm font-semibold text-slate-500">Aucun groupe ne t'a encore été assigné.</p>
  </section>

  <section v-else>
    <div class="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <span class="mb-3 inline-block rounded-full bg-[#333D2A]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#333D2A]">Espace Guide Staff</span>
      <h1 class="font-display text-2xl font-black text-slate-950 sm:text-3xl">Mon groupe : {{ groupe.nom }}</h1>
      <p class="mt-1 text-sm text-slate-500">Gérez la logistique, suivez l'itinéraire et veillez sur la sécurité des pèlerins</p>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F2DE] text-[#333D2A]"><i class="fa-solid fa-users"></i></div>
        <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Effectif pèlerins</p>
        <p class="mt-1 text-2xl font-black text-slate-950">{{ pelerins.length }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Visas approuvés</p>
          <span class="text-xs font-bold text-slate-500">{{ pourcentageApprouves }}%</span>
        </div>
        <p class="mt-1 text-2xl font-black text-slate-950">{{ nbApprouves }}/{{ pelerins.length }}</p>
        <div class="mt-2 h-1.5 w-full rounded-full bg-slate-100">
          <div class="h-1.5 rounded-full bg-[#333D2A]" :style="{ width: pourcentageApprouves + '%' }"></div>
        </div>
      </div>
      <div class="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <p class="text-xs font-extrabold uppercase tracking-widest text-rose-600">SOS actifs</p>
        <p class="mt-1 text-2xl font-black text-rose-700">0</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><i class="fa-solid fa-clock"></i></div>
        <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Annonces publiées</p>
        <p class="mt-1 text-2xl font-black text-slate-950">0</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <article class="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-black text-slate-950">Liste de mon Groupe ({{ pelerins.length }})</h2>
        <div class="relative mb-4">
          <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
          <input
            v-model="searchTerm"
            type="search"
            placeholder="Rechercher un pèlerin (nom, passeport)…"
            class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm"
            @input="pageActuelle = 1"
          />
        </div>

        <div v-if="pelerinsPage.length" class="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse">
              <thead class="bg-slate-50">
                <tr>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Image</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Nom Complet</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Numéro Visa</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Statut Visa</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Fiche</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="p in pelerinsPage" :key="p.id" class="transition hover:bg-slate-50">
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                    <img v-if="utilisateurMap[p.utilisateurId]?.photo" :src="utilisateurMap[p.utilisateurId].photo" alt="" class="h-10 w-10 rounded-full object-cover" />
                    <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><i class="fa-solid fa-user"></i></div>
                  </td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700"><strong class="font-bold text-slate-950">{{ utilisateurMap[p.utilisateurId]?.nomComplet || '—' }}</strong></td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ p.numeroPasseport }}</td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                    <span v-if="p.statutVisa === 'APPROUVE'" class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Approuvé</span>
                    <span v-else class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{{ p.statutVisa }}</span>
                  </td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                    <button type="button" title="Voir la fiche" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-[#333D2A] hover:bg-slate-50" @click="pelerinDetaille = p">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
          Aucun pèlerin ne correspond à votre recherche.
        </div>

        <div class="mt-4 flex items-center justify-center gap-2">
          <AppPagination :current-page="pageSafePelerins" :total-pages="totalPagesPelerins" @navigate="pageActuelle = $event" />
        </div>
      </article>

      <article class="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
          <i class="fa-regular fa-clock text-[#BC7B3B]"></i> Planning de voyages
        </h2>
        <div class="grid gap-4">
          <template v-if="planning.length">
            <div
              v-for="(evenement, index) in planningPage"
              :key="evenement.id"
              class="cursor-pointer rounded-2xl border border-slate-100 bg-[#F2F2DE]/50 p-4 transition hover:bg-[#F2F2DE]"
              @click="evenementDetaille = evenement"
            >
              <span class="mb-2 inline-block rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Jour {{ (pageSafePlanning - 1) * PLANNING_PAR_PAGE + index + 1 }}</span>
              <h3 class="text-sm font-black text-slate-900">{{ evenement.titre }}</h3>
              <p class="mt-1 line-clamp-2 text-xs text-slate-500">{{ evenement.description }}</p>
              <p class="mt-2 text-xs text-slate-400"><i class="fa-solid fa-location-dot mr-1"></i>{{ evenement.lieu }}</p>
            </div>
          </template>
          <p v-else class="text-sm text-slate-400">Aucun événement planifié pour ce groupe.</p>
        </div>

        <div class="mt-4 flex items-center justify-center gap-2">
          <button
            v-for="p in totalPagesPlanning"
            :key="p"
            type="button"
            class="h-8 w-8 rounded-full text-xs font-bold transition"
            :class="p === pageSafePlanning ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="pagePlanning = p"
          >{{ p }}</button>
        </div>
      </article>
    </div>

    <!-- Modale détail d'un événement -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="evenementDetaille" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" @click="evenementDetaille = null">
          <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" @click.stop>
            <div class="mb-4 flex items-start gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F2DE] text-[#333D2A]"><i class="fa-solid fa-calendar-day"></i></span>
              <h2 class="text-lg font-black text-slate-950">{{ evenementDetaille.titre }}</h2>
            </div>
            <div class="grid gap-3 text-sm">
              <div class="flex justify-between"><span class="text-slate-500">Date :</span><span class="font-semibold">{{ evenementDetaille.date }} à {{ evenementDetaille.heure }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Lieu :</span><span class="font-semibold">{{ evenementDetaille.lieu }}</span></div>
              <p class="mt-2 leading-6 text-slate-700">{{ evenementDetaille.description }}</p>
            </div>
            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
                @click="evenementDetaille = null"
              >Fermer</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modale fiche pèlerin -->
    <PelerinDetailModal
      v-if="pelerinDetaille"
      :pelerin="pelerinDetaille"
      :utilisateur-map="utilisateurMap"
      :groupe-map="groupeMapSimple"
      :hotels="hotels"
      :guides="[guide]"
      @close="pelerinDetaille = null"
    />
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
