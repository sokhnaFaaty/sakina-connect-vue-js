<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast.js'
import { getPelerins, getGroupes, getGuides, getSos, getUtilisateurs, getAnnonces } from '@/services/index.js'
import SosPanel from '@/components/ui/SosPanel.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppLoader from '@/components/ui/AppLoader.vue'

// Port fidèle de js/pages/dashboardAdminPage.js — Console du Siège Sakina (ADMIN)
const BULLETINS_PER_PAGE = 3

const router = useRouter()
const { error: toastError } = useToast()

const pelerins = ref([])
const groupes = ref([])
const guides = ref([])
const sos = ref([])
const utilisateurs = ref([])
const annonces = ref([])
const chargement = ref(true)

const sosActifs = computed(() => sos.value.filter((s) => s.statut === 'EN_ATTENTE'))
const problemesVisa = computed(() => pelerins.value.filter((p) => p.statutVisa !== 'APPROUVE').length)
const guidesAssignes = computed(() => new Set(groupes.value.map((g) => g.guideId).filter(Boolean)).size)

const pelerinMap = computed(() => Object.fromEntries(pelerins.value.map((p) => [p.id, p])))
const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])))
const guideMap = computed(() => Object.fromEntries(guides.value.map((g) => [g.id, g])))

const nomResolver = (pelerinId) =>
  utilisateurMap.value[pelerinMap.value[pelerinId]?.utilisateurId]?.nomComplet || 'Pèlerin inconnu'

function auteurAnnonce(a) {
  let u = a.auteurId ? utilisateurMap.value[a.auteurId] : null
  if (!u && a.guideId && guideMap.value[a.guideId]) u = utilisateurMap.value[guideMap.value[a.guideId].utilisateurId]
  return u?.nomComplet || 'Auteur'
}

// Pagination des bulletins
const pageBulletins = ref(1)
const totalPageBulletins = computed(() => Math.max(1, Math.ceil(annonces.value.length / BULLETINS_PER_PAGE)))
const bulletinsPage = computed(() => {
  const safe = Math.min(pageBulletins.value, totalPageBulletins.value)
  return annonces.value.slice((safe - 1) * BULLETINS_PER_PAGE, safe * BULLETINS_PER_PAGE)
})

async function charger() {
  try {
    ;[pelerins.value, groupes.value, guides.value, sos.value, utilisateurs.value, annonces.value] = await Promise.all([
      getPelerins(),
      getGroupes(),
      getGuides(),
      getSos(),
      getUtilisateurs(),
      getAnnonces(),
    ])
  } catch (e) { toastError(e.message) }
  finally { chargement.value = false }
}
onMounted(charger)
</script>

<template>
  <AppLoader v-if="chargement" message="Chargement de la console…" />

  <section v-else>
    <header class="mb-6 rounded-3xl bg-[#333D2A] p-6 text-white shadow-sm sm:p-7">
      <span class="inline-block rounded-full bg-[#BC7B3B] px-3 py-1 text-xs font-black uppercase tracking-wider">Administration Système</span>
      <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Console du Siège Sakina</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-300">Suivi logistique en temps réel, validations des documents et secours SOS actifs.</p>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article class="rounded-3xl border-b-4 border-b-[#333D2A] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Total des pèlerins</p>
          <i class="fa-solid fa-users text-[#333D2A]"></i>
        </div>
        <p class="text-3xl font-black text-slate-950">{{ pelerins.length }}</p>
        <p class="mt-2 text-xs text-slate-400">Actifs avant départ &amp; sur place</p>
      </article>

      <article class="rounded-3xl border-b-4 border-b-amber-500 border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Problèmes de visa</p>
          <i class="fa-solid fa-file-circle-exclamation text-amber-500"></i>
        </div>
        <p class="text-3xl font-black text-slate-950">{{ problemesVisa }}</p>
        <p class="mt-2 text-xs text-slate-400">En cours / manquants</p>
      </article>

      <article class="rounded-3xl border-b-4 border-b-rose-600 border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">SOS actives</p>
          <i class="fa-solid fa-circle-exclamation text-rose-600"></i>
        </div>
        <p class="text-3xl font-black text-slate-950">{{ sosActifs.length }}</p>
        <p class="mt-2 text-xs text-slate-400">Secours immédiat requis !</p>
      </article>

      <article class="rounded-3xl border-b-4 border-b-[#333D2A] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Guides assignés</p>
          <i class="fa-solid fa-user-tie text-[#333D2A]"></i>
        </div>
        <p class="text-3xl font-black text-slate-950">{{ guidesAssignes }}</p>
        <p class="mt-2 text-xs text-slate-400">Actifs avant départ &amp; sur place</p>
      </article>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <SosPanel :sos-actifs="sosActifs" :nom-resolver="nomResolver" @resolved="charger" />
      </div>

      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-black text-slate-950"><i class="fa-solid fa-bell text-[#333D2A]"></i> Bulletins Système Actifs</h2>
          <button type="button" class="text-sm font-bold text-[#BC7B3B] hover:underline" @click="router.push('/annonces')">Gérer les Posts</button>
        </div>

        <div v-if="annonces.length" class="grid gap-3">
          <div
            v-for="a in bulletinsPage"
            :key="a.id"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            :class="{ 'border-l-4 border-l-[#B40909]': a.urgence }"
          >
            <div class="mb-1 flex items-center justify-between gap-2">
              <p class="font-bold text-slate-800">{{ a.titre }}</p>
              <span v-if="a.urgence" class="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">URGENT</span>
            </div>
            <p class="text-xs text-slate-500 line-clamp-2">{{ a.contenu }}</p>
            <p class="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ auteurAnnonce(a) }} · {{ (a.datePublication || '').slice(0, 10) }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">Aucun communiqué publié.</p>

        <AppPagination :current-page="pageBulletins" :total-pages="totalPageBulletins" @navigate="pageBulletins = $event" />
      </article>
    </div>
  </section>
</template>
