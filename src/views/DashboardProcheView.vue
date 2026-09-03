<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getProcheByUtilisateurId } from '@/services/procheService.js';
import { getPelerins } from '@/services/pelerinService.js';
import { getGroupes } from '@/services/groupeService.js';
import { getGuides } from '@/services/guideService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getSos } from '@/services/sosService.js';
import { useToast } from '@/composables/index.js';
import { AppLoader } from '@/components/ui/index.js';

const auth = useAuthStore();
const { error } = useToast();

const charge = ref(false);
const proche = ref(null);
const utilisateurMap = ref({});
const pelerin = ref(null);
const groupe = ref(null);
const guideUtilisateur = ref(null);
const sosActif = ref(null);

const pelerinUtilisateur = computed(() =>
  pelerin.value ? utilisateurMap.value[pelerin.value.utilisateurId] : null
);

const validations = computed(() => {
  const p = pelerin.value;
  if (!p) return [];
  return [
    { ok: !!p.numeroPasseport, label: 'Passeport scanné' },
    { ok: p.statutVisa === 'APPROUVE', label: 'Visa Omra / Hajj' },
    { ok: !!p.certificatVaccin, label: 'Vaccin obligatoire ACWY' },
  ];
});

const heureSos = computed(() =>
  sosActif.value
    ? new Date(sosActif.value.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : ''
);

onMounted(async () => {
  try {
    const procheTrouve = await getProcheByUtilisateurId(auth.user?.id);
    proche.value = procheTrouve;
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
    sosActif.value = sos.find((s) => s.pelerinId === pelerin.value.id && s.statut === 'EN_ATTENTE') || null;
  } catch (e) {
    error(e.message);
  } finally {
    charge.value = true;
  }
});
</script>

<template>
  <section>
    <header class="mb-6 rounded-3xl bg-gradient-to-r from-[#1f4d3a] to-[#0B6E4F] p-6 text-white shadow-sm sm:p-7">
      <span class="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider">Portail Famille &amp; Suivi Sécurité</span>
      <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Assalamu alaykum {{ auth.user?.nomComplet }}</h1>
      <p class="mt-1 max-w-2xl text-sm text-white/80">Bienvenue dans votre tableau de bord de sérénité. Suivez en direct le parcours spirituel et physique de votre proche.</p>
    </header>

    <AppLoader v-if="!charge" />
    <div v-else-if="!proche" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      Aucun pèlerin associé à votre compte.
    </div>
    <div v-else-if="!pelerin" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      Le pèlerin suivi est introuvable.
    </div>

    <template v-else>
      <p class="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Vous suivez actuellement</p>
      <div class="grid gap-4 lg:grid-cols-3">
        <article class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F] dark:text-emerald-400"><i class="fa-solid fa-user"></i> Pèlerin suivi</p>
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <img v-if="pelerinUtilisateur?.photo" :src="pelerinUtilisateur.photo" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-500"><i class="fa-solid fa-user"></i></div>
            </div>
            <p class="text-lg font-black text-slate-950 dark:text-slate-100">{{ pelerinUtilisateur?.nomComplet || '-' }}</p>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">ID : {{ pelerin.id.slice(0, 6).toUpperCase() }} &nbsp; Passeport : {{ pelerin.numeroPasseport }}</p>
          <p class="mt-4 text-xs text-slate-500 dark:text-slate-400">Statut de Sécurité :</p>
          <div class="mt-1">
            <span v-if="sosActif" class="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">Incident SOS Actif</span>
            <span v-else class="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Situation normale</span>
          </div>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F] dark:text-emerald-400"><i class="fa-solid fa-route"></i> Logistique &amp; Guide</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">Groupe :</p>
          <p class="mb-2 font-bold text-slate-800 dark:text-slate-100">{{ groupe?.nom || '-' }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">Guide responsable :</p>
          <p class="mb-3 font-bold text-slate-800 dark:text-slate-100">{{ guideUtilisateur?.nomComplet || '-' }}</p>
          <a
            v-if="guideUtilisateur?.telephone"
            :href="'tel:' + guideUtilisateur.telephone"
            class="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
          >
            <i class="fa-solid fa-phone"></i> Appeler
          </a>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F] dark:text-emerald-400"><i class="fa-solid fa-circle-info"></i> État général</p>
          <p class="text-sm font-bold text-slate-800 dark:text-slate-100">Suivi de groupe standard</p>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Le pèlerin suit actuellement le programme et les séances d'enseignements spirituels définis par son guide.</p>
        </article>
      </div>

      <article v-if="sosActif" class="mt-6 rounded-[2rem] border border-rose-200 bg-rose-50 p-6 dark:border-rose-500/40 dark:bg-rose-500/10">
        <h2 class="flex items-center gap-2 text-base font-black text-rose-700 dark:text-rose-400"><i class="fa-solid fa-triangle-exclamation"></i> SOS ACTIF – ALERTE DÉCLENCHÉE</h2>
        <p class="mt-1 text-sm font-bold text-rose-600 dark:text-rose-400">Dernière localisation transmise exclusivement du SOS (ceci ne représente pas un suivi GPS continu).</p>
        <div class="mt-4 grid gap-4 rounded-2xl bg-white p-4 sm:grid-cols-3 dark:bg-slate-800">
          <div>
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Latitude</p>
            <p class="font-bold text-slate-800 dark:text-slate-100">{{ String(sosActif.latitude ?? '-') }}</p>
          </div>
          <div>
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Longitude</p>
            <p class="font-bold text-slate-800 dark:text-slate-100">{{ String(sosActif.longitude ?? '-') }}</p>
          </div>
          <div>
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Heure</p>
            <p class="font-bold text-slate-800 dark:text-slate-100">{{ heureSos }}</p>
          </div>
        </div>
        <p class="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-rose-700 dark:bg-slate-800 dark:text-rose-400">Statut : Le guide est en cours d'intervention</p>
      </article>

      <p class="mb-3 mt-6 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Aperçu administratif de préparation</p>
      <div class="grid gap-3 sm:grid-cols-3">
        <div v-for="v in validations" :key="v.label" class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
          <span class="text-slate-600 dark:text-slate-300">{{ v.label }}</span>
          <span v-if="v.ok" class="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400"><i class="fa-solid fa-circle-check"></i> Valide</span>
          <span v-else class="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400"><i class="fa-solid fa-clock"></i> En attente</span>
        </div>
      </div>
    </template>
  </section>
</template>
