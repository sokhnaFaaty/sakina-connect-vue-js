<script setup>
import { computed } from 'vue';

// Port fidèle de js/components/pagination.js
const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
});

const emit = defineEmits(['navigate']);

// Fenêtre de pages : toujours 1 et la dernière, plus current ± 1, avec des « … » pour les trous.
const pages = computed(() => {
  const resultat = [];
  for (let i = 1; i <= props.totalPages; i++) {
    if (i === 1 || i === props.totalPages || (i >= props.currentPage - 1 && i <= props.currentPage + 1)) {
      resultat.push(i);
    } else if (resultat[resultat.length - 1] !== '…') {
      resultat.push('…');
    }
  }
  return resultat;
});

function aller(page) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return;
  emit('navigate', page);
}
</script>

<template>
  <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-1">
    <button
      type="button"
      :disabled="currentPage <= 1"
      class="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      @click="aller(currentPage - 1)"
    >
      <i class="fa-solid fa-chevron-left"></i>
    </button>

    <template v-for="(p, index) in pages" :key="`${p}-${index}`">
      <span v-if="p === '…'" class="flex h-9 min-w-9 items-center justify-center px-1 text-sm font-bold text-slate-400">…</span>
      <button
        v-else
        type="button"
        :class="p === currentPage ? 'bg-[#333D2A] text-white' : 'text-slate-600 hover:bg-slate-100'"
        class="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition"
        @click="aller(p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      type="button"
      :disabled="currentPage >= totalPages"
      class="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      @click="aller(currentPage + 1)"
    >
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  </div>
</template>
