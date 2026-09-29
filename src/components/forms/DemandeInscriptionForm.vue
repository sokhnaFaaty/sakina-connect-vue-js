<script setup>
import { ref, reactive, computed } from 'vue';
import { creerDemandeInscription } from '@/services/demandeInscriptionService.js';
import { validateEmailFormat, validateTelephone } from '@/utils/validators.js';

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

// Bornes identiques à DemandeInscriptionCreationSchema côté backend. Les
// recontrôler ici évite un aller-retour réseau pour une simple coquille ; le
// backend revalide de toute façon, cette validation n'est qu'un confort.
const BORNES = {
  nom: { min: 2 },
  prenom: { min: 2 },
  telephone: { min: 6 },
  motDePasse: { min: 8 },
};

function vider() {
  Object.keys(formulaire).forEach((cle) => (formulaire[cle] = ''));
  Object.keys(erreurs).forEach((cle) => delete erreurs[cle]);
  erreurGlobale.value = '';
}

function valider() {
  Object.keys(erreurs).forEach((cle) => delete erreurs[cle]);

  for (const champ of ['nom', 'prenom']) {
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

  if (!formulaire.motDePasse) erreurs.motDePasse = 'Ce champ est obligatoire.';
  else if (formulaire.motDePasse.length < BORNES.motDePasse.min) {
    erreurs.motDePasse = `Minimum ${BORNES.motDePasse.min} caractères.`;
  }

  if (!formulaire.confirmationMotDePasse) {
    erreurs.confirmationMotDePasse = 'Confirmez votre mot de passe.';
  } else if (formulaire.confirmationMotDePasse !== formulaire.motDePasse) {
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
    // Le backend renvoie un message lisible dans les deux cas : on l'affiche
    // tel quel plutôt que d'en inventer un qui masquerait la vraie cause.
    erreurGlobale.value = e.message;
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <form class="grid gap-5" novalidate @submit.prevent="envoyer">
    <div
      v-if="erreurGlobale"
      class="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
      role="alert"
    >
      <i class="fa-solid fa-circle-exclamation mt-0.5"></i>
      <span>{{ erreurGlobale }}</span>
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="demandePrenom">Prénom</label>
        <input
          v-model="formulaire.prenom"
          id="demandePrenom"
          autocomplete="given-name"
          class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-slate-100"
          :class="erreurs.prenom ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/25 dark:border-slate-600'"
        />
        <p v-if="erreurs.prenom" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{{ erreurs.prenom }}</p>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="demandeNom">Nom</label>
        <input
          v-model="formulaire.nom"
          id="demandeNom"
          autocomplete="family-name"
          class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-slate-100"
          :class="erreurs.nom ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/25 dark:border-slate-600'"
        />
        <p v-if="erreurs.nom" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{{ erreurs.nom }}</p>
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="demandeEmail">
        Adresse email
      </label>
      <input
        v-model="formulaire.email"
        id="demandeEmail"
        type="email"
        autocomplete="email"
        placeholder="nom@exemple.com"
        class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-slate-100"
        :class="erreurs.email ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/25 dark:border-slate-600'"
      />
      <p v-if="erreurs.email" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{{ erreurs.email }}</p>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="demandeTelephone">
        Téléphone
      </label>
      <input
        v-model="formulaire.telephone"
        id="demandeTelephone"
        type="tel"
        autocomplete="tel"
        placeholder="+221 77 000 00 00"
        class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-slate-100"
        :class="erreurs.telephone ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/25 dark:border-slate-600'"
      />
      <p v-if="erreurs.telephone" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{{ erreurs.telephone }}</p>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="demandeReference">
        Référence de paiement
      </label>
      <input
        v-model="formulaire.referencePaiement"
        id="demandeReference"
        placeholder="Reçue de paiement, référence de virement…"
        class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-slate-100"
        :class="erreurs.referencePaiement ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/25 dark:border-slate-600'"
      />
      <p v-if="erreurs.referencePaiement" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
        {{ erreurs.referencePaiement }}
      </p>
    </div>

    <div class="rounded-2xl border border-[#BC7B3B]/25 bg-[#BC7B3B]/5 p-4 dark:border-[#BC7B3B]/30 dark:bg-[#BC7B3B]/10">
      <p class="text-xs leading-relaxed text-[#333D2A]/80 dark:text-slate-300">
        Choisissez le mot de passe que vous utiliserez pour vous connecter. Il vous
        sera demandé de le changer à votre première connexion.
      </p>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="demandeMdp">
            Mot de passe
          </label>
          <input
            v-model="formulaire.motDePasse"
            id="demandeMdp"
            :type="motDePasseVisible ? 'text' : 'password'"
            autocomplete="new-password"
            class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-slate-100"
            :class="erreurs.motDePasse ? 'border-rose-400' : 'border-slate-300 focus:border-[#BC7B3B] dark:border-slate-600'"
          />
          <p v-if="erreurs.motDePasse" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
            {{ erreurs.motDePasse }}
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="demandeMdpConfirm">
            Confirmation
          </label>
          <input
            v-model="formulaire.confirmationMotDePasse"
            id="demandeMdpConfirm"
            :type="motDePasseVisible ? 'text' : 'password'"
            autocomplete="new-password"
            class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-slate-100"
            :class="erreurs.confirmationMotDePasse ? 'border-rose-400' : 'border-slate-300 focus:border-[#BC7B3B] dark:border-slate-600'"
          />
          <p v-if="erreurs.confirmationMotDePasse" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
            {{ erreurs.confirmationMotDePasse }}
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="motDePasseVisible = !motDePasseVisible"
        class="mt-3 text-xs font-bold text-[#BC7B3B] transition hover:brightness-110"
      >
        <i class="fa-solid mr-1" :class="motDePasseVisible ? 'fa-eye-slash' : 'fa-eye'"></i>
        {{ motDePasseVisible ? 'Masquer' : 'Afficher' }} les mots de passe
      </button>
    </div>

    <button
      type="submit"
      :disabled="chargement"
      class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#BC7B3B] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#BC7B3B]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        v-if="chargement"
        class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
      ></span>
      <i v-else class="fa-solid fa-paper-plane"></i>
      {{ chargement ? 'Envoi en cours...' : 'Envoyer ma demande' }}
    </button>

    <p class="text-center text-xs leading-relaxed text-[#333D2A]/60 dark:text-slate-400">
      Votre demande sera examinée par l'administration. Aucun compte n'est créé
      avant son acceptation.
    </p>
  </form>
</template>
