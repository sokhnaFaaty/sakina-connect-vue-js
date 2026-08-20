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
    <header class="bg-gradient-to-r from-[#8a5a1f] to-[#BC7B3B] p-6 rounded-3xl text-white mb-6">
      <h1 class="text-3xl font-black">Console de Rassemblement</h1>
      <p class="text-white/80">Mon groupe : {{ groupeNom }}</p>
    </header>
    <div class="grid gap-4 sm:grid-cols-3 mb-6">
      <div class="bg-white p-4 rounded-xl border"><h3 class="text-xs text-slate-400">Pèlerins</h3><p class="text-2xl font-black">{{ pelerins.length }}</p></div>
    </div>
    <div class="bg-white p-6 rounded-2xl border">
      <h2 class="font-black mb-4">Liste des Pèlerins</h2>
      <AppTable :colonnes="['Nom', 'Passeport', 'Visa']" :lignes="pelerins" />
    </div>
  </section>
</template>