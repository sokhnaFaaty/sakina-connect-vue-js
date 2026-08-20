<script setup>
import { ref, onMounted } from 'vue';
import { useToast, useConfirm, useModal } from '@/composables/index.js';
import { getPelerins, deletePelerin } from '@/services/pelerinService.js';
import PelerinForm from '@/components/forms/PelerinForm.vue';

const pelerins = ref([]); const vue = ref('table');
const { ouvrir } = useModal(); const { demanderConfirmation } = useConfirm(); const { erreur, succes } = useToast();

async function charger() {
  try { pelerins.value = await getPelerins(); } catch (e) { erreur(e.message); }
}
onMounted(charger);

function ouvrirFormulaire(pelerin = null) {
  ouvrir(PelerinForm, { titre: pelerin ? 'Modifier' : 'Ajouter', props: { pelerin, onSucces: charger } });
}
async function supprimer(pelerin) {
  if (!await demanderConfirmation(`Archiver ${pelerin.nomComplet} ?`)) return;
  try { await deletePelerin(pelerin.id); succes('Pèlerin archivé.'); charger(); } catch (e) { erreur(e.message); }
}
</script>
<template>
  <section>
    <PageHeader kicker="Sécurité" title="Manifeste des Pèlerins" subtitle="Enregistrez et suivez les pèlerins.">
      <template #actions><AppButton @click="ouvrirFormulaire()">Ajouter un pèlerin</AppButton></template>
    </PageHeader>
    <div class="mb-4 flex justify-end"><ViewToggle v-model="vue" /></div>
    <AppTable v-if="vue === 'table'" :colonnes="['Nom', 'Passeport', 'Groupe', 'Visa']" :lignes="pelerins" @modifier="ouvrirFormulaire" @supprimer="supprimer" />
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CartePelerin v-for="p in pelerins" :key="p.id" :pelerin="p" @modifier="ouvrirFormulaire" @supprimer="supprimer" />
    </div>
  </section>
</template>