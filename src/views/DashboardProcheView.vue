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
    <header class="bg-gradient-to-r from-[#1f4d3a] to-[#0B6E4F] p-6 rounded-3xl text-white mb-6">
      <h1 class="text-3xl font-black">Portail Famille</h1>
    </header>
    <div v-if="pelerin" class="bg-white p-6 rounded-2xl border mb-6">
      <h2 class="font-black text-lg mb-2">Pèlerin suivi : {{ pelerin.nomComplet }}</h2>
      <p class="text-slate-600">Passeport : {{ pelerin.numeroPasseport }}</p>
    </div>
  </section>
</template>