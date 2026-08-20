<script setup>
import { ref, onMounted } from 'vue';
import { getPelerinsArchives, restorePelerin, deletePelerinDefinitif } from '@/services/pelerinService.js';
import { getGuidesArchives, restoreGuide, deleteGuideDefinitif } from '@/services/guideService.js';
import { getGroupesArchives, restoreGroupe, deleteGroupeDefinitif } from '@/services/groupeService.js';
import { useToast, useConfirm } from '@/composables/index.js';

const activeTab = ref('pelerins'); const items = ref([]); const search = ref('');
const { demanderConfirmation } = useConfirm(); const { erreur, succes } = useToast();

const services = {
  pelerins: { fetch: getPelerinsArchives, restore: restorePelerin, delete: deletePelerinDefinitif },
  guides: { fetch: getGuidesArchives, restore: restoreGuide, delete: deleteGuideDefinitif },
  groupes: { fetch: getGroupesArchives, restore: restoreGroupe, delete: deleteGroupeDefinitif },
};

async function charger() {
  try { items.value = await services[activeTab.value].fetch(); } catch (e) { erreur(e.message); }
}
onMounted(charger);

async function restore(id) {
  try { await services[activeTab.value].restore(id); succes('Élément restauré.'); charger(); } catch (e) { erreur(e.message); }
}
async function del(id) {
  if(!await demanderConfirmation('Suppression définitive irréversible ?')) return;
  try { await services[activeTab.value].delete(id); succes('Supprimé définitivement.'); charger(); } catch (e) { erreur(e.message); }
}
</script>
<template>
  <section>
    <PageHeader title="Liste des Archives" kicker="Corbeille" subtitle="Restaurez ou supprimez définitivement." />
    <div class="flex gap-4 mb-6"><button v-for="tab in ['pelerins','guides','groupes']" :key="tab" @click="activeTab=tab; charger()" :class="activeTab===tab?'bg-[#333D2A] text-white':'border'" class="px-4 py-2 rounded-xl">{{ tab }}</button></div>
    <div class="grid gap-3 rounded-2xl border p-6 bg-white">
      <div v-if="items.length === 0" class="text-slate-400 text-center py-8">Aucun élément archivé.</div>
      <div v-for="it in items" :key="it.id" class="flex justify-between border-b pb-2">
        <div>{{ it.nom }}</div>
        <div><button @click="restore(it.id)" class="text-emerald-600 mr-4">Restaurer</button><button @click="del(it.id)" class="text-rose-600">Supprimer</button></div>
      </div>
    </div>
  </section>
</template>