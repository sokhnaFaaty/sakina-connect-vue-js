<script setup>
import { ref } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { refuserDemandeInscription } from '@/services/demandeInscriptionService.js';

const props = defineProps({
  demande: { type: Object, required: true },
  onTraitee: { type: Function, default: null },
});
const emit = defineEmits(['success', 'close']);

const { success, error } = useToast();

const motifRefus = ref('');
const commentaireRefus = ref('');
const erreurMotif = ref('');
const chargement = ref(false);

async function confirmer() {
  erreurMotif.value = motifRefus.value.trim().length >= 2 ? '' : 'Le motif est obligatoire.';
  if (erreurMotif.value) return;

  chargement.value = true;
  try {
    await refuserDemandeInscription(props.demande.id, {
      motifRefus: motifRefus.value.trim(),
      commentaireRefus: commentaireRefus.value.trim() || undefined,
    });
    success('Demande refusée.');
    props.onTraitee?.();
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
    <p class="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
      Le motif est conservé avec la demande. Le mot de passe saisi par le pèlerin
      est purgé de la base à ce stade : il ne reste qu’une trace de la demande
      refusée.
    </p>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="motifRefusDemande">
        Motif du refus *
      </label>
      <textarea
        id="motifRefusDemande"
        v-model="motifRefus"
        rows="3"
        placeholder="Ex. référence de paiement introuvable, dossier incomplet…"
        class="w-full rounded-2xl border bg-white px-4 py-3 text-sm dark:bg-slate-800 dark:text-slate-100"
        :class="erreurMotif ? 'border-rose-400' : 'border-slate-200 dark:border-slate-600'"
      ></textarea>
      <p v-if="erreurMotif" class="mt-1 text-xs text-rose-600">{{ erreurMotif }}</p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="commentaireRefusDemande">
        Commentaire (facultatif)
      </label>
      <textarea
        id="commentaireRefusDemande"
        v-model="commentaireRefus"
        rows="2"
        placeholder="Précision destinée à l’administrateur, pas au pèlerin."
        class="w-full rounded-2xl border bg-white px-4 py-3 text-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
      ></textarea>
    </div>

    <div class="mt-2 flex justify-end gap-3">
      <button type="button" @click="$emit('close')" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">
        Annuler
      </button>
      <button type="submit" :disabled="chargement" class="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700 disabled:opacity-60">
        <i class="fa-solid fa-ban"></i>
        <span>{{ chargement ? 'Refus…' : 'Confirmer le refus' }}</span>
      </button>
    </div>
  </form>
</template>
