<script setup>
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { createGroupe, updateGroupe } from '@/services/groupeService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  groupe: { type: Object, default: null }, // L'objet groupe existant (null si création)
  guides: { type: Array, required: true },
  hotels: { type: Array, required: true },
});
const emit = defineEmits(['success', 'close']);

const { succes, erreur } = useToast();

// État du formulaire
const nom = ref(props.groupe?.nom || '');
const guideId = ref(props.groupe?.guideId || '');
const hotelMecqueId = ref(props.groupe?.hotelMecqueId || '');
const hotelMedineId = ref(props.groupe?.hotelMedineId || '');
const dateDepart = ref(props.groupe?.dateDepart || '');
const dateRetour = ref(props.groupe?.dateRetour || '');
const chargement = ref(false);

// Options pour les selects
const guideOptions = computed(() => props.guides.map(g => ({ value: g.id, label: g.nomComplet || g.id })));
const hotelOptions = computed(() => props.hotels.map(h => ({ value: h.id, label: h.nom })));

async function soumettre() {
  // Validations simples
  if (!nom.value || !guideId.value || !hotelMecqueId.value || !hotelMedineId.value || !dateDepart.value || !dateRetour.value) {
    erreur("Tous les champs sont obligatoires.");
    return;
  }

  chargement.value = true;
  try {
    if (props.groupe) {
      await updateGroupe(props.groupe.id, {
        nom: nom.value,
        guideId: guideId.value,
        hotelMecqueId: hotelMecqueId.value,
        hotelMedineId: hotelMedineId.value,
        dateDepart: dateDepart.value,
        dateRetour: dateRetour.value,
      });
      succes("Groupe modifié avec succès.");
    } else {
      await createGroupe({
        nom: nom.value,
        guideId: guideId.value,
        hotelMecqueId: hotelMecqueId.value,
        hotelMedineId: hotelMedineId.value,
        dateDepart: dateDepart.value,
        dateRetour: dateRetour.value,
      });
      succes("Groupe créé avec succès.");
    }
    emit('success'); // Informe la vue parente de recharger la liste
    emit('close');   // Ferme le Drawer / la Modale
  } catch (e) {
    erreur(e.message);
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="soumettre" class="grid gap-4">
    <AppInput v-model="nom" label="Nom du groupe *" placeholder="Ex: Groupe A-1" />

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Guide responsable *</label>
      <select v-model="guideId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <option value="">-- Choisir --</option>
        <option v-for="g in guideOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
      </select>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Hôtel Mecque *</label>
        <select v-model="hotelMecqueId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <option value="">-- Choisir --</option>
          <option v-for="h in hotelOptions" :key="h.value" :value="h.value">{{ h.label }}</option>
        </select>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Hôtel Médine *</label>
        <select v-model="hotelMedineId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <option value="">-- Choisir --</option>
          <option v-for="h in hotelOptions" :key="h.value" :value="h.value">{{ h.label }}</option>
        </select>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput v-model="dateDepart" type="date" label="Date de départ *" />
      <AppInput v-model="dateRetour" type="date" label="Date de retour *" />
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" @click="$emit('close')" type="button">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">Enregistrer</AppButton>
    </div>
  </form>
</template>