<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getProcheByUtilisateurId } from '@/services/procheService.js';
import { getPelerins } from '@/services/pelerinService.js';
import { getPlanningDuGroupe } from '@/services/planningService.js';
import { getCategories } from '@/services/categorieService.js';
import { getGroupes, getGuides, getUtilisateurs, getSos } from '@/services/index.js';
import { useToast } from '@/composables/index.js';
import { AppLoader } from '@/components/ui/index.js';

const PLANNING_PER_PAGE = 2;

const auth = useAuthStore();
const { success, error } = useToast();

const charge = ref(false);
const proche = ref(null);
const utilisateurMap = ref({});
const pelerin = ref(null);
const groupe = ref(null);
const guideUtilisateur = ref(null);
const planning = ref([]);
const categories = ref([]);
const sosList = ref([]);
const messageGuide = ref('');
const pageActuelle = ref(1);

const pelerinUtilisateur = computed(() =>
  pelerin.value ? utilisateurMap.value[pelerin.value.utilisateurId] || null : null
);

const categorieMap = computed(() =>
  Object.fromEntries(categories.value.map((c) => [c.id, c.libelle]))
);

const dernierSos = computed(() => {
  const mesSos = sosList.value
    .filter((s) => s.pelerinId === pelerin.value?.id)
    .sort((a, b) => String(b.dateHeure).localeCompare(String(a.dateHeure)));
  return mesSos[0] || null;
});

const localisation = computed(() =>
  dernierSos.value
    ? `${dernierSos.value.latitude.toFixed(4)}, ${dernierSos.value.longitude.toFixed(4)}`
    : 'Aucune position transmise'
);

const derniereMaj = computed(() =>
  dernierSos.value ? new Date(dernierSos.value.dateHeure).toLocaleString('fr-FR') : '—'
);

const validations = computed(() => {
  const p = pelerin.value;
  if (!p) return [];
  return [
    { ok: !!p.numeroPasseport, label: 'Passeport vérifié' },
    { ok: p.statutVisa === 'APPROUVE', label: 'Visa délivré' },
    { ok: !!p.certificatVaccin, label: 'Certificat vaccin' },
  ];
});

const joursUniques = computed(() => [...new Set(planning.value.map((e) => e.date))].sort());

function numeroJour(e) {
  return joursUniques.value.indexOf(e.date) + 1;
}

function categorieLabel(e) {
  return categorieMap.value[e.categorieId] || '';
}

const totalPages = computed(() => Math.max(1, Math.ceil(planning.value.length / PLANNING_PER_PAGE)));

const pageSure = computed(() => Math.min(pageActuelle.value, totalPages.value));

const evenementsPage = computed(() =>
  planning.value.slice((pageSure.value - 1) * PLANNING_PER_PAGE, pageSure.value * PLANNING_PER_PAGE)
);

function envoyerMessage() {
  if (!messageGuide.value.trim()) {
    error('Veuillez saisir un message.');
    return;
  }
  messageGuide.value = '';
  success('Message transmis au guide.');
}

function pagePrecedente() {
  if (pageSure.value > 1) pageActuelle.value = pageSure.value - 1;
}

function pageSuivante() {
  if (pageSure.value < totalPages.value) pageActuelle.value = pageSure.value + 1;
}

onMounted(async () => {
  try {
    proche.value = await getProcheByUtilisateurId(auth.user?.id);
    if (!proche.value) return;

    const [pelerins, groupes, guides, utilisateurs, sos] = await Promise.all([
      getPelerins(),
      getGroupes(),
      getGuides(),
      getUtilisateurs(),
      getSos(),
    ]);

    utilisateurMap.value = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
    pelerin.value = pelerins.find((p) => p.id === proche.value.pelerinId) || null;
    if (!pelerin.value) return;

    groupe.value = groupes.find((g) => g.id === pelerin.value.groupeId) || null;
    const guide = groupe.value ? guides.find((g) => g.id === groupe.value.guideId) : null;
    guideUtilisateur.value = guide ? utilisateurMap.value[guide.utilisateurId] || null : null;

    sosList.value = sos;

    const [planningGroupe, cats] = await Promise.all([
      getPlanningDuGroupe(groupe.value ? groupe.value.id : '___'),
      getCategories(),
    ]);
    planning.value = planningGroupe;
    categories.value = cats;
  } catch (e) {
    error(e.message);
  } finally {
    charge.value = true;
  }
});
</script>
<template>
  <section>
    <header class="mb-6 rounded-3xl bg-gradient-to-r from-[#8a5a1f] to-[#BC7B3B] p-6 text-white shadow-sm sm:p-7">
      <span class="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider">Centre de Sérénité des Familles</span>
      <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Suivez le Parcours Sacré de votre proche</h1>
      <p class="mt-1 max-w-2xl text-sm text-white/80">Consultez l'état de sa préparation administrative, sa dernière position transmise et son guide de voyage.</p>
    </header>

    <AppLoader v-if="!charge" />
    <div v-else-if="!proche" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      Aucun pèlerin associé à votre compte.
    </div>
    <div v-else-if="!pelerin" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      Le pèlerin suivi est introuvable.
    </div>

    <template v-else>
      <article class="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p class="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Vous suivez actuellement</p>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <img v-if="pelerinUtilisateur?.photo" :src="pelerinUtilisateur.photo" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-500"><i class="fa-solid fa-user"></i></div>
            </div>
            <div>
              <p class="font-black text-slate-900 dark:text-slate-100">{{ pelerinUtilisateur?.nomComplet || '-' }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">Passeport : {{ pelerin.numeroPasseport }}</p>
            </div>
          </div>
          <div class="text-sm">
            <p class="text-slate-500 dark:text-slate-400">Groupe :</p>
            <p class="font-bold text-slate-800 dark:text-slate-100">{{ groupe?.nom || '-' }}</p>
            <p class="mt-1 text-slate-500 dark:text-slate-400">Guide responsable :</p>
            <p class="font-bold text-slate-800 dark:text-slate-100">{{ guideUtilisateur?.nomComplet || '-' }}</p>
          </div>
          <div class="text-sm">
            <p class="text-slate-500 dark:text-slate-400">Dernière position :</p>
            <p class="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100"><i class="fa-solid fa-location-dot text-rose-500"></i> {{ localisation }}</p>
          </div>
          <div class="rounded-2xl bg-[#F2F2DE]/60 p-3 text-sm dark:bg-slate-700/50">
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Dernière mise à jour</p>
            <p class="font-bold text-slate-800 dark:text-slate-100">{{ derniereMaj }}</p>
          </div>
        </div>
      </article>

      <div class="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <article class="rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm dark:border-slate-700 dark:border-t-[#0B6E4F] dark:bg-slate-800">
          <div class="mb-4 flex items-start justify-between gap-2">
            <div>
              <p class="text-xs text-slate-400 dark:text-slate-500">Dossier de suivi : {{ pelerin.id.slice(0, 6).toUpperCase() }}</p>
              <h2 class="text-base font-black text-slate-950 dark:text-slate-100">Données de Voyages Consolidées</h2>
            </div>
            <div class="text-right">
              <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Départ approuvé</span>
              <p class="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Vérifié par le Siège Sakina</p>
            </div>
          </div>

          <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-clipboard-check"></i> Liste de validation administrative</p>
          <div class="mb-5 grid gap-3 sm:grid-cols-3">
            <div v-for="v in validations" :key="v.label" class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
              <span class="text-slate-600 dark:text-slate-300">{{ v.label }}</span>
              <span v-if="v.ok" class="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400"><i class="fa-solid fa-circle-check"></i> Complet</span>
              <span v-else class="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400"><i class="fa-solid fa-clock"></i> En attente</span>
            </div>
          </div>

          <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-clock"></i> Planning de groupe actif <span class="normal-case text-slate-400 dark:text-slate-500">(évitez d'appeler durant les rituels)</span></p>
          <div class="grid gap-3">
            <div v-if="planning.length === 0" class="text-sm text-slate-400 dark:text-slate-500">Aucun événement planifié pour l'instant.</div>
            <div v-for="e in evenementsPage" :key="e.id" class="rounded-2xl border border-slate-200 bg-[#F2F2DE]/40 p-4 dark:border-slate-700 dark:bg-slate-700/50">
              <div class="mb-1 flex items-center justify-between gap-2">
                <span class="text-xs font-black uppercase tracking-wider text-[#BC7B3B]">Jour {{ numeroJour(e) }} · {{ e.heure || '' }}</span>
                <span v-if="categorieLabel(e)" class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">{{ categorieLabel(e) }}</span>
              </div>
              <h3 class="font-black text-slate-900 dark:text-slate-100">{{ e.titre }}</h3>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ e.lieu || '' }}</p>
            </div>
          </div>
          <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              @click="pagePrecedente"
              :disabled="pageSure <= 1"
              class="flex h-9 items-center justify-center rounded-lg bg-[#333D2A] px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Précédent
            </button>
            <span class="text-sm font-bold text-slate-600 dark:text-slate-300">Page {{ pageSure }} / {{ totalPages }}</span>
            <button
              type="button"
              @click="pageSuivante"
              :disabled="pageSure >= totalPages"
              class="flex h-9 items-center justify-center rounded-lg bg-[#333D2A] px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </article>

        <div class="grid gap-6">
          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 class="mb-3 text-base font-black text-slate-950 dark:text-slate-100">Guide assigné</h2>
            <p class="font-bold text-slate-900 dark:text-slate-100">{{ guideUtilisateur?.nomComplet || 'Non assigné' }}</p>
            <p class="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">Guide &amp; chef de groupe</p>
            <p class="mt-3 text-sm"><span class="text-slate-500 dark:text-slate-400">Mobile :</span> <span class="font-bold text-slate-800 dark:text-slate-100">{{ guideUtilisateur?.telephone ? String(guideUtilisateur.telephone) : '-' }}</span></p>
            <p class="text-sm"><span class="text-slate-500 dark:text-slate-400">Email :</span> <span class="font-bold text-slate-800 dark:text-slate-100">{{ guideUtilisateur?.email || '-' }}</span></p>
            <a
              v-if="guideUtilisateur?.telephone"
              :href="'tel:' + guideUtilisateur.telephone"
              class="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              <i class="fa-solid fa-phone"></i> Appeler
            </a>
          </article>

          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 class="mb-2 text-base font-black text-slate-950 dark:text-slate-100">Message au guide</h2>
            <p class="mb-3 text-xs text-slate-500 dark:text-slate-400">Besoin de signaler au guide une consigne médicale importante ou un besoin d'assistance ? Laissez un message ici.</p>
            <textarea v-model="messageGuide" rows="3" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" placeholder="Ex: Mon père a besoin de son inhalateur de secours…"></textarea>
            <button type="button" @click="envoyerMessage" class="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90">
              <i class="fa-solid fa-paper-plane"></i> Envoyer le message
            </button>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>
