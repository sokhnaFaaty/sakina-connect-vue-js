<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { useToast, useModal } from '@/composables/index.js';
import { getGroupes } from '@/services/groupeService.js';
import { getPlanningDuGroupe, deletePlanningEvent } from '@/services/planningService.js';
import { getCategories } from '@/services/categorieService.js';
import { creerCarte, centrerCarteSur } from '@/components/leafletMap.js';
import PlanningForm from '@/components/forms/PlanningForm.vue';

const auth = useAuthStore(); const planning = ref([]); const categories = ref([]);
const conteneurCarte = ref(null); let carteInstance = null;
const groupeId = ref(null);
const { open: openModal } = useModal();
const { success, error } = useToast();

async function charger() {
  try {
    const groupes = await getGroupes();
    categories.value = await getCategories();
    groupeId.value = auth.role === 'GUIDE' ? groupes.find(g => g.guideId === auth.utilisateur.guideId)?.id : groupes[0]?.id;
    if (groupeId.value) planning.value = await getPlanningDuGroupe(groupeId.value);
  } catch (e) { error(e.message); }
}
onMounted(async () => { await charger(); initCarte(); });
onUnmounted(() => { if (carteInstance) { carteInstance.remove(); carteInstance = null; } });

function initCarte() {
  if (planning.value.length > 0 && conteneurCarte.value) {
    const p = planning.value[0];
    carteInstance = creerCarte(conteneurCarte.value.id, p.latitude || 21.4225, p.longitude || 39.8262);
  }
}
function voirSurCarte(e) {
  if (carteInstance && e.latitude) centrerCarteSur(e.latitude, e.longitude, e.titre);
}
function ouvrirFormulaire(evenement = null) {
  openModal(PlanningForm, { title: evenement ? 'Modifier' : 'Ajouter', props: { evenement, categories: categories.value, groupeId: groupeId.value, userId: auth.utilisateur.id, role: auth.role, onSucces: charger } });
}
async function supprimer(e) {
  try { await deletePlanningEvent(e.id); success('Événement supprimé.'); charger(); } catch (e) { error(e.message); }
}
</script>
<template>
  <section>
    <PageHeader title="Itinéraire de Voyage" kicker="Voyage" subtitle="Chronologie des rituels et logistique.">
      <template #actions><AppButton @click="ouvrirFormulaire()"><i class="fa-solid fa-plus"></i> Ajouter un événement</AppButton></template>
    </PageHeader>
    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div class="grid gap-4">
        <div v-for="e in planning" :key="e.id" @click="voirSurCarte(e)" class="cursor-pointer rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
          <h3 class="font-black">{{ e.titre }}</h3>
          <p class="text-sm text-slate-500">{{ e.date }} à {{ e.heure }} - {{ e.lieu }}</p>
          <div class="flex gap-2 mt-2">
            <AppButton variant="secondary" size="sm" @click.stop="ouvrirFormulaire(e)">Modifier</AppButton>
            <AppButton variant="danger" size="sm" @click.stop="supprimer(e)">Supprimer</AppButton>
          </div>
        </div>
      </div>
      <div class="h-[500px] rounded-2xl border overflow-hidden"><div ref="conteneurCarte" id="carteItineraire" class="h-full w-full"></div></div>
    </div>
  </section>
</template>