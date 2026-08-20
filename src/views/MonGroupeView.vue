<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getGuideByUtilisateurId, getGroupeDuGuide } from '@/services/guideService.js';
import { getPelerinsDuGroupe } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getPlanningDuGroupe } from '@/services/planningService.js';
import { getSos } from '@/services/sosService.js';
import { useModal } from '@/composables/useModal.js';

const auth = useAuthStore();
const pelerins = ref([]);
const utilisateurs = ref([]);
const planning = ref([]);
const sosActifs = ref(0);
const search = ref('');
const groupeNom = ref('');

const { ouvrir: ouvrirModal } = useModal();

const utilisateurMap = computed(() => 
  Object.fromEntries(utilisateurs.value.map(u => [u.id, u]))
);

const pelerinsFiltres = computed(() => {
  if (!search.value) return pelerins.value;
  const q = search.value.toLowerCase();
  return pelerins.value.filter(p => 
    (utilisateurMap.value[p.utilisateurId]?.nomComplet || '').toLowerCase().includes(q)
  );
});

async function charger() {
  const guide = await getGuideByUtilisateurId(auth.utilisateur.id);
  const groupe = await getGroupeDuGuide(guide.id);
  if (groupe) {
    groupeNom.value = groupe.nom;
    const [pels, users, plans, allSos] = await Promise.all([
      getPelerinsDuGroupe(groupe.id),
      getUtilisateurs(),
      getPlanningDuGroupe(groupe.id),
      getSos(),
    ]);
    pelerins.value = pels;
    utilisateurs.value = users;
    planning.value = plans;
    const idsPelerins = new Set(pels.map(p => p.id));
    sosActifs.value = allSos.filter(s => s.statut === 'EN_ATTENTE' && idsPelerins.has(s.pelerinId)).length;
  }
}

function ouvrirDetailEvenement(evenement) {
  ouvrirModal(null, {
    titre: evenement.titre,
    body: `<div class="grid gap-3 text-sm">
      <p><b>Date :</b> ${evenement.date} à ${evenement.heure}</p>
      <p><b>Lieu :</b> ${evenement.lieu}</p>
      <p>${evenement.description}</p>
    </div>`
  });
}

onMounted(charger);
</script>

<template>
  <section>
    <div class="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-2xl font-black text-slate-950">Mon groupe : {{ groupeNom }}</h1>
      <p class="text-sm text-slate-500">Gérez la logistique et veillez sur la sécurité des pèlerins</p>
    </div>

    <!-- Stats -->
    <div class="mb-6 grid gap-4 sm:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-xs font-extrabold uppercase text-slate-400">Effectif</p>
        <p class="text-2xl font-black text-slate-950">{{ pelerins.length }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-xs font-extrabold uppercase text-slate-400">SOS actifs</p>
        <p class="text-2xl font-black text-rose-700">{{ sosActifs }}</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <!-- Liste des Pèlerins -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-black text-slate-950">Liste de mon Groupe ({{ pelerins.length }})</h2>
        <div class="relative mb-4">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
          <input v-model="search" type="search" placeholder="Rechercher un pèlerin..." class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm" />
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th class="px-4 py-3">Image</th>
                <th class="px-4 py-3">Nom Complet</th>
                <th class="px-4 py-3">Passeport</th>
                <th class="px-4 py-3">Visa</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="p in pelerinsFiltres" :key="p.id" class="hover:bg-slate-50">
                <td class="px-4 py-3">
                  <img v-if="utilisateurMap[p.utilisateurId]?.photo" :src="utilisateurMap[p.utilisateurId].photo" class="h-10 w-10 rounded-full object-cover" />
                  <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><i class="fa-solid fa-user"></i></div>
                </td>
                <td class="px-4 py-3 font-bold">{{ utilisateurMap[p.utilisateurId]?.nomComplet || '-' }}</td>
                <td class="px-4 py-3 text-slate-700">{{ p.numeroPasseport }}</td>
                <td class="px-4 py-3">
                  <span v-if="p.statutVisa === 'APPROUVE'" class="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Approuvé</span>
                  <span v-else class="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{{ p.statutVisa }}</span>
                </td>
              </tr>
              <tr v-if="pelerins.length === 0"><td colspan="4" class="px-4 py-8 text-center text-slate-400">Aucun pèlerin.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Planning -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-black text-slate-950">Planning de voyages</h2>
        <div v-for="(e, index) in planning" :key="e.id" @click="ouvrirDetailEvenement(e)" class="cursor-pointer mb-3 rounded-xl border border-slate-100 bg-[#F2F2DE]/50 p-4 hover:bg-[#F2F2DE]">
          <span class="inline-block rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black text-white">Jour {{ index + 1 }}</span>
          <h3 class="mt-1 font-black text-slate-900">{{ e.titre }}</h3>
          <p class="mt-1 line-clamp-2 text-xs text-slate-500">{{ e.description }}</p>
        </div>
        <p v-if="planning.length === 0" class="text-sm text-slate-400">Aucun événement.</p>
      </div>
    </div>
  </section>
</template>