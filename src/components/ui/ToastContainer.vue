<script setup>
import { useToast } from '@/composables/useToast.js';
const { toasts } = useToast();
</script>

<template>
  <div class="pointer-events-none fixed right-5 top-20 z-[100] flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="pointer-events-auto max-w-sm rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl transition-all"
        :class="toast.type === 'error' ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-slate-950 text-white shadow-slate-300'"
      >
        <span class="inline-flex items-center gap-2">
          <i class="fa-solid" :class="toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'"></i>
          {{ toast.message }}
        </span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(30px); }
</style>