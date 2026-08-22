<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { getGuideByUtilisateurId } from '@/services/guideService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getPelerins } from '@/services/pelerinService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getSos } from '@/services/sosService.js'
import { useToast } from '@/composables/useToast.js'
import AppPagination from '@/components/ui/AppPagination.vue'

// Port fidèle de js/pages/dashboardGuidePage.js — Console de Rassemblement du Groupe (GUIDE)
const PELERINS_PER_PAGE = 4

const router = useRouter()
const auth = useAuthStore()
const { error: toastError } = useToast()

const chargement = ref(true)
const messageInfo = ref(null) // 'guide-sans-profil' | 'guide-sans-groupe'

const groupe = ref(null)
const pelerins = ref([])
const utilisateurs = ref([])
const sosActifsGroupe = ref(0)

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])))

async function charger() {
  chargement.value = true
  messageInfo.value = null
  try {
    const guide = await getGuideByUtilisateurId(auth.user.id)
    if (!guide) { messageInfo.value = 'guide-sans-profil'; return }
    const groupes = await getGroupes()
    groupe.value = groupes.find((g) => g.guideId === guide.id) || null
    if (!groupe.value) { messageInfo.value = 'guide-sans-groupe'; return }

    const [tousPelerins, users, sos] = await Promise.all([getPelerins(), getUtilisateurs(), getSos()])
    pelerins.value = tousPelerins.filter((p) => p.groupeId === groupe.value.id)
    utilisateurs.value = users
    const idsPelerins = new Set(pelerins.value.map((p) => p.id))
    sosActifsGroupe.value = sos.filter((s) => s.statut === 'EN_ATTENTE' && idsPelerins.has(s.pelerinId)).length
  } catch (e) {
    toastError(e.message)
  } finally {
    chargement.value = false
  }
}
onMounted(charger)

// Recherche + pagination des pèlerins
const terme = ref('')
const page = ref(1)

const pelerinsFiltres = computed(() => {
  const q = terme.value.trim().toLowerCase()
  if (!q) return pelerins.value
  return pelerins.value.filter((p) => {
    const nom = String(utilisateurMap.value[p.utilisateurId]?.nomComplet || '').toLowerCase()
    const passeport = String(p.numeroPasseport || '').toLowerCase()
    return nom.includes(q) || passeport.includes(q)
  })
})

const totalPagePelerins = computed(() => Math.max(1, Math.ceil(pelerinsFiltres.value.length / PELERINS_PER_PAGE)))
const pageSafe = computed(() => Math.min(page.value, totalPagePelerins.value))
const pelerinsPage = computed(() => {
  const debut = (pageSafe.value - 1) * PELERINS_PER_PAGE
  return pelerinsFiltres.value.slice(debut, debut + PELERINS_PER_PAGE)
})

function rechercher(e) {
  terme.value = e.target.value
  page.value = 1
}
</script>

<template>
  <section>
    <header class="mb-6 rounded-3xl bg-gradient-to-r from-[#8a5a1f] to-[#BC7B3B] p-6 text-white shadow-sm sm:p-7">
      <span class="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider">Guide d'Omra Certifié (Oustadh)</span>
      <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Console de Rassemblement du Groupe</h1>
      <p class="mt-1 max-w-2xl text-sm text-white/80">Mettez à jour les plannings, consultez le manifeste des pèlerins et suivez les alertes SOS de votre groupe.</p>
    </header>

    <div v-if="messageInfo === 'guide-sans-profil'" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
      Aucun profil guide associé à ce compte.
    </div>
    <div v-else-if="messageInfo === 'guide-sans-groupe'" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
      Aucun groupe ne vous est encore assigné.
    </div>

    <template v-else>
      <div class="mb-6 grid gap-4 sm:grid-cols-3">
        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Nom du groupe</p>
            <i class="fa-solid fa-people-group text-[#333D2A]"></i>
          </div>
          <p class="text-2xl font-black text-slate-950">{{ groupe?.nom }}</p>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Mes pèlerins</p>
            <i class="fa-solid fa-user text-[#333D2A]"></i>
          </div>
          <p class="text-2xl font-black text-slate-950">{{ pelerins.length }} âmes actives</p>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Alerte SOS</p>
            <i class="fa-solid fa-circle-exclamation" :class="sosActifsGroupe > 0 ? 'text-rose-600' : 'text-[#333D2A]'"></i>
          </div>
          <p class="text-2xl font-black" :class="sosActifsGroupe > 0 ? 'text-rose-600' : 'text-slate-950'">
            {{ sosActifsGroupe > 0 ? `${sosActifsGroupe} urgence(s)` : 'Aucune' }}
          </p>
        </article>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-black text-slate-950">Liste des Pèlerins Assignés</h2>
          <div class="relative mb-4">
            <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
            <input
              type="search"
              placeholder="Rechercher un pèlerin (nom, passeport)…"
              class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm"
              @input="rechercher"
            />
          </div>

          <div v-if="pelerinsFiltres.length" class="grid gap-3">
            <div v-for="p in pelerinsPage" :key="p.id" class="flex items-center justify-between rounded-2xl bg-[#F2F2DE]/60 px-4 py-3">
              <div>
                <p class="font-bold text-slate-800">{{ utilisateurMap[p.utilisateurId]?.nomComplet || '-' }}</p>
                <p class="text-xs text-slate-500">Passeport : {{ p.numeroPasseport }}</p>
              </div>
              <span v-if="p.statutVisa === 'APPROUVE'" class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Approuvé</span>
              <span v-else class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{{ p.statutVisa }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-slate-400">
            {{ pelerins.length ? 'Aucun pèlerin ne correspond à votre recherche.' : 'Aucun pèlerin dans ce groupe.' }}
          </p>

          <AppPagination :current-page="pageSafe" :total-pages="totalPagePelerins" @navigate="page = $event" />
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-3 text-lg font-black text-slate-950">Directives Rapides du Guide</h2>
          <p class="text-sm leading-6 text-slate-600">Utilisez le panneau d'itinéraire de voyage pour ajouter des consignes sur les points de rassemblement. Informer régulièrement les pèlerins sur les rituels du jour permet de prévenir les égarements dans les foules.</p>
          <button
            type="button"
            class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#BC7B3B] px-4 py-3 text-sm font-extrabold text-white transition hover:opacity-90"
            @click="router.push('/itineraire')"
          >
            <i class="fa-solid fa-clock"></i> Allez au créateur d'itinéraire
          </button>
        </article>
      </div>
    </template>
  </section>
</template>
