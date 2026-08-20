<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js';
import { getGroupes } from '@/services/groupeService.js';
import { getGuides } from '@/services/guideService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getSos, getSosActifDuPelerin, declencherSos } from '@/services/sosService.js';
import { useConfirm } from '@/composables/useConfirm.js';
import { useToast } from '@/composables/useToast.js';

const auth = useAuthStore();
const pelerin = ref(null);
const sosActif = ref(null);
const sosResolus = ref([]);
const guideUtilisateur = ref(null);
const { demanderConfirmation } = useConfirm();
const { succes, erreur } = useToast();

async function charger() {
  pelerin.value = await getPelerinByUtilisateurId(auth.utilisateur.id);
  if (!pelerin.value) return;
  
  const [groupes, guides, utilisateurs, tousSos] = await Promise.all([
    getGroupes(), getGuides(), getUtilisateurs(), getSos()
  ]);
  const groupe = groupes.find(g => g.id === pelerin.value.groupeId);
  if (groupe) {
    const guide = guides.find(g => g.id === groupe.guideId);
    guideUtilisateur.value = guide ? utilisateurs.find(u => u.id === guide.utilisateurId) : null;
  }
  
  const mesSos = tousSos.filter(s => s.pelerinId === pelerin.value.id);
  sosActif.value = mesSos.find(s => s.statut === 'EN_ATTENTE') || null;
  sosResolus.value = mesSos.filter(s => s.statut === 'RESOLU');
}

async function lancerSos() {
  const ok = await demanderConfirmation("Envoyer ta position actuelle à ton guide ?");
  if (!ok) return;
  try {
    await declencherSos({ pelerinId: pelerin.value.id, guideId: null, commentaire: '' });
    succes("Alerte SOS envoyée ! De l'aide arrive.");
    await charger();
  } catch (e) { erreur(e.message); }
}

onMounted(charger);
</script>

<template>
  <section>
    <div class="mb-6 rounded-3xl bg-[#B40909] p-6 text-white shadow-sm">
      <h1 class="text-2xl font-black">Mon Espace SOS</h1>
      <p class="text-sm text-rose-100">Signale instantanément ta position si tu es perdu ou en danger.</p>
    </div>

    <!-- État SOS actif -->
    <div v-if="sosActif" class="mb-6 rounded-3xl border-2 border-rose-300 bg-rose-50 p-6">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white text-xl"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div>
          <h2 class="text-lg font-black text-rose-700">Alerte SOS en cours</h2>
          <p class="text-sm text-rose-600">Guide et administration alertés. Reste en place.</p>
          <p class="mt-2 text-xs text-slate-500">Localisation : {{ sosActif.latitude.toFixed(4) }}, {{ sosActif.longitude.toFixed(4) }}</p>
        </div>
      </div>
    </div>

    <!-- Bouton SOS (si pas d'alerte active) -->
    <div v-else class="mb-8 flex flex-col items-center gap-4 rounded-3xl border-2 border-rose-200 bg-rose-50 p-6 sm:flex-row sm:justify-between">
      <div>
        <h2 class="text-lg font-black text-rose-700">Aide d'urgence en cas d'égarement</h2>
        <p class="text-sm text-rose-600">Appuie sur le grand bouton si tu as besoin d'une assistance immédiate.</p>
      </div>
      <button @click="lancerSos" class="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-rose-600 text-lg font-black text-white shadow-lg shadow-rose-300 transition hover:bg-rose-700 active:scale-95">
        SOS
      </button>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <!-- Historique SOS résolus -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-black text-slate-950">Mes SOS précédents ({{ sosResolus.length }})</h2>
        <div v-for="s in sosResolus" :key="s.id" class="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-400">{{ new Date(s.dateHeure).toLocaleString() }}</p>
          <p class="flex items-center gap-1 text-sm text-slate-600"><i class="fa-solid fa-location-dot"></i> {{ s.latitude.toFixed(4) }}, {{ s.longitude.toFixed(4) }}</p>
          <span class="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">Résolu</span>
        </div>
        <p v-if="sosResolus.length === 0" class="text-sm text-slate-400">Aucun SOS résolu.</p>
      </div>

      <!-- Contact Guide -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-black text-slate-950">Mon guide</h2>
        <div class="flex items-center gap-3">
          <div class="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
            <img v-if="guideUtilisateur?.photo" :src="guideUtilisateur.photo" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user"></i></div>
          </div>
          <div>
            <p class="font-bold">{{ guideUtilisateur?.nomComplet || 'Non assigné' }}</p>
          </div>
        </div>
        <a :href="'tel:' + guideUtilisateur?.telephone" class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
          <i class="fa-solid fa-phone"></i> Appeler mon guide
        </a>
      </div>
    </div>
  </section>
</template>