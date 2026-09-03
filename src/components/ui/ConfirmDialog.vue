<script setup>
import { useConfirm } from '@/composables/useConfirm.js';
const { isOpen, message, titre, labelConfirmer, labelAnnuler, confirm, cancel } = useConfirm();
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div class="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-800">
        <div class="flex items-center justify-between bg-gradient-to-r from-[#333D2A] to-[#F2F2DE] px-6 py-4 dark:from-slate-900 dark:to-slate-800">
          <h2 class="text-lg font-black text-white">{{ titre }}</h2>
          <button type="button" @click="cancel" class="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="px-6 py-8 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <i class="fa-solid fa-triangle-exclamation text-xl"></i>
          </div>
          <p class="text-sm leading-6 text-slate-700 dark:text-slate-300">{{ message }}</p>
        </div>

        <div class="flex justify-center gap-4 px-6 pb-6">
          <button type="button" @click="cancel" class="rounded-2xl bg-blue-600 px-8 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-700">{{ labelAnnuler }}</button>
          <button type="button" @click="confirm" class="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-8 py-2.5 text-sm font-extrabold text-white transition hover:bg-rose-700">
            <i class="fa-solid fa-check"></i>
            <span>{{ labelConfirmer }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
