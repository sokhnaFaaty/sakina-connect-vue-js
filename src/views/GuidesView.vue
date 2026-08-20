<script setup>
import { ref, onMounted } from 'vue';
import { useToast, useConfirm, useModal } from '@/composables/index.js';
import { getGuides, deleteGuide } from '@/services/guideService.js';
import GuideForm from '@/components/forms/GuideForm.vue';

const guides = ref([]); const vue = ref('card');
const { ouvrir } = useModal(); const { demanderConfirmation } = useConfirm(); const { erreur, succes } = useToast();

async function charger() {
  try { guides.value = await getGuides(); } catch (e) { erreur(e.message); }
}
onMounted(charger);

function ouvrirFormulaire(guide = null) {
  ouvrir(GuideForm, { titre: guide ? 'Modifier' : 'Ajouter', props: { guide, onSucces: charger } });
}
async function supprimer(guide) {
  if (!await demanderConfirmation(`Archiver ce guide ?`)) return;
  try { await deleteGuide(guide.id); succes('Guide archivé.'); charger(); } catch (e) { erreur(e.message); }
}
</script>
<template>
  <section>
    <PageHeader title="Annuaire des Guides" kicker="Équipe" subtitle="Gérez et affectez les guides.">
      <template #actions><AppButton @click="ouvrirFormulaire()">Ajouter un guide</AppButton></template>
    </PageHeader>
    <div class="mb-4 flex justify-end"><ViewToggle v-model="vue" /></div>
    <div v-if="vue === 'table'"><AppTable :colonnes="['Nom', 'Téléphone', 'Dispo']" :lignes="guides" @modifier="ouvrirFormulaire" @supprimer="supprimer" /></div>
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CarteGuide v-for="g in guides" :key="g.id" :guide="g" @modifier="ouvrirFormulaire" @supprimer="supprimer" />
    </div>
  </section>
</template>