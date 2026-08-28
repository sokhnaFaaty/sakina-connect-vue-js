<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  autocomplete: { type: String, default: undefined },
});
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {{ label }}
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      @input="$emit('update:modelValue', $event.target.value)"
      class="w-full rounded-2xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
      :class="error ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:ring-[#333D2A]/30'"
    />
    <p v-if="error" class="mt-1 text-xs text-rose-600">{{ error }}</p>
  </div>
</template>