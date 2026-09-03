<script setup>
import { ref } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { rejeterAnnonce } from '@/services/annonceService.js';

const props = defineProps({
  annonce: { type: Object, default: null },
  placeholder: { type: String, default: 'Explique au guide pourquoi sa publication est refusée...' },
  toastSucces: { type: String, default: 'Communiqué rejeté.' },
  rejeterFn: { type: Function, default: null },
});
const emit = defineEmits(['success', 'close']);

const { success, error } = useToast();
const motif = ref('');
const motifError = ref('');
const chargement = ref(false);

async function confirmer() {
  motifError.value = !motif.value.trim() ? 'Le motif est obligatoire.' : '';
  if (motifError.value) return;

  chargement.value = true;
  try {
    if (props.rejeterFn) await props.rejeterFn(motif.value.trim());
    else await rejeterAnnonce(props.annonce.id, motif.value.trim());
    success(props.toastSucces);
    emit('success');
    emit('close');
  } catch (e) {
    error(e.message);
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="confirmer" class="grid gap-4">
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="motifRejet">Motif du rejet *</label>
      <textarea id="motifRejet" v-model="motif" rows="3" :placeholder="placeholder" class="w-full rounded-2xl border bg-white px-4 py-3 text-sm dark:bg-slate-800 dark:text-slate-100" :class="motifError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 dark:border-slate-600'"></textarea>
      <p v-if="motifError" class="mt-1 text-xs text-rose-600">{{ motifError }}</p>
    </div>

    <div class="mt-2 flex justify-end gap-3">
      <button type="button" @click="$emit('close')" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">Annuler</button>
      <button type="submit" :disabled="chargement" class="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700 disabled:opacity-60">
        <i class="fa-solid fa-ban"></i>
        <span>Confirmer le rejet</span>
      </button>
    </div>
  </form>
</template>
