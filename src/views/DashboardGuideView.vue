<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getGuideByUtilisateurId, getGroupeDuGuide } from '@/services/guideService.js';
import { getPelerinsDuGroupe } from '@/services/pelerinService.js';

const auth = useAuthStore(); const pelerins = ref([]); const groupeNom = ref('');
async function charger() {
  const guide = await getGuideByUtilisateurId(auth.utilisateur.id);
  const g = await getGroupeDuGuide(guide.id);
  if (g) { groupeNom.value = g.nom; pelerins.value = await getPelerinsDuGroupe(g.id); }
}
onMounted(charger);
</script>
<template>
  <section>
    <header class="bg-[#BC7B3B] text-white p-6 rounded-3xl mb-6"><h1 class="text-2xl font-black">Console de Rassemblement</h1><p class="text-white/80">Groupe : {{ groupeNom }}</p></header>
    <div class="bg-white p-6 rounded-2xl border"><h2 class="font-black mb-4">Pèlerins ({{ pelerins.length }})</h2><div class="grid gap-2"> <div v-for="p in pelerins" :key="p.id" class="border-b py-2">{{ p.nomComplet }}</div></div></div>
  </section>
</template>