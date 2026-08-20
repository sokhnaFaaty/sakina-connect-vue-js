<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getProcheByUtilisateurId } from '@/services/procheService.js';
import { getPelerins } from '@/services/pelerinService.js';
import { getGroupes } from '@/services/groupeService.js';
import { getGuides } from '@/services/guideService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getSos } from '@/services/sosService.js';
import { getPlanningDuGroupe } from '@/services/planningService.js';
import { useToast } from '@/composables/useToast.js';

const auth = useAuthStore();
const pelerin = ref(null);
const guideUtilisateur = ref(null);
const planning = ref([]);
const dernierePosition = ref('Aucune position');
const derniereMaj = ref('—');

const { succes, erreur } = useToast();

onMounted(async () => {
  const proche = await getProcheByUtilisateurId(auth.utilisateur.id);
  if (!proche) return;

  const [pelerins, groupes, guides, utilisateurs, sos] = await Promise.all([
    getPelerins(), getGroupes(), getGuides(), getUtilisateurs(), getSos()
  ]);

  pelerin.value = pelerins.find(p => p.id === proche.pelerinId);
  if (pelerin.value) {
    const groupe = groupes.find(g => g.id === pelerin.value.groupeId);
    if (groupe) {
      const guide = guides.find(g => g.id === groupe.guideId);
      guideUtilisateur.value = guide ? utilisateurs.find(u => u.id === guide.utilisateurId) : null;
      planning.value = await getPlanningDuGroupe(groupe.id);
    }
    
    // Dernier SOS pour géoloc
    const mesSos = sos.filter(s => s.pelerinId === pelerin.value.id).sort((a,b) => String(b.dateHeure).localeCompare(String(a.dateHeure)));
    if (mesSos.length > 0) {
      dernierePosition.value = `${mesSos[0].latitude.toFixed(4)}, ${mesSos[0].longitude.toFixed(4)}`;
      derniereMaj.value = new Date(mesSos[0].dateHeure).toLocaleString();
    }
  }
});

function envoyerMessage() {
  const zone = document.getElementById('messageGuide');
  if (!zone.value.trim()) { erreur('Veuillez saisir un message.'); return; }
  zone.value = '';
  succes('Message transmis au guide.');
}
</script>

<template>
  <section>
    <div class="mb-6 rounded-3xl bg-gradient-to-r from-[#8a5a1f] to-[#BC7B3B] p-6 text-white shadow-sm">
      <h1 class="text-2xl font-black">Suivez le Parcours Sacré de votre proche</h1>
      <p class="text-sm text-white/80">Consultez sa position et son planning de voyage.</p>
    </div>

    <!-- Carte d'identité du Pèlerin -->
    <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p class="mb-3 text-xs font-extrabold uppercase text-slate-400">Vous suivez actuellement</p>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="flex items-center gap-3">
          <div class="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
            <img v-if="pelerin?.photo" :src="pelerin.photo" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user"></i></div>
          </div>
          <div>
            <p class="font-black">{{ pelerin?.nomComplet || '-' }}</p>
            <p class="text-xs text-slate-500">Passeport : {{ pelerin?.numeroPasseport }}</p>
          </div>
        </div>
        <div class="text-sm">
          <p class="text-slate-500">Guide responsable :</p>
          <p class="font-bold">{{ guideUtilisateur?.nomComplet || '-' }}</p>
        </div>
        <div class="text-sm">
          <p class="text-slate-500">Dernière position :</p>
          <p class="flex items-center gap-1 font-bold text-slate-800"><i class="fa-solid fa-location-dot text-rose-500"></i> {{ dernierePosition }}</p>
        </div>
        <div class="rounded-2xl bg-[#F2F2DE]/60 p-3 text-sm">
          <p class="text-xs uppercase text-slate-400">Dernière mise à jour</p>
          <p class="font-bold">{{ derniereMaj }}</p>
        </div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <!-- Planning et Validations -->
      <div class="rounded-2xl border border-t-4 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-black">Données de voyages consolidées</h2>
        <div class="mb-6 grid gap-2 sm:grid-cols-3">
          <div class="flex justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <span class="text-slate-600">Passeport</span>
            <span class="font-bold text-emerald-600">Vérifié</span>
          </div>
          <div class="flex justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <span class="text-slate-600">Visa</span>
            <span :class="pelerin?.statutVisa === 'APPROUVE' ? 'text-emerald-600' : 'text-amber-600'" class="font-bold">
              {{ pelerin?.statutVisa === 'APPROUVE' ? 'Délivré' : 'En attente' }}
            </span>
          </div>
          <div class="flex justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <span class="text-slate-600">Certificat vaccin</span>
            <span class="font-bold text-emerald-600">Valide</span>
          </div>
        </div>

        <h3 class="mb-3 text-xs uppercase text-[#0B6E4F]">Planning de groupe actif</h3>
        <div v-for="(e, index) in planning" :key="e.id" class="mb-3 rounded-xl border border-slate-200 bg-[#F2F2DE]/40 p-4">
          <div class="mb-1 flex justify-between">
            <span class="text-xs font-bold text-[#BC7B3B]">Jour {{ index + 1 }}</span>
          </div>
          <h4 class="font-black">{{ e.titre }}</h4>
          <p class="text-xs text-slate-500">{{ e.lieu }}</p>
        </div>
        <p v-if="planning.length === 0" class="text-sm text-slate-400">Aucun événement.</p>
      </div>

      <!-- Guide & Message -->
      <div class="grid gap-6">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-3 text-lg font-black">Guide assigné</h2>
          <p class="font-bold">{{ guideUtilisateur?.nomComplet || 'Non assigné' }}</p>
          <a :href="'tel:' + guideUtilisateur?.telephone" class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600">
            <i class="fa-solid fa-phone"></i> Appeler
          </a>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-2 text-lg font-black">Message au guide</h2>
          <p class="mb-3 text-xs text-slate-500">Besoin d'assistance ? Laissez un message ici.</p>
          <textarea id="messageGuide" rows="3" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Ex: Mon père a besoin de son inhalateur..."></textarea>
          <button @click="envoyerMessage" class="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90">
            <i class="fa-solid fa-paper-plane"></i> Envoyer le message
          </button>
        </div>
      </div>
    </div>
  </section>
</template>