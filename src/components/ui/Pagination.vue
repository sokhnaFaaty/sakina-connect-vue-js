<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
});
const emit = defineEmits(['update:page']);

// Fenêtre de pages : toujours 1 et la dernière, plus current ± 1, avec des « … » pour les trous.
const pages = computed(() => {
  const out = [];
  for (let i = 1; i <= props.totalPages; i++) {
    if (i === 1 || i === props.totalPages || (i >= props.page - 1 && i <= props.page + 1)) {
      out.push(i);
    } else if (out[out.length - 1] !== '…') {
      out.push('…');
    }
  }
  return out;
});

function aller(p) {
  if (p >= 1 && p <= props.totalPages && p !== props.page) emit('update:page', p);
}
</script>

<template>
  <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-1">
    <button
      type="button"
      :disabled="page <= 1"
      class="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
      @click="aller(page - 1)"
    >
      <i class="fa-solid fa-chevron-left"></i>
    </button>

    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === '…'" class="flex h-9 min-w-9 items-center justify-center px-1 text-sm font-bold text-slate-400 dark:text-slate-500">…</span>
      <button
        v-else
        type="button"
        class="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition"
        :class="p === page ? 'bg-[#333D2A] text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'"
        @click="aller(p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      type="button"
      :disabled="page >= totalPages"
      class="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
      @click="aller(page + 1)"
    >
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  </div>
</template>
