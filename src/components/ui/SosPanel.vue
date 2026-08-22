<script setup>
import { ref, computed } from 'vue';
import { updateSos } from '@/services/sosService.js';
import { useToast } from '@/composables/useToast.js';
import AppPagination from './AppPagination.vue';

// Port fidèle de js/components/sosPanel.js — renderSosPanel
const SOS_PER_PAGE = 3;

const props = defineProps({
  sosActifs: { type: Array, default: () => [] },
  nomResolver: { type: Function, required: true },
});

const emit = defineEmits(['resolved']);

const page = ref(1);
const enCours = ref(null);
const { success, error: toastError } = useToast();

const totalPages = computed(() => Math.max(1, Math.ceil(props.sosActifs.length / SOS_PER_PAGE)));
const pageSafe = computed(() => Math.min(page.value, totalPages.value));
const items = computed(() => {
  const start = (pageSafe.value - 1) * SOS_PER_PAGE;
  return props.sosActifs.slice(start, start + SOS_PER_PAGE);
});

function tempsEcoule(dateHeure) {
  const t = new Date(dateHeure).getTime();
  if (!dateHeure || Number.isNaN(t)) return '—';
  const diffMs = Date.now() - t;
  const heures = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return heures > 0 ? `${heures}h ${minutes}min` : `${minutes} min`;
}

function idCourt(sos) {
  return String(sos.id).slice(0, 6).toUpperCase();
}

function position(sos) {
  return `${Number(sos.latitude ?? 0).toFixed(4)}, ${Number(sos.longitude ?? 0).toFixed(4)}`;
}

async function marquerResolu(sos) {
  enCours.value = sos.id;
  try {
    await updateSos(sos.id, { ...sos, statut: 'RESOLU' });
    success('Alerte marquée comme résolue.');
    emit('resolved');
  } catch (e) {
    toastError(e.message);
  } finally {
    enCours.value = null;
  }
}
</script>

<template>
  <h2 class="mb-4 flex items-center gap-2 text-lg font-black text-rose-600">
    <i class="fa-solid fa-tower-broadcast"></i> Alertes de Paniques Actives ({{ sosActifs.length }})
  </h2>

  <template v-if="sosActifs.length">
    <div v-for="sos in items" :key="sos.id" class="mb-3 rounded-2xl border-l-4 border-rose-500 bg-rose-50 p-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-black text-white">{{ idCourt(sos) }}</span>
        <span class="text-xs text-slate-400"><i class="fa-regular fa-clock"></i> {{ tempsEcoule(sos.dateHeure) }}</span>
      </div>
      <p class="font-black text-slate-900">{{ nomResolver(sos.pelerinId) }}</p>
      <p class="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <i class="fa-solid fa-location-dot"></i> {{ position(sos) }}
      </p>
      <p v-if="sos.commentaire" class="mt-2 text-sm italic text-slate-600">"{{ sos.commentaire }}"</p>
      <button
        type="button"
        :disabled="enCours === sos.id"
        class="mt-3 rounded-xl bg-[#333D2A] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        @click="marquerResolu(sos)"
      >
        Marquer Résolu
      </button>
    </div>
  </template>
  <p v-else class="text-sm text-slate-400">Aucune alerte active pour le moment.</p>

  <AppPagination :current-page="pageSafe" :total-pages="totalPages" @navigate="page = $event" />
</template>
