<script setup>
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { createPelerin, updatePelerin } from '@/services/pelerinService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  pelerin: { type: Object, default: null },
  groupes: { type: Array, required: true },
});
const emit = defineEmits(['success', 'close']);

const { succes, erreur } = useToast();

const isEdit = !!props.pelerin;
const chargement = ref(false);

// Données du formulaire
const nomComplet = ref(props.pelerin ? props.pelerin.nomComplet : '');
const email = ref(props.pelerin ? props.pelerin.email : '');
const telephone = ref(props.pelerin ? props.pelerin.telephone : '');
const numeroPasseport = ref(props.pelerin?.numeroPasseport || '');
const statutVisa = ref(props.pelerin?.statutVisa || 'EN_ATTENTE');
const groupeId = ref(props.pelerin?.groupeId || '');
const informationsMedicales = ref(props.pelerin?.informationsMedicales || '');

const groupeOptions = computed(() => props.groupes.map(g => ({ value: g.id, label: g.nom })));

async function soumettre() {
  if (!nomComplet.value || !numeroPasseport.value || !groupeId.value || (!isEdit && (!email.value || !telephone.value))) {
    erreur("Veuillez remplir tous les champs obligatoires.");
    return;
  }

  chargement.value = true;
  try {
    if (isEdit) {
      await updatePelerin(props.pelerin.id, {
        numeroPasseport: numeroPasseport.value,
        statutVisa: statutVisa.value,
        groupeId: groupeId.value,
        informationsMedicales: informationsMedicales.value,
      });
      succes("Pèlerin modifié.");
    } else {
      await createPelerin({
        nomComplet: nomComplet.value,
        email: email.value,
        telephone: telephone.value,
        numeroPasseport: numeroPasseport.value,
        statutVisa: statutVisa.value,
        groupeId: groupeId.value,
        informationsMedicales: informationsMedicales.value,
        photo: '', // Gestion de la photo à ajouter plus tard si besoin
      });
      succes("Pèlerin créé avec succès.");
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
    <AppInput v-model="nomComplet" label="Nom complet *" />

    <div v-if="!isEdit" class="grid gap-4 sm:grid-cols-2">
      <AppInput v-model="email" type="email" label="Email du compte *" />
      <AppInput v-model="telephone" type="text" label="Téléphone du compte *" />
    </div>

    <AppInput v-model="numeroPasseport" label="Numéro de passeport *" />

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Statut du visa *</label>
      <select v-model="statutVisa" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <option value="EN_ATTENTE">En attente</option>
        <option value="APPROUVE">Approuvé</option>
        <option value="REFUSE">Refusé</option>
      </select>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Groupe *</label>
      <select v-model="groupeId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <option value="">-- Choisir --</option>
        <option v-for="g in groupeOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
      </select>
    </div>

    <AppInput v-model="informationsMedicales" label="Informations médicales (Facultatif)" placeholder="Ex: Diabète, asthme..." />

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" @click="$emit('close')" type="button">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">Enregistrer</AppButton>
    </div>
  </form>
</template>