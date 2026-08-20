<script setup>
import { ref } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { createHotel } from '@/services/hotelService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  ville: { type: String, required: true },
});
const emit = defineEmits(['success', 'close']);

const { succes, erreur } = useToast();
const chargement = ref(false);

const nom = ref('');
const adresse = ref('');
const telephone = ref('');
const nombreEtoiles = ref('5');

async function soumettre() {
  if (!nom.value) {
    erreur("Le nom de l'hôtel est obligatoire.");
    return;
  }

  chargement.value = true;
  try {
    const nouvelHotel = await createHotel({
      nom: nom.value,
      ville: props.ville,
      adresse: adresse.value,
      telephone: telephone.value,
      nombreEtoiles: Number(nombreEtoiles.value),
    });
    succes("Hôtel ajouté avec succès.");
    emit('success', nouvelHotel); // Envoie le nouvel hôtel au parent pour qu'il le rajoute à sa liste
    emit('close');
  } catch (e) {
    erreur(e.message);
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="soumettre" class="grid gap-4">
    <AppInput v-model="nom" label="Nom de l'hôtel *" />
    <AppInput v-model="adresse" label="Adresse (facultatif)" />
    
    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput v-model="telephone" label="Téléphone (facultatif)" />
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Nombre d'étoiles</label>
        <select v-model="nombreEtoiles" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <option value="5">5 étoiles</option>
          <option value="4">4 étoiles</option>
          <option value="3">3 étoiles</option>
          <option value="2">2 étoiles</option>
          <option value="1">1 étoile</option>
        </select>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" @click="$emit('close')" type="button">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">Ajouter l'hôtel</AppButton>
    </div>
  </form>
</template>