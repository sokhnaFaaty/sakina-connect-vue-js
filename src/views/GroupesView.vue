<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast, useConfirm, useDrawer } from '@/composables/index.js';
import { getGroupes, deleteGroupe } from '@/services/groupeService.js';
import { getGuides } from '@/services/guideService.js';
import { getHotels } from '@/services/hotelService.js';
import { getPelerins } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import GroupeForm from '@/components/forms/GroupeForm.vue';

const groupes = ref([]); const guides = ref([]); const hotels = ref([]);
const pelerins = ref([]); const utilisateurs = ref([]);
const vue = ref('table');

const { open: openDrawer } = useDrawer();
const { askConfirmation } = useConfirm();
const { success, error } = useToast();

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map(u => [u.id, u])));
const guideMap = computed(() => Object.fromEntries(guides.value.map(g => [g.id, g])));

async function charger() {
  try {
    [groupes.value, guides.value, hotels.value, pelerins.value, utilisateurs.value] = await Promise.all([
      getGroupes(), getGuides(), getHotels(), getPelerins(), getUtilisateurs()
    ]);
  } catch (e) { error(e.message); }
}
onMounted(charger);

function ouvrirFormulaire(groupe = null) {
  openDrawer(GroupeForm, {
    title: groupe ? 'Modifier le groupe' : 'Ajouter un groupe',
    icon: 'fa-people-group',
    props: { groupe, guides: guides.value, hotels: hotels.value, onSucces: charger }
  });
}
async function supprimer(groupe) {
  if (!await askConfirmation(`Voulez-vous archiver le groupe "${groupe.nom}" ?`)) return;
  try { await deleteGroupe(groupe.id); success('Groupe archivé.'); charger(); } catch (e) { error(e.message); }
}

// Colonnes pour AppTable
const colonnes = [
  { label: 'Nom', key: 'nom' },
  { label: 'Guide', render: (g) => utilisateurMap.value[guideMap.value[g.guideId]?.utilisateurId]?.nomComplet || '-' },
  { label: 'Pèlerins', render: (g) => `${pelerins.value.filter(p => p.groupeId === g.id).length} pèlerins` },
];
</script>
<template>
  <section>
    <PageHeader kicker="Organisation" title="Liste des Groupes" subtitle="Créer, assigner un guide et consulter les pèlerins.">
      <template #actions><AppButton @click="ouvrirFormulaire()"><i class="fa-solid fa-plus"></i> Nouveau groupe</AppButton></template>
    </PageHeader>
    <div class="mb-4 flex justify-end"><ViewToggle v-model="vue" /></div>
    <AppTable v-if="vue === 'table'" :colonnes="colonnes" :lignes="groupes" @modifier="ouvrirFormulaire" @supprimer="supprimer" />
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="g in groupes" :key="g.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="font-black">{{ g.nom }}</h3>
        <p class="text-sm text-slate-600">Guide : {{ utilisateurMap[guideMap[g.guideId]?.utilisateurId]?.nomComplet || '-' }}</p>
        <div class="flex gap-2 mt-3">
          <AppButton variant="secondary" @click="ouvrirFormulaire(g)" size="sm">Modifier</AppButton>
          <AppButton variant="danger" @click="supprimer(g)" size="sm">Archiver</AppButton>
        </div>
      </article>
    </div>
  </section>
</template>