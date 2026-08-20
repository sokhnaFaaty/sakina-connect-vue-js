<script setup>
import { useConfirm } from '@/composables/useConfirm.js';
const { isOpen, message, confirm, cancel } = useConfirm();
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div class="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <p class="text-sm text-slate-700">{{ message }}</p>
        <div class="mt-5 flex justify-end gap-3">
          <button @click="cancel" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Annuler</button>
          <button @click="confirm" class="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700">Confirmer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>