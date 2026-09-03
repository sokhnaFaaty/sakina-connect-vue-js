<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { createPelerin, updatePelerin } from '@/services/pelerinService.js';
import { getUtilisateurById, updateUtilisateur } from '@/services/utilisateurService.js';
import { getProcheByPelerinId, createProche, updateProche } from '@/services/procheService.js';
import { emailExiste, telephoneExiste, passeportExiste } from '@/services/validationService.js';
import { uploadUserPhoto } from '@/services/cloudinaryService.js';
import { validateEmailFormat, validateTelephone } from '@/utils/validators.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  pelerin: { type: Object, default: null },
  groupes: { type: Array, required: true },
  onSaved: { type: Function, default: null },
  onProcheCree: { type: Function, default: null },
});
const emit = defineEmits(['success', 'close']);

const { success, error } = useToast();

const isEdit = !!props.pelerin;
const chargement = ref(false);

const nomComplet = ref('');
const email = ref('');
const telephone = ref('');
const numeroPasseport = ref(props.pelerin?.numeroPasseport || '');
const statutVisa = ref(props.pelerin?.statutVisa || 'EN_ATTENTE');
const groupeId = ref(props.pelerin?.groupeId || '');
const informationsMedicales = ref(props.pelerin?.informationsMedicales || '');
const photoFile = ref(null);
const apercuPhoto = ref('');

let utilisateurLie = null;
let procheExistant = null;
let procheUtilisateur = null;
const aProcheExistant = ref(false);
const ajouterProche = ref('non');
const procheNomComplet = ref('');
const procheTelephone = ref('');
const procheEmail = ref('');
const procheLienParente = ref('');

const erreurNom = ref('');
const erreurPasseport = ref('');
const erreurEmail = ref('');
const erreurTelephone = ref('');
const erreurGroupe = ref('');
const erreurPhoto = ref('');
const erreurProcheNom = ref('');
const erreurProcheTelephone = ref('');
const erreurProcheEmail = ref('');
const erreurProcheLien = ref('');

const groupeOptions = computed(() => props.groupes.map((g) => ({ value: g.id, label: g.nom })));

onMounted(async () => {
  if (!props.pelerin) return;
  try {
    utilisateurLie = await getUtilisateurById(props.pelerin.utilisateurId);
    nomComplet.value = utilisateurLie?.nomComplet || '';
    email.value = utilisateurLie?.email || '';
    telephone.value = utilisateurLie?.telephone || '';

    procheExistant = await getProcheByPelerinId(props.pelerin.id);
    if (procheExistant) {
      procheUtilisateur = await getUtilisateurById(procheExistant.utilisateurId);
      aProcheExistant.value = true;
      procheNomComplet.value = procheUtilisateur?.nomComplet || '';
      procheTelephone.value = procheUtilisateur?.telephone || '';
      procheEmail.value = procheUtilisateur?.email || '';
      procheLienParente.value = procheExistant.lienParente || '';
    }
  } catch (e) {
    error(e.message);
  }
});

function surChangementPhoto(event) {
  const file = event.target.files[0] || null;
  photoFile.value = file;
  if (apercuPhoto.value) URL.revokeObjectURL(apercuPhoto.value);
  apercuPhoto.value = file ? URL.createObjectURL(file) : '';
}

function validerChamp(value, fieldName) {
  const texte = String(value ?? '').trim();
  if (!texte) return `${fieldName} est obligatoire.`;
  return null;
}

function reinitialiserErreurs() {
  erreurNom.value = '';
  erreurPasseport.value = '';
  erreurEmail.value = '';
  erreurTelephone.value = '';
  erreurGroupe.value = '';
  erreurPhoto.value = '';
  erreurProcheNom.value = '';
  erreurProcheTelephone.value = '';
  erreurProcheEmail.value = '';
  erreurProcheLien.value = '';
}

async function creerProcheAvecMotDePasse(pelerinId, procheData) {
  const { motDePasseGenere } = await createProche({ ...procheData, pelerinId });
  if (props.onProcheCree) {
    props.onProcheCree({ nomComplet: procheData.nomComplet, motDePasseGenere });
  }
}

async function soumettre() {
  reinitialiserErreurs();

  const nom = nomComplet.value.trim();
  const passeport = numeroPasseport.value.trim();
  const mail = email.value.trim();
  const tel = telephone.value.trim();
  const infos = informationsMedicales.value.trim();

  let invalide = false;

  const errNom = validerChamp(nom, 'Le nom complet');
  if (errNom) { erreurNom.value = errNom; invalide = true; }

  const errPasseport = validerChamp(passeport, 'Le numéro de passeport');
  if (errPasseport) { erreurPasseport.value = errPasseport; invalide = true; }

  const errGroupe = validerChamp(groupeId.value, 'Le groupe');
  if (errGroupe) { erreurGroupe.value = errGroupe; invalide = true; }

  if (!isEdit) {
    const errMail = validateEmailFormat(mail);
    if (errMail) { erreurEmail.value = errMail; invalide = true; }
    const errTel = validateTelephone(tel);
    if (errTel) { erreurTelephone.value = errTel; invalide = true; }
  }

  const procheActif = aProcheExistant.value || ajouterProche.value === 'oui';
  let procheData = null;

  if (procheActif) {
    const pNom = procheNomComplet.value.trim();
    const pTel = procheTelephone.value.trim();
    const pMail = procheEmail.value.trim();
    const pLien = procheLienParente.value.trim();

    const errProcheNom = validerChamp(pNom, 'Le nom du proche');
    if (errProcheNom) { erreurProcheNom.value = errProcheNom; invalide = true; }

    const errProcheTel = validateTelephone(pTel);
    if (errProcheTel) { erreurProcheTelephone.value = errProcheTel; invalide = true; }

    const errProcheLien = validerChamp(pLien, 'Le lien de parenté');
    if (errProcheLien) { erreurProcheLien.value = errProcheLien; invalide = true; }

    if (pMail) {
      const errProcheMail = validateEmailFormat(pMail);
      if (errProcheMail) { erreurProcheEmail.value = errProcheMail; invalide = true; }
    }

    procheData = { nomComplet: pNom, telephone: pTel, email: pMail, lienParente: pLien };
  }

  if (invalide) return;

  chargement.value = true;
  try {
    if (await passeportExiste(passeport, props.pelerin?.id)) {
      erreurPasseport.value = 'Ce numéro de passeport est déjà utilisé.';
      return;
    }

    if (!isEdit) {
      if (await emailExiste(mail)) {
        erreurEmail.value = 'Cet email est déjà utilisé.';
        return;
      }
      if (await telephoneExiste(tel)) {
        erreurTelephone.value = 'Ce téléphone est déjà utilisé.';
        return;
      }
    }

    if (procheData) {
      const excludeId = procheUtilisateur?.id || null;
      if (procheData.email && (await emailExiste(procheData.email, excludeId))) {
        erreurProcheEmail.value = 'Cet email est déjà utilisé.';
        return;
      }
      if (await telephoneExiste(procheData.telephone, excludeId)) {
        erreurProcheTelephone.value = 'Ce téléphone est déjà utilisé.';
        return;
      }
    }

    let photoUrl = '';
    if (!isEdit && photoFile.value) {
      try {
        const result = await uploadUserPhoto(photoFile.value);
        photoUrl = result.photoUrl;
      } catch (e) {
        erreurPhoto.value = e.message;
        return;
      }
    }

    if (isEdit) {
      const majUtilisateur = { nomComplet: nom, email: mail, telephone: tel };
      if (photoUrl) majUtilisateur.photo = photoUrl;
      await updateUtilisateur(props.pelerin.utilisateurId, majUtilisateur);

      await updatePelerin(props.pelerin.id, {
        numeroPasseport: passeport,
        statutVisa: statutVisa.value,
        groupeId: groupeId.value,
        informationsMedicales: infos,
      });

      if (procheData) {
        if (aProcheExistant.value && procheExistant) {
          await updateProche(procheExistant.id, procheExistant.utilisateurId, procheData);
        } else {
          await creerProcheAvecMotDePasse(props.pelerin.id, procheData);
        }
      }

      success('Pèlerin modifié avec succès.');
    } else {
      const nouveauPelerin = await createPelerin({
        nomComplet: nom,
        email: mail,
        telephone: tel,
        numeroPasseport: passeport,
        statutVisa: statutVisa.value,
        groupeId: groupeId.value,
        informationsMedicales: infos,
        photo: photoUrl,
      });

      success('Pèlerin créé avec succès.');

      if (procheData) {
        await creerProcheAvecMotDePasse(nouveauPelerin.id, procheData);
      }
    }

    if (props.onSaved) props.onSaved();
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
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Nom Complet *</label>
      <input
        v-model="nomComplet"
        type="text"
        placeholder="Nom du pèlerin"
        :readonly="isEdit"
        class="w-full rounded-2xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100"
        :class="erreurNom ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:ring-[#333D2A]/30 dark:border-slate-600'"
      />
      <p v-if="erreurNom" class="mt-1 text-xs text-rose-600">{{ erreurNom }}</p>
    </div>

    <AppInput v-model="numeroPasseport" label="Numéro de Passeport *" placeholder="Numéro de passeport" :error="erreurPasseport" />

    <template v-if="!isEdit">
      <AppInput v-model="email" type="email" label="Email *" placeholder="email@exemple.com" :error="erreurEmail" />
      <AppInput v-model="telephone" type="text" label="Téléphone *" placeholder="77 123 45 67" :error="erreurTelephone" />
    </template>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Statut du Visa *</label>
      <select v-model="statutVisa" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
        <option value="EN_ATTENTE">En cours</option>
        <option value="APPROUVE">Approuvé</option>
        <option value="REFUSE">Refusé</option>
      </select>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Numéro de Groupe *</label>
      <select
        v-model="groupeId"
        class="w-full rounded-2xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100"
        :class="erreurGroupe ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:ring-[#333D2A]/30 dark:border-slate-600'"
      >
        <option value="">-- Choisir un groupe --</option>
        <option v-for="g in groupeOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
      </select>
      <p v-if="erreurGroupe" class="mt-1 text-xs text-rose-600">{{ erreurGroupe }}</p>
    </div>

    <div v-if="!isEdit">
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Image</label>
      <img v-if="apercuPhoto" :src="apercuPhoto" alt="" class="mb-2 h-14 w-14 rounded-full object-cover" />
      <input
        type="file"
        accept="image/*"
        @change="surChangementPhoto"
        class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm focus:outline-none dark:bg-slate-800 dark:text-slate-100"
        :class="erreurPhoto ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'"
      />
      <p v-if="erreurPhoto" class="mt-1 text-xs text-rose-600">{{ erreurPhoto }}</p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Problèmes de Santé Chroniques (ex: Asthme, Diabète, Fauteuil roulant)</label>
      <textarea
        v-model="informationsMedicales"
        rows="2"
        placeholder="Texte saisi"
        class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      ></textarea>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
      <p class="mb-3 text-sm font-extrabold text-slate-800 dark:text-slate-100">{{ aProcheExistant ? "Contact d'urgence (proche)" : "Ajouter un Proche ?" }}</p>

      <div v-if="!aProcheExistant" class="flex gap-4">
        <label class="flex items-center gap-2 text-sm dark:text-slate-200">
          <input type="radio" value="oui" v-model="ajouterProche" />
          OUI
        </label>
        <label class="flex items-center gap-2 text-sm dark:text-slate-200">
          <input type="radio" value="non" v-model="ajouterProche" />
          NON
        </label>
      </div>

      <div v-if="aProcheExistant || ajouterProche === 'oui'" class="grid gap-4" :class="{ 'mt-4': !aProcheExistant }">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Nom Complet *</label>
          <input
            v-model="procheNomComplet"
            type="text"
            placeholder="Entrez le nom du proche"
            class="w-full rounded-2xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100"
            :class="erreurProcheNom ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:ring-[#333D2A]/30 dark:border-slate-600'"
          />
          <p v-if="erreurProcheNom" class="mt-1 text-xs text-rose-600">{{ erreurProcheNom }}</p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Téléphone *</label>
          <input
            v-model="procheTelephone"
            type="text"
            placeholder="Entrez le téléphone"
            class="w-full rounded-2xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100"
            :class="erreurProcheTelephone ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:ring-[#333D2A]/30 dark:border-slate-600'"
          />
          <p v-if="erreurProcheTelephone" class="mt-1 text-xs text-rose-600">{{ erreurProcheTelephone }}</p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Email (facultatif)</label>
          <input
            v-model="procheEmail"
            type="email"
            placeholder="Entrez l'email du proche"
            class="w-full rounded-2xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100"
            :class="erreurProcheEmail ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:ring-[#333D2A]/30 dark:border-slate-600'"
          />
          <p v-if="erreurProcheEmail" class="mt-1 text-xs text-rose-600">{{ erreurProcheEmail }}</p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Lien de Parenté *</label>
          <input
            v-model="procheLienParente"
            type="text"
            placeholder="Entrez le lien de parenté"
            class="w-full rounded-2xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100"
            :class="erreurProcheLien ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:ring-[#333D2A]/30 dark:border-slate-600'"
          />
          <p v-if="erreurProcheLien" class="mt-1 text-xs text-rose-600">{{ erreurProcheLien }}</p>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" type="button" :disabled="chargement" @click="$emit('close')">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">{{ isEdit ? 'Enregistrer' : 'Sauvegarder le profil' }}</AppButton>
    </div>
  </form>
</template>
