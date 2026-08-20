<script setup>
import { ref, onMounted } from 'vue';
import { getPelerinsArchives, restorePelerin, deletePelerinDefinitif } from '@/services/pelerinService.js';
import { useToast, useConfirm } from '@/composables/index.js';

const items = ref([]); const activeTab = ref('pelerins');
const { askConfirmation } = useConfirm(); const { success, error } = useToast();

const services = {
  pelerins: { fetch: getPelerinsArchives, restore: restorePelerin, delete: deletePelerinDefinitif },
};

async function charger() { try { items.value = await services[activeTab.value].fetch(); } catch (e) { error(e.message); } }
onMounted(charger);

async function supprimer(id) {
  if (!await askConfirmation('Suppression définitive irréversible ?')) return;
  try { await services[activeTab.value].delete(id); success('Supprimé.'); charger(); } catch (e) { error(e.message); }
}
</script>
<template>
  <section>
    <PageHeader title="Archives" kicker="Corbeille" />
    <div class="mb-4 flex gap-2"><button @click="activeTab='pelerins'; charger()" :class="activeTab==='pelerins'?'bg-[#333D2A] text-white':'border'" class="px-4 py-2 rounded-xl">Pèlerins</button></div>
    <div class="bg-white p-4 rounded-2xl border">
      <div v-for="item in items" :key="item.id" class="border-b py-2 flex justify-between">
        <span>{{ item.nomComplet }}</span>
        <button @click="supprimer(item.id)" class="text-rose-600 text-sm">Supprimer déf.</button>
      </div>
    </div>
  </section>
</template>