<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js';
import { declencherSos, getSosActifDuPelerin } from '@/services/sosService.js';
import { useToast, useConfirm } from '@/composables/index.js';

const auth = useAuthStore(); const pelerin = ref(null); const sosActif = ref(false);
const { askConfirmation } = useConfirm(); const { success, error } = useToast();

async function charger() {
  pelerin.value = await getPelerinByUtilisateurId(auth.utilisateur.id);
  sosActif.value = !!(await getSosActifDuPelerin(pelerin.value?.id));
}
onMounted(charger);
async function lancerSos() {
  if (!await askConfirmation('Envoyer ta position actuelle ?')) return;
  try { await declencherSos({ pelerinId: pelerin.value.id }); success('Alerte SOS envoyée.'); charger(); } catch (e) { error(e.message); }
}
</script>
<template>
  <section>
    <div class="bg-[#333D2A] p-6 rounded-3xl text-white mb-6"><h1 class="text-2xl font-black">Assalamu alaykum, {{ auth.utilisateur.nomComplet }}</h1></div>
    <div v-if="sosActif" class="border-2 border-rose-600 bg-rose-50 p-6 rounded-3xl"><h2 class="text-rose-700 font-black">Alerte SOS en cours !</h2></div>
    <button v-else @click="lancerSos" class="h-32 w-32 rounded-full bg-rose-600 text-3xl font-black text-white shadow-2xl mx-auto block active:scale-95">SOS</button>
  </section>
</template>