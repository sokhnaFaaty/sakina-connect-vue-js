<script setup>
defineProps({
  message: { type: String, default: 'Chargement…' }
});
</script>

<template>
  <div class="grid min-h-[60vh] place-items-center">
    <div class="flex flex-col items-center gap-4 rounded-[2rem] border border-slate-200 bg-white px-12 py-10 text-center shadow-sm">
      <!-- Le spinner animé -->
      <div class="relative flex h-16 w-16 items-center justify-center">
        <div class="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-[#BC7B3B]"></div>
        <i class="fa-solid fa-moon text-xl text-[#333D2A]"></i>
      </div>
      <!-- Le texte -->
      <div>
        <p class="font-display text-lg font-black text-[#333D2A]">Sakina <span class="text-[#BC7B3B]">Connect</span></p>
        <p class="mt-1 text-sm font-semibold text-slate-400">{{ message }}</p>
      </div>
    </div>
  </div>
</template>