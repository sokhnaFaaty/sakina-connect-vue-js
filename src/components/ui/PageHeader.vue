<script setup>
defineProps({
  kicker: { type: String, default: 'Application' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <header class="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 dark:border-slate-700 dark:bg-slate-800">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">{{ title }}</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-3">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>