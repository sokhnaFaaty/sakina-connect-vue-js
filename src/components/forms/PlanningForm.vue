<script setup>
import { ref } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { STATUT_EVENEMENT } from '@/config/constantes.js';
import { createPlanningEvent, updatePlanningEvent} from '@/services/planningService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  evenement: { type: Object, default: null },
  categories: { type: Array, required: true },
  groupeId: { type: String, required: true },
  userId: { type: String, required: true },
  role: { type: String, required: true },
});
const emit = defineEmits(['success', 'close']);

const { succes, erreur } = useToast();
const chargement = ref(false);

const date = ref(props.evenement?.date || '');
const heure = ref(props.evenement?.heure || '');
const titre = ref(props.evenement?.titre || '');
const lieu = ref(props.evenement?.lieu || '');
const categorieId = ref(props.evenement?.categorieId || '');
const etapeGuide = ref(props.evenement?.etapeGuide || '');
const description = ref(props.evenement?.description || '');

const isGuide = props.role === 'GUIDE';

async function soumettre() {
  if (!date.value || !heure.value || !titre.value || !lieu.value || !categorieId.value) {
    erreur("Date, heure, titre, lieu et catégorie sont obligatoires.");
    return;
  }

  chargement.value = true;
  try {
    if (props.evenement) {
      const payload = { date: date.value, heure: heure.value, titre: titre.value, lieu: lieu.value, categorieId: categorieId.value, etapeGuide: etapeGuide.value, description: description.value };
      if (isGuide) payload.statut = STATUT_EVENEMENT.EN_ATTENTE;
      await updatePlanningEvent(props.evenement.id, payload);
      succes(isGuide ? "Événement renvoyé pour validation." : "Événement modifié.");
    } else {
      const statut = isGuide ? STATUT_EVENEMENT.EN_ATTENTE : STATUT_EVENEMENT.APPROUVE;
      await createPlanningEvent({
        date: date.value, heure: heure.value, titre: titre.value, lieu: lieu.value, categorieId: categorieId.value,
        etapeGuide: etapeGuide.value, description: description.value,
        groupeId: props.groupeId, auteurId: props.userId, statut,
      });
      succes(isGuide ? "Événement soumis pour validation." : "Événement créé avec succès.");
    }
    emit('success');
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
    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput v-model="date" type="date" label="Date de l'événement *" />
      <AppInput v-model="heure" type="text" label="Heure (ex: 14h30) *" />
    </div>

    <AppInput v-model="titre" label="Titre de l'événement *" />
    <AppInput v-model="lieu" label="Nom du Lieu *" />

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Catégorie *</label>
      <select v-model="categorieId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <option value="">-- Choisir --</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.libelle }}</option>
      </select>
    </div>

    <AppInput v-model="etapeGuide" label="Étape de guidage (facultatif)" placeholder="Ex: Briefing spirituel..." />
    
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Description</label>
      <textarea v-model="description" rows="3" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"></textarea>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" @click="$emit('close')" type="button">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">Enregistrer l'itinéraire</AppButton>
    </div>
  </form>
</template>