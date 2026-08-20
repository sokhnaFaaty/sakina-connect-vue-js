<script setup>
const props = defineProps({ modelValue: { type: String, default: 'table' } });
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
    <button 
      @click="emit('update:modelValue', 'card')" 
      :class="modelValue === 'card' ? 'bg-[#333D2A] text-white' : 'text-slate-500 hover:bg-slate-50'" 
      class="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition"
    >
      <i class="fa-solid fa-table-cells-large"></i>
    </button>
    <button 
      @click="emit('update:modelValue', 'table')" 
      :class="modelValue === 'table' ? 'bg-[#333D2A] text-white' : 'text-slate-500 hover:bg-slate-50'" 
      class="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition"
    >
      <i class="fa-solid fa-table-list"></i>
    </button>
  </div>
</template>