<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // 'primary', 'secondary', 'danger'
  type: { type: String, default: 'button' },
});
</script>

<template>
  <button 
    :type="type" 
    class="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="{
      'bg-[#333D2A] text-white hover:opacity-90 shadow-lg shadow-[#333D2A]/20': variant === 'primary',
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50': variant === 'secondary',
      'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200': variant === 'danger'
    }"
  >
    <slot name="icon" />
    <slot />
  </button>
</template>