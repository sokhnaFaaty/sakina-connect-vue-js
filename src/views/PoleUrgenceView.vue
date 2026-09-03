<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { getSos } from '@/services/sosService.js';
import { getPelerins } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { useToast } from '@/composables/index.js';
import { creerCarte } from '@/components/leafletMap.js';
import PageHeader from '@/components/ui/PageHeader.vue';
import SosPanel from '@/components/ui/SosPanel.vue';
import Pagination from '@/components/ui/Pagination.vue';

const RESOLUS_PER_PAGE = 3;

const NUMEROS_URGENCE = [
  { nom: 'Secours National Saoudien', detail: 'Aide Générale et Sécurité', numero: '911' },
  { nom: 'Secours National Saoudien', detail: 'Urgences médicales', numero: '997' },
  { nom: 'Ministère du Hajj', detail: 'Assistance pèlerinage', numero: '922002814' },
];

const { error } = useToast();

const sos = ref([]);
const sosActifs = ref([]);
const sosActif = ref(null);
const pelerinMap = ref({});
const utilisateurMap = ref({});

const nomResolver = (pelerinId) =>
  utilisateurMap.value[pelerinMap.value[pelerinId]?.utilisateurId]?.nomComplet || 'Pèlerin inconnu';

const sosResolus = computed(() => sos.value.filter((s) => s.statut === 'RESOLU'));
const resolusPage = ref(1);
const resolusTotalPages = computed(() => Math.max(1, Math.ceil(sosResolus.value.length / RESOLUS_PER_PAGE)));
const resolusItems = computed(() =>
  sosResolus.value.slice((resolusPage.value - 1) * RESOLUS_PER_PAGE, resolusPage.value * RESOLUS_PER_PAGE)
);
watch(resolusTotalPages, (t) => {
  if (resolusPage.value > t) resolusPage.value = t;
});

async function charger() {
  try {
    const [allSos, pelerins, utilisateurs] = await Promise.all([
      getSos(),
      getPelerins(),
      getUtilisateurs(),
    ]);
    sos.value = allSos;
    pelerinMap.value = Object.fromEntries(pelerins.map((p) => [p.id, p]));
    utilisateurMap.value = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
    sosActifs.value = allSos.filter((s) => s.statut === 'EN_ATTENTE');
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
    <PageHeader
      kicker="Sécurité"
      title="Bureau d'Urgence et Intervention Rapide"
      subtitle="Pôle d'assistance critique d'égarement. Les pèlerins perdus peuvent signaler immédiatement leur position à toute l'équipe de guides."
    />

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <SosPanel :sos-actifs="sosActifs" :resolve-nom="nomResolver" @resolved="charger" />
        <div v-if="sosActif" id="sosMapContainer" class="mt-4 h-64 w-full"></div>
      </article>

      <div class="grid gap-6">
        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950 dark:text-slate-100">
            <i class="fa-solid fa-phone text-[#333D2A] dark:text-[#BC7B3B]"></i> Numéros d'Urgences Utiles
          </h2>
          <div class="grid gap-3">
            <div
              v-for="n in NUMEROS_URGENCE"
              :key="n.numero"
              class="flex items-center justify-between rounded-xl bg-[#F2F2DE] px-4 py-3 dark:bg-slate-700/50"
            >
              <div>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ n.nom }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ n.detail }}</p>
              </div>
              <span class="text-base font-black text-[#333D2A] dark:text-[#BC7B3B]">{{ n.numero }}</span>
            </div>
          </div>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 class="mb-4 text-base font-black text-slate-950 dark:text-slate-100">Registre des Cas Résolus</h2>
          <div class="grid gap-3">
            <template v-if="sosResolus.length">
              <div v-for="s in resolusItems" :key="s.id" class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/50">
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-400 dark:text-slate-500">{{ s.id.slice(0, 6).toUpperCase() }}</span>
                  <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Résolu</span>
                </div>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ nomResolver(s.pelerinId) }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ s.commentaire || 'Aucun commentaire.' }}</p>
              </div>
            </template>
            <p v-else class="text-sm text-slate-400 dark:text-slate-500">Aucun cas résolu pour l'instant.</p>
          </div>
          <Pagination v-model:page="resolusPage" :total-pages="resolusTotalPages" />
        </article>
      </div>
    </div>
  </section>
</template>
