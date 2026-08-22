<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast.js'
import { useAuthStore } from '@/stores/auth.js'
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getPlanning } from '@/services/planningService.js'
import { getCategories } from '@/services/categorieService.js'
import { getProches } from '@/services/procheService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppLoader from '@/components/ui/AppLoader.vue'

// Port fidèle de js/pages/monGroupePelerinPage.js — Mon groupe (côté PELERIN)
const PLANNING_PER_PAGE = 2

const auth = useAuthStore()
const { error: toastError } = useToast()

const chargement = ref(true)
const pelerin = ref(null)
const groupe = ref(null)
const planning = ref([])
const categories = ref([])
const proches = ref([])
const utilisateurs = ref([])

onMounted(async () => {
  try {
    pelerin.value = await getPelerinByUtilisateurId(auth.user.id)
    if (!pelerin.value) { chargement.value = false; return }

    const groupes = await getGroupes()
    groupe.value = groupes.find((g) => g.id === pelerin.value.groupeId) || null
    if (!groupe.value) { chargement.value = false; return }

    const toutPlanning = await getPlanning()
    ;[categories.value, proches.value, utilisateurs.value] = await Promise.all([
      getCategories(), getProches(), getUtilisateurs(),
    ])
    // Aide reprise du service Vanilla : getPlanningDuGroupe
    planning.value = toutPlanning
      .filter((e) => e.groupeId === groupe.value.id)
      .sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`))
  } catch (e) { toastError(e.message) }
  finally { chargement.value = false }
})

// Le contact d'urgence, c'est le proche : on ne l'affiche que si le pèlerin en a un
const procheAssocie = computed(() =>
  pelerin.value ? proches.value.find((pr) => pr.pelerinId === pelerin.value.id) || null : null
)
const procheUser = computed(() =>
  procheAssocie.value ? utilisateurs.value.find((u) => u.id === procheAssocie.value.utilisateurId) || null : null
)

const categorieMap = computed(() => Object.fromEntries(categories.value.map((c) => [c.id, c.libelle])))

const joursUniques = computed(() => [...new Set(planning.value.map((e) => e.date))].sort())
function numeroJour(e) {
  return joursUniques.value.indexOf(e.date) + 1
}
function categorieLabel(e) {
  return categorieMap.value[e.categorieId] || ''
}

// Pagination locale 2 par page
const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(planning.value.length / PLANNING_PER_PAGE)))
const pageSafe = computed(() => Math.min(page.value, totalPages.value))
const itemsPage = computed(() => {
  const debut = (pageSafe.value - 1) * PLANNING_PER_PAGE
  return planning.value.slice(debut, debut + PLANNING_PER_PAGE)
})
</script>

<template>
  <AppLoader v-if="chargement" message="Chargement de ton groupe…" />

  <!-- Aucun profil pèlerin associé -->
  <section v-else-if="!pelerin" class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
    <p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p>
  </section>

  <!-- Aucun groupe assigné -->
  <section v-else-if="!groupe">
    <PageHeader kicker="Mon voyage" title="Mon groupe" subtitle="" />
    <div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Aucun groupe ne t'est encore assigné.</div>
  </section>

  <section v-else>
    <PageHeader kicker="Mon voyage" :title="`Mon groupe : ${groupe.nom}`" subtitle="Vos informations enregistrées et état de préparation." />

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <article class="rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-briefcase text-[#333D2A]"></i> Ma fiche Logistique</h2>

        <p class="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Identité &amp; contact d'urgence</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl bg-[#F2F2DE]/60 p-4 text-sm">
            <p class="text-slate-500">Nom complet :</p>
            <p class="mb-2 font-bold text-slate-800">{{ auth.user?.nomComplet || '-' }}</p>
            <p class="text-slate-500">Identifiant pèlerin :</p>
            <p class="mb-2 font-bold text-slate-800">{{ String(pelerin.id).slice(0, 6).toUpperCase() }}</p>
            <p class="text-slate-500">Numéro de passeport :</p>
            <p class="mb-2 font-bold text-slate-800">{{ pelerin.numeroPasseport || '-' }}</p>
            <template v-if="procheUser">
              <p class="text-slate-500">Contact d'urgence (proche) :</p>
              <p class="font-bold text-slate-800">{{ procheUser.nomComplet || '-' }}{{ procheAssocie.lienParente ? ` (${procheAssocie.lienParente})` : '' }}</p>
              <p class="text-slate-600">{{ procheUser.telephone || '' }}</p>
            </template>
          </div>
          <div class="grid gap-3">
            <!-- Badge état : Valide (vert) ou En attente (ambre) -->
            <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span class="text-slate-600">Passeport</span>
              <span v-if="!!pelerin.numeroPasseport" class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Complet</span>
              <span v-else class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>
            </div>
            <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span class="text-slate-600">Visa de voyage</span>
              <span v-if="pelerin.statutVisa === 'APPROUVE'" class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Approuvé</span>
              <span v-else class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>
            </div>
            <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span class="text-slate-600">Certification de vaccination</span>
              <span v-if="!!pelerin.certificatVaccin" class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Valide</span>
              <span v-else class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>
            </div>
            <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span class="text-slate-600">Tenue d'Ihram emballée</span>
              <span class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-clock text-[#333D2A]"></i> Planning de voyages</h2>
        <div class="grid gap-3">
          <template v-if="planning.length">
            <div v-for="e in itemsPage" :key="e.id" class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="mb-1 flex items-center justify-between gap-2">
                <span class="rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Jour {{ numeroJour(e) }}</span>
                <span v-if="categorieLabel(e)" class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{{ categorieLabel(e) }}</span>
              </div>
              <h3 class="font-black text-slate-900">{{ e.titre }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ e.description || '' }}</p>
              <p class="mt-2 flex items-center gap-1 text-xs text-slate-500"><i class="fa-solid fa-location-dot"></i> {{ e.lieu || '-' }} · {{ e.heure || '' }}</p>
            </div>
          </template>
          <p v-else class="text-sm text-slate-400">Aucun événement planifié pour l'instant.</p>
        </div>
        <AppPagination :current-page="pageSafe" :total-pages="totalPages" @navigate="page = $event" />
      </article>
    </div>
  </section>
</template>
