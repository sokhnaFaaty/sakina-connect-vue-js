<script setup>
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { createPlanningEvent, updatePlanningEvent, STATUT_EVENEMENT } from '@/services/planningService.js';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  evenement: { type: Object, default: null },
  categories: { type: Array, required: true },
  planning: { type: Array, default: () => [] },
  groupeId: { type: String, required: true },
  userId: { type: String, required: true },
  role: { type: String, required: true },
});
const emit = defineEmits(['success', 'close']);

const { success, error } = useToast();
const chargement = ref(false);

const joursUniques = computed(() => [...new Set(props.planning.map((e) => e.date))].sort());
const jourNumero = ref(props.evenement ? String(joursUniques.value.indexOf(props.evenement.date) + 1) : '');

const heure = ref(props.evenement?.heure || '');
const date = ref(props.evenement?.date || '');
const titre = ref(props.evenement?.titre || '');
const lieu = ref(props.evenement?.lieu || '');
const categorieId = ref(props.evenement?.categorieId || '');
const etapeGuide = ref(props.evenement?.etapeGuide || '');
const description = ref(props.evenement?.description || '');

const dateError = ref('');
const heureError = ref('');
const titreError = ref('');
const lieuError = ref('');
const categorieError = ref('');

const estGuide = props.role === 'GUIDE';

async function soumettre() {
  const valeurs = [
    [date.value, 'dateError', 'La date'],
    [heure.value.trim(), 'heureError', "L'heure"],
    [titre.value.trim(), 'titreError', 'Le titre'],
    [lieu.value.trim(), 'lieuError', 'Le lieu'],
    [categorieId.value, 'categorieError', 'La catégorie'],
  ];
  let hasError = false;
  for (const [valeur, champ, label] of valeurs) {
    const err = !String(valeur).trim() ? `${label} est obligatoire.` : '';
    if (champ === 'dateError') dateError.value = err;
    else if (champ === 'heureError') heureError.value = err;
    else if (champ === 'titreError') titreError.value = err;
    else if (champ === 'lieuError') lieuError.value = err;
    else categorieError.value = err;
    if (err) hasError = true;
  }
  if (hasError) return;

  chargement.value = true;
  try {
    const donnees = {
      date: date.value,
      heure: heure.value.trim(),
      titre: titre.value.trim(),
      lieu: lieu.value.trim(),
      categorieId: categorieId.value,
      etapeGuide: etapeGuide.value.trim(),
      description: description.value.trim(),
    };

    if (props.evenement) {
      // Le guide qui modifie son événement le re-soumet à validation ; l'admin garde le statut.
      const champsStatut = estGuide ? { statut: STATUT_EVENEMENT.EN_ATTENTE, motifRejet: '' } : {};
      await updatePlanningEvent(props.evenement.id, { ...donnees, ...champsStatut });
      success(estGuide ? 'Événement renvoyé pour validation.' : 'Événement modifié avec succès.');
    } else {
      // Guide : en attente de validation ; admin : approuvé directement.
      const statut = estGuide ? STATUT_EVENEMENT.EN_ATTENTE : STATUT_EVENEMENT.APPROUVE;
      await createPlanningEvent({ ...donnees, groupeId: props.groupeId, auteurId: props.userId, statut });
      success(estGuide ? 'Événement envoyé pour validation.' : 'Événement créé avec succès.');
    }
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
  <form @submit.prevent="soumettre" class="grid gap-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="evtJour">Jour de Voyage (Numéro)</label>
        <input id="evtJour" v-model="jourNumero" type="text" placeholder="Ex: 1" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="evtHeure">Heure (ex: 14h 30 ou 08h 00)</label>
        <input id="evtHeure" v-model="heure" type="text" placeholder="08h 00" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
        <p v-if="heureError" class="mt-1 text-xs text-rose-600">{{ heureError }}</p>
      </div>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="evtDate">Date de l'événement *</label>
      <input id="evtDate" v-model="date" type="date" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
      <p v-if="dateError" class="mt-1 text-xs text-rose-600">{{ dateError }}</p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="evtTitre">Titre de l'événement *</label>
      <input id="evtTitre" v-model="titre" type="text" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
      <p v-if="titreError" class="mt-1 text-xs text-rose-600">{{ titreError }}</p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="evtLieu">Nom de Lieu *</label>
      <input id="evtLieu" v-model="lieu" type="text" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
      <p v-if="lieuError" class="mt-1 text-xs text-rose-600">{{ lieuError }}</p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="evtCategorie">Catégorie *</label>
      <select id="evtCategorie" v-model="categorieId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
        <option value="">-- Choisir --</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.libelle }}</option>
      </select>
      <p v-if="categorieError" class="mt-1 text-xs text-rose-600">{{ categorieError }}</p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="evtEtapeGuide">Guide ou étape spirituel</label>
      <input id="evtEtapeGuide" v-model="etapeGuide" type="text" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="evtDescription">Description</label>
      <textarea id="evtDescription" v-model="description" rows="3" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"></textarea>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" @click="$emit('close')" type="button">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">Enregistrer l'itineraire</AppButton>
    </div>
  </form>
</template>
