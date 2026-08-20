<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast, useConfirm, useDrawer } from '@/composables/index.js';
import { getPelerins, deletePelerin } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getGroupes } from '@/services/groupeService.js';
import PelerinForm from '@/components/forms/PelerinForm.vue';

const pelerins = ref([]); const utilisateurs = ref([]); const groupes = ref([]);
const vue = ref('table');
const { open: openDrawer } = useDrawer();
const { askConfirmation } = useConfirm();
const { success, error } = useToast();

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map(u => [u.id, u])));
const groupeMap = computed(() => Object.fromEntries(groupes.value.map(g => [g.id, g.nom])));

async function charger() {
  try { [pelerins.value, utilisateurs.value, groupes.value] = await Promise.all([getPelerins(), getUtilisateurs(), getGroupes()]); } catch (e) { error(e.message); }
}
onMounted(charger);

function ouvrirFormulaire(pelerin = null) {
  openDrawer(PelerinForm, { title: pelerin ? 'Modifier' : 'Ajouter', props: { pelerin, groupes: groupes.value, onSucces: charger } });
}
async function supprimer(p) {
  if (!await askConfirmation(`Archiver ${utilisateurMap.value[p.utilisateurId]?.nomComplet} ?`)) return;
  try { await deletePelerin(p.id); success('Pèlerin archivé.'); charger(); } catch (e) { error(e.message); }
}

const colonnes = [
  { label: 'Nom', render: (p) => utilisateurMap.value[p.utilisateurId]?.nomComplet || '-' },
  { label: 'Passeport', key: 'numeroPasseport' },
  { label: 'Groupe', render: (p) => groupeMap.value[p.groupeId] || '-' },
  { label: 'Visa', render: (p) => p.statutVisa === 'APPROUVE' ? '✅ Approuvé' : '⏳ En attente' }
];
</script>
<template>
  <section>
    <PageHeader kicker="Sécurité" title="Manifeste des Pèlerins" subtitle="Enregistrez et suivez les pèlerins.">
      <template #actions><AppButton @click="ouvrirFormulaire()">Ajouter un pèlerin</AppButton></template>
    </PageHeader>
    <div class="mb-4 flex justify-end"><ViewToggle v-model="vue" /></div>
    <AppTable v-if="vue === 'table'" :colonnes="colonnes" :lignes="pelerins" @modifier="ouvrirFormulaire" @supprimer="supprimer" />
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="p in pelerins" :key="p.id" class="rounded-2xl border p-4 bg-white">
        <h3 class="font-bold">{{ utilisateurMap[p.utilisateurId]?.nomComplet }}</h3>
        <p class="text-sm">Passeport : {{ p.numeroPasseport }}</p>
        <div class="flex gap-2 mt-2"><AppButton variant="secondary" @click="ouvrirFormulaire(p)" size="sm">Modifier</AppButton><AppButton variant="danger" @click="supprimer(p)" size="sm">Archiver</AppButton></div>
      </article>
    </div>
  </section>
</template>