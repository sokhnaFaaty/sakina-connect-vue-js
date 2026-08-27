<script setup>
import { ref, onMounted } from 'vue';
import { getPelerinsArchives, restorePelerin, deletePelerinDefinitif } from '@/services/pelerinService.js';
import { useToast, useConfirm } from '@/composables/index.js';

const items = ref([]);
const activeTab = ref('pelerins');
const { askConfirmation } = useConfirm();
const { success, error } = useToast();

// Map des services par onglet
const services = {
  pelerins: { fetch: getPelerinsArchives, restore: restorePelerin, delete: deletePelerinDefinitif },
  guides:   { fetch: getGuidesArchives, restore: restoreGuide, delete: deleteGuideDefinitif },
  groupes:  { fetch: getGroupesArchives, restore: restoreGroupe, delete: deleteGroupeDefinitif },
};

async function charger() {
  try { items.value = await services[activeTab.value].fetch(); } catch (e) { error(e.message); }
}
onMounted(charger);

async function supprimer(id) {
  if (!await askConfirmation('Suppression définitive irréversible ?')) return;
  try { await services[activeTab.value].delete(id); success('Supprimé.'); charger(); } catch (e) { error(e.message); }
async function supprimer(id) {
  if (!await askConfirmation('Suppression définitive irréversible ?')) return;
  try { await services[activeTab.value].delete(id); success('Supprimé.'); charger(); } catch (e) { error(e.message); }
}
</script>
<template>
  <section>
    <PageHeader
      title="Archives"
      kicker="Corbeille"
      subtitle="Restaurez ou supprimez définitivement."
    />
    <div class="mb-4 flex gap-2">
      <button
        @click="
          activeTab = 'pelerins'
          charger()
        "
        :class="activeTab === 'pelerins' ? 'bg-[#333D2A] text-white' : 'border'"
        class="px-4 py-2 rounded-xl"
      >
        Pèlerins
      </button>
      <button
        @click="
          activeTab = 'guides'
          charger()
        "
        :class="activeTab === 'guides' ? 'bg-[#333D2A] text-white' : 'border'"
        class="px-4 py-2 rounded-xl"
      >
        Guides
      </button>
      <button
        @click="
          activeTab = 'groupes'
          charger()
        "
        :class="activeTab === 'groupes' ? 'bg-[#333D2A] text-white' : 'border'"
        class="px-4 py-2 rounded-xl"
      >
        Groupes
      </button>
    </div>
    <div class="bg-white p-4 rounded-2xl border">
      <div v-if="items.length === 0" class="py-4 text-center text-slate-500">
        Aucun élément archivé.
      </div>
      <div v-for="item in items" :key="item.id" class="border-b py-2 flex justify-between">
        <span>{{ item.nomComplet || item.nom }}</span>
        <button @click="supprimer(item.id)" class="text-rose-600 text-sm font-bold">
          Supprimer déf.
        </button>
      </div>
    </div>
  </section>
</template>
