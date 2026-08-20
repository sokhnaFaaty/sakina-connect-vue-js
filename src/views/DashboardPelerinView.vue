<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js';
import { getGroupeDuGuide, getGuideByUtilisateurId } from '@/services/guideService.js';
import { declencherSos } from '@/services/sosService.js';

const auth = useAuthStore(); const pelerin = ref(null); const guide = ref(null); const sosActif = ref(false);
async function charger() {
  pelerin.value = await getPelerinByUtilisateurId(auth.utilisateur.id);
}
onMounted(charger);

async function lancerSos() {
  try { await declencherSos({ pelerinId: pelerin.value.id }); sosActif.value = true; } catch(e) { alert(e.message); }
}
</script>
<template>
  <section>
    <div class="bg-[#333D2A] p-6 rounded-3xl text-white mb-6">
      <h1 class="text-3xl font-black">Assalamu alaykum, {{ auth.utilisateur.nomComplet }}</h1>
    </div>
    <div v-if="sosActif" class="border-2 border-rose-600 bg-rose-50 p-6 rounded-3xl mb-6">
      <h2 class="text-rose-700 font-black text-lg">Alerte SOS déclenchée !</h2>
      <p class="text-rose-600">L'équipe a été notifiée.</p>
    </div>
    <button v-else @click="lancerSos" class="h-32 w-32 rounded-full bg-rose-600 text-3xl font-black text-white shadow-2xl shadow-rose-300 mx-auto block active:scale-95 transition">
      SOS
    </button>
  </section>
</template>