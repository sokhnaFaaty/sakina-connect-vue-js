<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js';
import { getProcheByPelerinId } from '@/services/procheService.js';
import { getUtilisateurById } from '@/services/utilisateurService.js';
import { getGroupes } from '@/services/groupeService.js';
import { getPlanningDuGroupe } from '@/services/planningService.js';

const auth = useAuthStore();
const pelerin = ref(null);
const procheUser = ref(null);
const planning = ref([]);
const groupeNom = ref('');

onMounted(async () => {
  pelerin.value = await getPelerinByUtilisateurId(auth.utilisateur.id);
  if (pelerin.value) {
    const proche = await getProcheByPelerinId(pelerin.value.id);
    if (proche) procheUser.value = await getUtilisateurById(proche.utilisateurId);
    const groupes = await getGroupes();
    const groupe = groupes.find(g => g.id === pelerin.value.groupeId);
    if (groupe) {
      groupeNom.value = groupe.nom;
      planning.value = await getPlanningDuGroupe(groupe.id);
    }
  }
});
</script>

<template>
  <section>
    <div class="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-2xl font-black text-slate-950">Mon groupe : {{ groupeNom }}</h1>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <!-- Ma fiche Logistique -->
      <div class="rounded-2xl border border-t-4 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-black text-slate-950">Ma fiche Logistique</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl bg-[#F2F2DE]/60 p-4 text-sm">
            <p class="text-slate-500">Nom complet :</p>
            <p class="font-bold text-slate-800">{{ auth.utilisateur.nomComplet }}</p>
            <p class="text-slate-500 mt-2">Numéro de passeport :</p>
            <p class="font-bold text-slate-800">{{ pelerin?.numeroPasseport || '-' }}</p>
            <div v-if="procheUser" class="mt-4 border-t border-slate-200 pt-3">
              <p class="text-slate-500">Contact d'urgence (Proche) :</p>
              <p class="font-bold text-slate-800">{{ procheUser.nomComplet }}</p>
              <p class="text-slate-600">{{ procheUser.telephone }}</p>
            </div>
          </div>
          <div class="grid gap-2">
            <div class="flex justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span class="text-slate-600">Passeport</span>
              <span class="font-bold text-emerald-600">Complet</span>
            </div>
            <div class="flex justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span class="text-slate-600">Visa</span>
              <span :class="pelerin?.statutVisa === 'APPROUVE' ? 'text-emerald-600' : 'text-amber-600'" class="font-bold">
                {{ pelerin?.statutVisa === 'APPROUVE' ? 'Approuvé' : 'En attente' }}
              </span>
            </div>
            <div class="flex justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span class="text-slate-600">Certificat vaccin</span>
              <span class="font-bold text-emerald-600">Valide</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Planning -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-black text-slate-950">Planning de voyages</h2>
        <div v-for="(e, index) in planning" :key="e.id" class="mb-3 rounded-xl border border-slate-200 bg-white p-4">
          <span class="inline-block rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black text-white">Jour {{ index + 1 }}</span>
          <h3 class="mt-1 font-black text-slate-900">{{ e.titre }}</h3>
          <p class="mt-1 text-sm text-slate-500">{{ e.description }}</p>
        </div>
        <p v-if="planning.length === 0" class="text-sm text-slate-400">Aucun événement.</p>
      </div>
    </div>
  </section>
</template>