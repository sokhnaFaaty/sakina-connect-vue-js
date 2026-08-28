<script setup>
import { ref, computed, watch, onMounted, defineComponent, h } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { useToast } from '@/composables/index.js';
import { useModal } from '@/composables/useModal.js';
import { getGuideByUtilisateurId, getGroupeDuGuide } from '@/services/guideService.js';
import { getPelerinsDuGroupe } from '@/services/pelerinService.js';
import { getPlanningDuGroupe } from '@/services/planningService.js';
import { getHotels } from '@/services/hotelService.js';
import { getCategories } from '@/services/categorieService.js';
import Pagination from '@/components/ui/Pagination.vue';
import PelerinDetailModal from '@/components/forms/PelerinDetailModal.vue';

const PELERINS_PAR_PAGE = 8;
const PLANNING_PAR_PAGE = 2;

const auth = useAuthStore();
const { error: toastErreur } = useToast();
const { open: ouvrirModale } = useModal();

const chargement = ref(true);
const guide = ref(null);
const groupe = ref(null);
const pelerins = ref([]);
const utilisateurs = ref([]);
const planning = ref([]);
const hotels = ref([]);
const categorieMap = ref({});

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])));
const nbApprouves = computed(() => pelerins.value.filter((p) => p.statutVisa === 'APPROUVE').length);
const pourcentageApprouves = computed(() => (pelerins.value.length ? Math.round((nbApprouves.value / pelerins.value.length) * 100) : 0));

const termeRecherche = ref('');
const pagePelerins = ref(1);

const pelerinsFiltres = computed(() => {
  const t = termeRecherche.value.trim().toLowerCase();
  return pelerins.value.filter((p) => {
    const nom = String(utilisateurMap.value[p.utilisateurId]?.nomComplet || '').toLowerCase();
    const passeport = String(p.numeroPasseport || '').toLowerCase();
    return !t || nom.includes(t) || passeport.includes(t);
  });
});
const pelerinsTotalPages = computed(() => Math.max(1, Math.ceil(pelerinsFiltres.value.length / PELERINS_PAR_PAGE)));
const pelerinsPagines = computed(() => {
  const debut = (pagePelerins.value - 1) * PELERINS_PAR_PAGE;
  return pelerinsFiltres.value.slice(debut, debut + PELERINS_PAR_PAGE);
});
watch([pelerinsTotalPages, termeRecherche], () => {
  if (pagePelerins.value > pelerinsTotalPages.value) pagePelerins.value = pelerinsTotalPages.value;
});

const pagePlanning = ref(1);
const planningTotalPages = computed(() => Math.max(1, Math.ceil(planning.value.length / PLANNING_PAR_PAGE)));
const planningPagines = computed(() => {
  const debut = (pagePlanning.value - 1) * PLANNING_PAR_PAGE;
  return planning.value.slice(debut, debut + PLANNING_PAR_PAGE);
});
watch(planningTotalPages, (t) => {
  if (pagePlanning.value > t) pagePlanning.value = t;
});

function numeroJour(evenement) {
  const joursUniques = [...new Set(planning.value.map((e) => e.date))].sort();
  return joursUniques.indexOf(evenement.date) + 1;
}

async function charger() {
  chargement.value = true;
  try {
    guide.value = await getGuideByUtilisateurId(auth.user?.id);
    if (!guide.value) return;
    groupe.value = await getGroupeDuGuide(guide.value.id);
    if (!groupe.value) return;
    const [pels, users, planningData, hotelsData, categories] = await Promise.all([
      getPelerinsDuGroupe(groupe.value.id),
      getUtilisateurs(),
      getPlanningDuGroupe(groupe.value.id),
      getHotels(),
      getCategories(),
    ]);
    pelerins.value = pels;
    utilisateurs.value = users;
    planning.value = planningData;
    hotels.value = hotelsData;
    categorieMap.value = Object.fromEntries(categories.map((c) => [c.id, c.libelle]));
  } catch (e) {
    toastErreur(e.message);
  } finally {
    chargement.value = false;
  }
}
onMounted(charger);

function surRecherche() {
  pagePelerins.value = 1;
}

function ouvrirFiche(pelerin) {
  ouvrirModale(PelerinDetailModal, {
    title: '',
    props: {
      pelerin,
      utilisateurMap: utilisateurMap.value,
      groupe: groupe.value,
      hotels: hotels.value,
      guides: guide.value ? [guide.value] : [],
    },
  });
}

const PlanningDetailModal = defineComponent({
  props: {
    evenement: { type: Object, required: true },
  },
  emits: ['close'],
  setup(modalProps, { emit }) {
    return () =>
      h('div', [
          h('div', { class: 'grid gap-3 text-sm' }, [
          h('div', { class: 'flex justify-between' }, [
            h('span', { class: 'text-slate-500 dark:text-slate-400' }, 'Date :'),
            h('span', { class: 'font-semibold dark:text-slate-100' }, `${modalProps.evenement.date} à ${modalProps.evenement.heure}`),
          ]),
          h('div', { class: 'flex justify-between' }, [
            h('span', { class: 'text-slate-500 dark:text-slate-400' }, 'Lieu :'),
            h('span', { class: 'font-semibold dark:text-slate-100' }, modalProps.evenement.lieu),
          ]),
          h('p', { class: 'mt-2 leading-6 text-slate-700 dark:text-slate-300' }, modalProps.evenement.description),
        ]),
        h(
          'button',
          {
            type: 'button',
            class: 'mt-5 w-full rounded-2xl bg-[#333D2A] px-4 py-3 text-sm font-extrabold text-white transition hover:opacity-90',
            onClick: () => emit('close'),
          },
          'Fermer'
        ),
      ]);
  },
});

function ouvrirPlanningDetail(evenement) {
  ouvrirModale(PlanningDetailModal, {
    title: evenement.titre,
    props: { evenement },
  });
}
</script>
<template>
  <section v-if="!chargement && !guide" class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-500/40 dark:bg-amber-500/10">
    <p class="text-sm font-semibold text-amber-700 dark:text-amber-400">Aucun profil guide associé à ce compte.</p>
  </section>

  <section v-else-if="!chargement && !groupe" class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
    <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Aucun groupe ne t'a encore été assigné.</p>
  </section>

  <section v-else>
    <div class="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 dark:border-slate-700 dark:bg-slate-800">
      <span class="mb-3 inline-block rounded-full bg-[#333D2A]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#333D2A] dark:bg-[#BC7B3B]/20 dark:text-[#BC7B3B]">Espace Guide Staff</span>
      <h1 class="font-display text-2xl font-black text-slate-950 sm:text-3xl dark:text-slate-100">Mon groupe : {{ groupe?.nom }}</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Gérez la logistique, suivez l'itinéraire et veillez sur la sécurité des pèlerins</p>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F2DE] text-[#333D2A] dark:bg-slate-700/50 dark:text-[#BC7B3B]"><i class="fa-solid fa-users"></i></div>
        <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Effectif pèlerins</p>
        <p class="mt-1 text-2xl font-black text-slate-950 dark:text-slate-100">{{ pelerins.length }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div class="flex items-center justify-between">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Visas approuvés</p>
          <span class="text-xs font-bold text-slate-500 dark:text-slate-400">{{ pourcentageApprouves }}%</span>
        </div>
        <p class="mt-1 text-2xl font-black text-slate-950 dark:text-slate-100">{{ nbApprouves }}/{{ pelerins.length }}</p>
        <div class="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
          <div class="h-1.5 rounded-full bg-[#333D2A]" :style="{ width: pourcentageApprouves + '%' }"></div>
        </div>
      </div>
      <div class="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/40 dark:bg-rose-500/10">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <p class="text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">SOS actifs</p>
        <p class="mt-1 text-2xl font-black text-rose-700 dark:text-rose-400">0</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"><i class="fa-solid fa-clock"></i></div>
        <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Annonces publiées</p>
        <p class="mt-1 text-2xl font-black text-slate-950 dark:text-slate-100">0</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <article class="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 class="mb-4 text-lg font-black text-slate-950 dark:text-slate-100">Liste de mon Groupe ({{ pelerins.length }})</h2>
        <div class="relative mb-4">
          <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500"></i>
          <input
            v-model="termeRecherche"
            type="search"
            placeholder="Rechercher un pèlerin (nom, passeport)…"
            class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            @input="surRecherche"
          />
        </div>
        <div v-if="pelerinsFiltres.length === 0" class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
          Aucun pèlerin ne correspond à votre recherche.
        </div>
        <div v-else class="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse">
              <thead class="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Image</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Nom Complet</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Numéro Visa</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Statut Visa</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Fiche</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-for="p in pelerinsPagines" :key="p.id" class="transition hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    <img v-if="utilisateurMap[p.utilisateurId]?.photo" :src="utilisateurMap[p.utilisateurId].photo" class="h-10 w-10 rounded-full object-cover" />
                    <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-600 dark:text-slate-400"><i class="fa-solid fa-user"></i></div>
                  </td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    <strong class="font-bold text-slate-950 dark:text-slate-100">{{ utilisateurMap[p.utilisateurId]?.nomComplet || '—' }}</strong>
                  </td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">{{ p.numeroPasseport }}</td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    <span v-if="p.statutVisa === 'APPROUVE'" class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Approuvé</span>
                    <span v-else class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">{{ p.statutVisa }}</span>
                  </td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    <button
                      type="button"
                      title="Voir la fiche"
                      class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-[#333D2A] hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-[#BC7B3B] dark:hover:bg-slate-600"
                      @click="ouvrirFiche(p)"
                    >
                      <i class="fa-solid fa-eye"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <Pagination v-model:page="pagePelerins" :total-pages="pelerinsTotalPages" />
      </article>

      <article class="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-slate-100">
          <i class="fa-regular fa-clock text-[#BC7B3B]"></i> Planning de voyages
        </h2>
        <div class="grid gap-4">
          <p v-if="planning.length === 0" class="text-sm text-slate-400 dark:text-slate-500">Aucun événement planifié pour ce groupe.</p>
          <template v-else>
            <div
              v-for="e in planningPagines"
              :key="e.id"
              class="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
              @click="ouvrirPlanningDetail(e)"
            >
              <div class="mb-1 flex items-center justify-between gap-2">
                <span class="rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Jour {{ numeroJour(e) }}</span>
                <span v-if="categorieMap[e.categorieId]" class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">{{ categorieMap[e.categorieId] }}</span>
              </div>
              <h3 class="font-black text-slate-900 dark:text-slate-100">{{ e.titre }}</h3>
              <p class="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{{ e.description || '' }}</p>
              <p class="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><i class="fa-solid fa-location-dot"></i> {{ e.lieu || '-' }} · {{ e.heure || '' }}</p>
            </div>
          </template>
        </div>
        <Pagination v-model:page="pagePlanning" :total-pages="planningTotalPages" />
      </article>
    </div>
  </section>
</template>
