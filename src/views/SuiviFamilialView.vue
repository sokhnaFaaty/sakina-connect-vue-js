<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getProcheByUtilisateurId } from '@/services/procheService.js';
import { getPelerins } from '@/services/pelerinService.js';
import { getPlanningDuGroupe } from '@/services/planningService.js';

const auth = useAuthStore(); const pelerin = ref(null); const planning = ref([]);
onMounted(async () => {
  const p = await getProcheByUtilisateurId(auth.utilisateur.id);
  if (p) {
    pelerin.value = (await getPelerins()).find(pel => pel.id === p.pelerinId);
    if (pelerin.value) planning.value = await getPlanningDuGroupe(pelerin.value.groupeId);
  }
});
</script>
<template>
  <section>
    <PageHeader title="Suivi Familial" />
    <div class="bg-white p-6 rounded-2xl border"><p class="font-bold">Pèlerin : {{ pelerin?.nomComplet }}</p><div v-for="p in planning" :key="p.id" class="border-b py-2">{{ p.titre }} - {{ p.date }}</div></div>
  </section>
</template>