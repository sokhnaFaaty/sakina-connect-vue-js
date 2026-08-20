<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getGuideByUtilisateurId, getGroupeDuGuide } from '@/services/guideService.js';
import { getPelerinsDuGroupe } from '@/services/pelerinService.js';
import { getPlanningDuGroupe } from '@/services/planningService.js';

const auth = useAuthStore(); const pelerins = ref([]); const planning = ref([]); const groupeNom = ref('');
async function charger() {
  const guide = await getGuideByUtilisateurId(auth.utilisateur.id);
  const groupe = await getGroupeDuGuide(guide.id);
  if (groupe) { groupeNom.value = groupe.nom; pelerins.value = await getPelerinsDuGroupe(groupe.id); planning.value = await getPlanningDuGroupe(groupe.id); }
}
onMounted(charger);
</script>
<template>
  <section>
    <div class="mb-6 rounded-3xl bg-white border p-6"><h1 class="text-2xl font-black">Mon groupe : {{ groupeNom }}</h1></div>
    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div class="bg-white p-6 border rounded-2xl"><h2 class="font-black mb-4">Pèlerins ({{ pelerins.length }})</h2><div v-for="p in pelerins" :key="p.id" class="border-b py-2">{{ p.nomComplet }}</div></div>
      <div class="bg-white p-6 border rounded-2xl"><h2 class="font-black mb-4">Planning</h2><div v-for="p in planning" :key="p.id" class="border-b py-2">{{ p.titre }} ({{ p.date }})</div></div>
    </div>
  </section>
</template>