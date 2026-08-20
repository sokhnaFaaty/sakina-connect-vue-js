2<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { getGroupes } from '@/services/groupeService.js';
import { getPlanningDuGroupe } from '@/services/planningService.js';
import { getCategories } from '@/services/categorieService.js';
import { creerCarte, centrerCarteSur } from '@/components/leafletMap.js';
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore(); const planning = ref([]); const categories = ref([]);
const conteneurCarte = ref(null); let carteInstance = null;
const groupeId = ref(null); const evenementSelect = ref(null);

async function charger() {
  const groupes = await getGroupes();
  groupeId.value = auth.utilisateur.role === 'GUIDE' ? groupes.find(g => g.guideId === auth.utilisateur.guideId)?.id : groupes[0]?.id;
  if(!groupeId.value) return;
  planning.value = await getPlanningDuGroupe(groupeId.value);
  categories.value = await getCategories();
}
onMounted(async () => { await charger(); });

// Gestion de la carte
onMounted(() => {
  if (planning.value.length > 0 && conteneurCarte.value) {
    carteInstance = creerCarte(conteneurCarte.value.id, planning.value[0].latitude, planning.value[0].longitude);
  }
});
onUnmounted(() => { if (carteInstance) { carteInstance.remove(); carteInstance = null; } });

function voirSurCarte(e) {
  evenementSelect.value = e;
  if (carteInstance && e.latitude) centrerCarteSur(e.latitude, e.longitude, e.titre);
}
</script>
<template>
  <section>
    <PageHeader title="Itinéraire de Voyage" kicker="Voyage" subtitle="Chronologie des rituels et logistique." />
    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div class="mb-4 rounded-2xl border p-4 flex gap-2 flex-wrap">
          <!-- Filtres à implémenter ici -->
        </div>
        <div class="grid gap-4">
          <CarteEvenement v-for="e in planning" :key="e.id" :evenement="e" @voir-carte="voirSurCarte" />
        </div>
      </div>
      <div class="h-[500px] overflow-hidden rounded-2xl border relative">
        <div ref="conteneurCarte" id="carteItineraire" class="h-full w-full"></div>
      </div>
    </div>
  </section>
</template>