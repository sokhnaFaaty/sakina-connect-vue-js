<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js';
import { getGroupes } from '@/services/groupeService.js';
import { getPlanningDuGroupe } from '@/services/planningService.js';

const auth = useAuthStore(); const pelerin = ref(null); const planning = ref([]); const groupeNom = ref('');
onMounted(async () => {
  pelerin.value = await getPelerinByUtilisateurId(auth.utilisateur.id);
  if (pelerin.value) {
    const groupes = await getGroupes(); const g = groupes.find(x => x.id === pelerin.value.groupeId);
    if (g) { groupeNom.value = g.nom; planning.value = await getPlanningDuGroupe(g.id); }
  }
});
</script>
<template>
  <section>
    <div class="mb-6 rounded-3xl border bg-white p-6"><h1 class="text-2xl font-black">Mon groupe : {{ groupeNom }}</h1></div>
    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div class="bg-white p-6 border rounded-2xl"><h2 class="font-black">Ma fiche</h2><p>Nom : {{ auth.utilisateur.nomComplet }}</p><p>Passeport : {{ pelerin?.numeroPasseport }}</p></div>
      <div class="bg-white p-6 border rounded-2xl"><h2 class="font-black">Planning</h2><div v-for="p in planning" :key="p.id" class="border-b py-2">{{ p.titre }}</div></div>
    </div>
  </section>
</template>