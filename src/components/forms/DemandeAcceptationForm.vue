<script setup>
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { accepterDemandeInscription } from '@/services/demandeInscriptionService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  demande: { type: Object, required: true },
  groupes: { type: Array, required: true },
  guides: { type: Array, default: () => [] },
  utilisateurs: { type: Array, default: () => [] },
  onTraitee: { type: Function, default: null },
});
const emit = defineEmits(['success', 'close']);

const { success, error } = useToast();

const groupeId = ref('');
const numeroPasseport = ref('');
const contactUrgenceNom = ref('');
const contactUrgenceTelephone = ref('');
const chargement = ref(false);

const erreurGroupe = ref('');
const erreurPasseport = ref('');

const utilisateurMap = computed(() =>
  Object.fromEntries(props.utilisateurs.map((u) => [u.id, u])),
);

// `groupes.guideId` pointe vers un GUIDE, et un guide porte un `utilisateurId`.
// Sans ce second saut, on afficherait un UUID à l'administrateur alors qu'il
// doit choisir en connaissance de cause.
const nomsDuGuide = computed(() => {
  const guideParId = Object.fromEntries(props.guides.map((g) => [g.id, g]));
  const noms = {};
  for (const g of props.groupes) {
    if (!g.guideId) continue;
    const guide = guideParId[g.guideId];
    const utilisateur = guide ? utilisateurMap.value[guide.utilisateurId] : null;
    noms[g.id] = utilisateur?.nomComplet || 'guide inconnu';
  }
  return noms;
});

// On propose les groupes, avec le nom du guide devant : c'est la seule info
// utile pour trancher, un UUID ne l'aide pas à décider.
const groupeOptions = computed(() =>
  props.groupes.map((g) => ({
    value: g.id,
    label: `${g.nom} — ${nomsDuGuide.value[g.id] || 'sans guide'}`,
  })),
);

function valider() {
  erreurGroupe.value = groupeId.value ? '' : 'Le groupe est obligatoire : sans lui, le pèlerin n’a pas d’affectation.';
  erreurPasseport.value =
    numeroPasseport.value.trim().length >= 3 ? '' : 'Le numéro de passeport est obligatoire (3 caractères minimum).';
  return !erreurGroupe.value && !erreurPasseport.value;
}

async function confirmer() {
  if (!valider()) return;

  chargement.value = true;
  try {
    // On n'envoie que ce que l'administrateur décide. L'identité et le mot de
    // passe restent côté serveur : les renvoyer ici n'aurait aucun effet, et
    // les exposer dans un formulaire ferait croire qu'ils sont modifiables.
    await accepterDemandeInscription(props.demande.id, {
      groupeId: groupeId.value,
      numeroPasseport: numeroPasseport.value.trim(),
      contactUrgenceNom: contactUrgenceNom.value.trim() || undefined,
      contactUrgenceTelephone: contactUrgenceTelephone.value.trim() || undefined,
    });
    success(`${props.demande.prenom} ${props.demande.nom} a été accepté(e). Le compte est créé.`);
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
      Le compte sera créé avec l’email et le mot de passe que le pèlerin a choisis
      lui-même. Les deux champs ci-dessous sont les seules décisions à prendre.
    </p>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" for="groupeDemande">
        Groupe d’affectation *
      </label>
      <select
        id="groupeDemande"
        v-model="groupeId"
        class="w-full rounded-2xl border bg-white px-4 py-3 text-sm dark:bg-slate-800 dark:text-slate-100"
        :class="erreurGroupe ? 'border-rose-400' : 'border-slate-200 dark:border-slate-600'"
      >
        <option value="" disabled>— Choisir un groupe —</option>
        <option v-for="o in groupeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <p v-if="erreurGroupe" class="mt-1 text-xs text-rose-600">{{ erreurGroupe }}</p>
    </div>

    <AppInput
      v-model="numeroPasseport"
      label="Numéro de passeport *"
      placeholder="Ex. A1234567"
      :error="erreurPasseport"
    />

    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput v-model="contactUrgenceNom" label="Contact d’urgence (nom)" placeholder="Facultatif" />
      <AppInput v-model="contactUrgenceTelephone" label="Contact d’urgence (téléphone)" placeholder="Facultatif" />
    </div>

    <div class="mt-2 flex justify-end gap-3">
      <AppButton variant="secondary" @click="$emit('close')">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">
        <template #icon><i class="fa-solid fa-user-check"></i></template>
        <span>{{ chargement ? 'Création…' : 'Accepter et créer le compte' }}</span>
      </AppButton>
    </div>
  </form>
</template>
