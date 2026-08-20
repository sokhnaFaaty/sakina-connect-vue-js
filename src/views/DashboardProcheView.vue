<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getProcheByUtilisateurId } from '@/services/procheService.js';
import { getPelerins } from '@/services/pelerinService.js';

const auth = useAuthStore(); const pelerin = ref(null);
async function charger() {
  const proche = await getProcheByUtilisateurId(auth.utilisateur.id);
  if (proche) pelerin.value = (await getPelerins()).find(p => p.id === proche.pelerinId);
}
onMounted(charger);
</script>
<template>
  <section>
    <header class="bg-[#0B6E4F] text-white p-6 rounded-3xl mb-6"><h1 class="text-2xl font-black">Portail Famille</h1></header>
    <div class="bg-white p-6 rounded-2xl border"><p class="font-bold">Pèlerin suivi : {{ pelerin?.nomComplet || '-' }}</p></div>
  </section>
</template>