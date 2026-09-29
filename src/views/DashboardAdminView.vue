<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getPelerins } from '@/services/pelerinService.js';
import { getGroupes } from '@/services/groupeService.js';
import { getGuides } from '@/services/guideService.js';
import { getSos } from '@/services/sosService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getAnnonces } from '@/services/annonceService.js';
import { useToast } from '@/composables/index.js';
import { creerCarte } from '@/components/leafletMap.js';
import SosPanel from '@/components/ui/SosPanel.vue';
import Pagination from '@/components/ui/Pagination.vue';

const BULLETINS_PER_PAGE = 3;

const router = useRouter();
const { error } = useToast();

const pelerins = ref([]);
const groupes = ref([]);
const guides = ref([]);
const sos = ref([]);
const utilisateurs = ref([]);
const annonces = ref([]);
const sosActifs = ref([]);
const sosActif = ref(null);

const pelerinMap = computed(() => Object.fromEntries(pelerins.value.map((p) => [p.id, p])));
const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])));
const guideMap = computed(() => Object.fromEntries(guides.value.map((g) => [g.id, g])));

const nomResolver = (pelerinId) =>
  utilisateurMap.value[pelerinMap.value[pelerinId]?.utilisateurId]?.nomComplet || 'Pèlerin inconnu';

const problemesVisa = computed(() => pelerins.value.filter((p) => p.statutVisa !== 'APPROUVE').length);
const guidesAssignes = computed(() => new Set(groupes.value.map((g) => g.guideId).filter(Boolean)).size);

const auteurAnnonce = (a) => {
  let u = a.auteurId ? utilisateurMap.value[a.auteurId] : null;
  if (!u && a.guideId && guideMap.value[a.guideId]) u = utilisateurMap.value[guideMap.value[a.guideId].utilisateurId];
  return u?.nomComplet || 'Auteur';
};

const bulletinsPage = ref(1);
const bulletinsTotalPages = computed(() => Math.max(1, Math.ceil(annonces.value.length / BULLETINS_PER_PAGE)));
const bulletinsItems = computed(() =>
  annonces.value.slice((bulletinsPage.value - 1) * BULLETINS_PER_PAGE, bulletinsPage.value * BULLETINS_PER_PAGE)
);
watch(bulletinsTotalPages, (t) => {
  if (bulletinsPage.value > t) bulletinsPage.value = t;
});

async function charger() {
  try {
    const [p, g, gu, s, u, a] = await Promise.all([
      getPelerins(),
      getGroupes(),
      getGuides(),
      getSos(),
      getUtilisateurs(),
      getAnnonces(),
    ]);
    pelerins.value = p;
    groupes.value = g;
    guides.value = gu;
    sos.value = s;
    utilisateurs.value = u;
    annonces.value = a;
    sosActifs.value = s.filter((x) => x.statut === 'EN_ATTENTE');
    sosActif.value = sosActifs.value[0] || null;
  } catch (e) {
    error(e.message);
  }
}

onMounted(async () => {
  await charger();
  await nextTick();
  if (sosActif.value) {
    creerCarte('sosMapContainer', sosActif.value.latitude, sosActif.value.longitude);
  }
});

watch(sosActif, async () => {
  await nextTick();
  if (sosActif.value) {
    creerCarte('sosMapContainer', sosActif.value.latitude, sosActif.value.longitude);
  }
});
</script>

<template>
  <section>
    <header class="mb-6 rounded-3xl bg-[#333D2A] p-6 text-white shadow-sm sm:p-7">
      <span class="inline-block rounded-full bg-[#BC7B3B] px-3 py-1 text-xs font-black uppercase tracking-wider">Administration Système</span>
      <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Console du Siège Sakina</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-300">Suivi logistique en temps réel, validations des documents et secours SOS actifs.</p>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article class="rounded-3xl border-b-4 border-b-[#333D2A] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total des pèlerins</p>
          <i class="fa-solid fa-users text-[#333D2A] dark:text-[#BC7B3B]"></i>
        </div>
        <p class="text-3xl font-black text-slate-950 dark:text-slate-100">{{ pelerins.length }}</p>
        <p class="mt-2 text-xs text-slate-400 dark:text-slate-500">Actifs avant départ &amp; sur place</p>
      </article>

      <article class="rounded-3xl border-b-4 border-b-amber-500 border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Problèmes de visa</p>
          <i class="fa-solid fa-file-circle-exclamation text-amber-500"></i>
        </div>
        <p class="text-3xl font-black text-slate-950 dark:text-slate-100">{{ problemesVisa }}</p>
        <p class="mt-2 text-xs text-slate-400 dark:text-slate-500">En cours / manquants</p>
      </article>

      <article class="rounded-3xl border-b-4 border-b-rose-600 border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">SOS actives</p>
          <i class="fa-solid fa-circle-exclamation text-rose-600"></i>
        </div>
        <p class="text-3xl font-black text-slate-950 dark:text-slate-100">{{ sosActifs.length }}</p>
        <p class="mt-2 text-xs text-slate-400 dark:text-slate-500">Secours immédiat requis !</p>
      </article>

      <article class="rounded-3xl border-b-4 border-b-[#333D2A] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Guides assignés</p>
          <i class="fa-solid fa-user-tie text-[#333D2A] dark:text-[#BC7B3B]"></i>
        </div>
        <p class="text-3xl font-black text-slate-950 dark:text-slate-100">{{ guidesAssignes }}</p>
        <p class="mt-2 text-xs text-slate-400 dark:text-slate-500">Actifs avant départ &amp; sur place</p>
      </article>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <SosPanel :sos-actifs="sosActifs" :resolve-nom="nomResolver" @resolved="charger" />
        <div v-if="sosActif" id="sosMapContainer" class="mt-4 h-40 w-full overflow-hidden rounded-xl sm:h-64"></div>
      </article>

      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-slate-100"><i class="fa-solid fa-bell text-[#333D2A] dark:text-[#BC7B3B]"></i> Bulletins Système Actifs</h2>
          <button type="button" class="text-sm font-bold text-[#BC7B3B] hover:underline" @click="router.push('/annonces')">Gérer les Posts</button>
        </div>
        <div class="grid gap-3">
          <template v-if="annonces.length">
            <div
              v-for="a in bulletinsItems"
              :key="a.id"
              class="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/50"
              :class="a.urgence ? 'border-l-4 border-l-[#B40909]' : ''"
            >
              <div class="mb-1 flex items-center justify-between gap-2">
                <p class="font-bold text-slate-800 dark:text-slate-100">{{ a.titre }}</p>
                <span v-if="a.urgence" class="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">URGENT</span>
              </div>
              <p class="text-xs text-slate-500 line-clamp-2 dark:text-slate-400">{{ a.contenu }}</p>
              <p class="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{{ auteurAnnonce(a) }} · {{ (a.datePublication || '').slice(0, 10) }}</p>
            </div>
          </template>
          <p v-else class="text-sm text-slate-400 dark:text-slate-500">Aucun communiqué publié.</p>
        </div>
        <Pagination v-model:page="bulletinsPage" :total-pages="bulletinsTotalPages" />
      </article>
    </div>
  </section>
</template>
