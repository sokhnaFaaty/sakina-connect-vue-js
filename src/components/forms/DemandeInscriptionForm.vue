<script setup>
import { ref, reactive, computed } from 'vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { creerDemandeInscription } from '@/services/demandeInscriptionService.js';
import { validateEmailFormat, validateTelephone } from '@/utils/validators.js';

const props = defineProps({
  envoye: { type: Boolean, default: false },
});
const emit = defineEmits(['envoye']);

const formulaire = reactive({
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  referencePaiement: '',
  motDePasse: '',
  confirmationMotDePasse: '',
});

const erreurs = reactive({});
const erreurGlobale = ref('');
const chargement = ref(false);
const motDePasseVisible = ref(false);

// Le backend impose ces bornes (DemandeInscriptionCreationSchema). Les
// recontrôler ici évite un aller-retour réseau pour une simple coquille.
const BORNES = {
  nom: { min: 2, max: 100 },
  prenom: { min: 2, max: 100 },
  telephone: { min: 6, max: 20 },
  referencePaiement: { max: 100 },
  motDePasse: { min: 8, max: 128 },
};

function vider() {
  Object.keys(formulaire).forEach((cle) => (formulaire[cle] = ''));
  Object.keys(erreurs).forEach((cle) => delete erreurs[cle]);
  erreurGlobale.value = '';
}

/**
 * Validation locale. Ne se substitue pas au backend : celui-ci revalide
 * toujours, c'est cette validation qui évite surtout un aller-retour.
 */
function valider() {
  Object.keys(erreurs).forEach((cle) => delete erreurs[cle]);

  for (const champ of ['nom', 'prenom', 'referencePaiement']) {
    const valeur = formulaire[champ].trim();
    if (!valeur) erreurs[champ] = 'Ce champ est obligatoire.';
    else if (valeur.length < BORNES[champ].min) erreurs[champ] = `Minimum ${BORNES[champ].min} caractères.`;
  }

  const email = formulaire.email.trim();
  if (!email) erreurs.email = 'Ce champ est obligatoire.';
  else {
    const message = validateEmailFormat(email);
    if (message) erreurs.email = message;
  }

  const telephone = formulaire.telephone.trim();
  if (!telephone) erreurs.telephone = 'Ce champ est obligatoire.';
  else {
    const message = validateTelephone(telephone);
    if (message) erreurs.telephone = message;
  }

  if (!formulaire.referencePaiement.trim()) {
    erreurs.referencePaiement = 'Ce champ est obligatoire.';
  }

  const motDePasse = formulaire.motDePasse;
  if (!motDePasse) erreurs.motDePasse = 'Ce champ est obligatoire.';
  else if (motDePasse.length < BORNES.motDePasse.min) {
    erreurs.motDePasse = `Minimum ${BORNES.motDePasse.min} caractères.`;
  }

  if (!formulaire.confirmationMotDePasse) {
    erreurs.confirmationMotDePasse = 'Confirmez votre mot de passe.';
  } else if (formulaire.confirmationMotDePasse !== motDePasse) {
    erreurs.confirmationMotDePasse = 'Les deux mots de passe ne correspondent pas.';
  }

  return Object.keys(erreurs).length === 0;
}

const aDesErreurs = computed(() => Object.keys(erreurs).length > 0);

async function envoyer() {
  erreurGlobale.value = '';
  if (!valider() || chargement.value) return;

  chargement.value = true;
  try {
    await creerDemandeInscription({
      nom: formulaire.nom.trim(),
      prenom: formulaire.prenom.trim(),
      email: formulaire.email.trim(),
      telephone: formulaire.telephone.trim(),
      referencePaiement: formulaire.referencePaiement.trim(),
      motDePasse: formulaire.motDePasse,
      confirmationMotDePasse: formulaire.confirmationMotDePasse,
    });

    vider();
    emit('envoye');
  } catch (e) {
    // 409 = email déjà utilisé ou demande en attente, 429 = quota atteint.
    // Le backend renvoie un message lisible dans les deux cas, on l'affiche tel
    // quel plutôt que d'en inventer un.
    erreurGlobale.value = e.message;
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <form class="grid gap-4" novalidate @submit.prevent="envoyer">
    <div
      v-if="erreurGlobale"
      class="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
      role="alert"
    >
      <i class="fa-solid fa-circle-exclamation mt-0.5"></i>
      <span>{{ erreurGlobale }}</span>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput v-model="formulaire.prenom" label="Prénom" :error="erreurs.prenom" autocomplete="given-name" />
      <AppInput v-model="formulaire.nom" label="Nom" :error="erreurs.nom" autocomplete="family-name" />
    </div>

    <AppInput
      v-model="formulaire.email"
      label="Adresse email"
      type="email"
      :error="erreurs.email"
      autocomplete="email"
      placeholder="nom@exemple.com"
    />

    <AppInput
      v-model="formulaire.telephone"
      label="Téléphone"
      type="tel"
      :error="erreurs.telephone"
      autocomplete="tel"
      placeholder="+221 77 000 00 00"
    />

    <AppInput
      v-model="formulaire.referencePaiement"
      label="Référence de paiement"
      :error="erreurs.referencePaiement"
      placeholder="Reçue de paiement, référence de virement…"
    />

    <div>
      <p class="mb-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Choisissez le mot de passe que vous utiliserez pour vous connecter.
        Il sera demandé de le changer à votre première connexion.
      </p>
      <div class="grid gap-4 sm:grid-cols-2">
        <AppInput
          v-model="formulaire.motDePasse"
          label="Mot de passe"
          :type="motDePasseVisible ? 'text' : 'password'"
          :error="erreurs.motDePasse"
          autocomplete="new-password"
        />
        <AppInput
          v-model="formulaire.confirmationMotDePasse"
          label="Confirmation"
          :type="motDePasseVisible ? 'text' : 'password'"
          :error="erreurs.confirmationMotDePasse"
          autocomplete="new-password"
        />
      </div>
      <button
        type="button"
        @click="motDePasseVisible = !motDePasseVisible"
        class="mt-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <i class="fa-solid mr-1" :class="motDePasseVisible ? 'fa-eye-slash' : 'fa-eye'"></i>
        {{ motDePasseVisible ? 'Masquer' : 'Afficher' }} les mots de passe
      </button>
    </div>

    <AppButton type="submit" :disabled="chargement || aDesErreurs">
      <span v-if="chargement" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      {{ chargement ? 'Envoi...' : 'Envoyer ma demande' }}
    </AppButton>

    <p class="text-center text-xs text-slate-500 dark:text-slate-400">
      Votre demande sera examinée par l'administration. Aucun compte n'est créé
      avant son acceptation.
    </p>
  </form>
</template>
