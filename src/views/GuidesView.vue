<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast, useConfirm, useDrawer } from '@/composables/index.js';
import { getGuides, deleteGuide } from '@/services/guideService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import GuideForm from '@/components/forms/GuideForm.vue';

const guides = ref([]); const utilisateurs = ref([]); const vue = ref('card');
const { open: openDrawer } = useDrawer();
const { askConfirmation } = useConfirm();
const { success, error } = useToast();

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map(u => [u.id, u])));

async function charger() {
  try { [guides.value, utilisateurs.value] = await Promise.all([getGuides(), getUtilisateurs()]); } catch (e) { error(e.message); }
}
onMounted(charger);

function ouvrirFormulaire(guide = null) {
  openDrawer(GuideForm, { title: guide ? 'Modifier' : 'Ajouter', props: { guide, onSucces: charger } });
}
async function supprimer(g) {
  if (!await askConfirmation(`Archiver ${utilisateurMap.value[g.utilisateurId]?.nomComplet} ?`)) return;
  try { await deleteGuide(g.id); success('Guide archivé.'); charger(); } catch (e) { error(e.message); }
}
</script>
<template>
  <section>
    <PageHeader title="Annuaire des Guides" kicker="Équipe" subtitle="Gérez et affectez les guides.">
      <template #actions><AppButton @click="ouvrirFormulaire()">Ajouter un guide</AppButton></template>
    </PageHeader>
    <div class="mb-4 flex justify-end"><ViewToggle v-model="vue" /></div>
    <div v-if="vue === 'table'">
      <AppTable :colonnes="[{label:'Nom', render:g=>utilisateurMap[g.utilisateurId]?.nomComplet}, {label:'Téléphone', render:g=>utilisateurMap[g.utilisateurId]?.telephone}]" :lignes="guides" @modifier="ouvrirFormulaire" @supprimer="supprimer" />
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="g in guides" :key="g.id" class="rounded-2xl border p-4 bg-white">
        <p class="font-bold">{{ utilisateurMap[g.utilisateurId]?.nomComplet }}</p>
        <p class="text-sm">{{ utilisateurMap[g.utilisateurId]?.telephone }}</p>
        <div class="flex gap-2 mt-2"><AppButton variant="secondary" @click="ouvrirFormulaire(g)" size="sm">Modifier</AppButton><AppButton variant="danger" @click="supprimer(g)" size="sm">Archiver</AppButton></div>
      </div>
    </div>
  </section>
</template>