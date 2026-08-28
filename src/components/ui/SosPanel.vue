<script setup>
import { ref, computed, watch } from 'vue';
import Pagination from '@/components/ui/Pagination.vue';
import { marquerSosResolu } from '@/services/sosService.js';
import { useToast } from '@/composables/index.js';

const props = defineProps({
  sosActifs: { type: Array, default: () => [] },
  resolveNom: { type: Function, default: () => 'Pèlerin inconnu' },
});
const emit = defineEmits(['resolved']);

const SOS_PER_PAGE = 3;
const { success, error } = useToast();

const page = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(props.sosActifs.length / SOS_PER_PAGE)));
const items = computed(() =>
  props.sosActifs.slice((page.value - 1) * SOS_PER_PAGE, page.value * SOS_PER_PAGE)
);
watch(totalPages, (t) => {
  if (page.value > t) page.value = t;
});

function tempsEcoule(dateHeure) {
  const diffMs = Date.now() - new Date(dateHeure).getTime();
  const heures = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return heures > 0 ? `${heures}h ${minutes}min` : `${minutes} min`;
}

async function resoudre(id) {
  try {
    await marquerSosResolu(id);
    success('Alerte marquée comme résolue.');
    emit('resolved');
  } catch (e) {
    error(e.message);
  }
}
</script>

<template>
  <div>
    <h2 class="mb-4 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-slate-100">
      <i class="fa-solid fa-tower-broadcast text-rose-600"></i> Alertes de Paniques Actives ({{ sosActifs.length }})
    </h2>
    <template v-if="sosActifs.length">
      <div v-for="s in items" :key="s.id" class="mb-3 rounded-2xl border-l-4 border-rose-500 bg-rose-50 p-4 dark:bg-slate-800/60">
        <div class="mb-2 flex items-center justify-between">
          <span class="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-black text-white">{{ s.id.slice(0, 6).toUpperCase() }}</span>
          <span class="text-xs text-slate-400 dark:text-slate-500"><i class="fa-regular fa-clock"></i> {{ tempsEcoule(s.dateHeure) }}</span>
        </div>
        <p class="font-black text-slate-900 dark:text-slate-100">{{ resolveNom(s.pelerinId) }}</p>
        <p class="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <i class="fa-solid fa-location-dot"></i> {{ s.latitude.toFixed(4) }}, {{ s.longitude.toFixed(4) }}
        </p>
        <p v-if="s.commentaire" class="mt-2 text-sm italic text-slate-600 dark:text-slate-300">"{{ s.commentaire }}"</p>
        <button
          type="button"
          class="mt-3 rounded-xl bg-[#333D2A] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
          @click="resoudre(s.id)"
        >
          Marquer Résolu
        </button>
      </div>
    </template>
    <p v-else class="text-sm text-slate-400 dark:text-slate-500">Aucune alerte active pour le moment.</p>
    <Pagination v-model:page="page" :total-pages="totalPages" />
  </div>
</template>
