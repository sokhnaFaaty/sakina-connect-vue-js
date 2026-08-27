<script setup>
import { ref } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { createGuide, updateGuide } from '@/services/guideService.js';
import { updateUtilisateur } from '@/services/utilisateurService.js';
import { emailExiste, telephoneExiste } from '@/services/validationService.js';
import { uploadUserPhoto } from '@/services/cloudinaryService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  guide: { type: Object, default: null },
  utilisateurs: { type: Array, default: () => [] },
  onSaved: { type: Function, default: null },
  onCompteCree: { type: Function, default: null },
});
const emit = defineEmits(['success', 'close']);

const { success, error } = useToast();

const utilisateurLie = props.guide
  ? props.utilisateurs.find((u) => u.id === props.guide.utilisateurId) || null
  : null;

const nomComplet = ref(utilisateurLie?.nomComplet || '');
const telephone = ref(utilisateurLie?.telephone || '');
const email = ref(utilisateurLie?.email || '');
const disponibilite = ref(props.guide ? Boolean(props.guide.disponibilite) : true);
const photoFile = ref(null);
const photoActuelle = utilisateurLie?.photo || '';

const chargement = ref(false);
const erreurNom = ref('');
const erreurTelephone = ref('');
const erreurEmail = ref('');
const erreurPhoto = ref('');

function surChangementPhoto(event) {
  photoFile.value = event.target.files[0] || null;
}

function validerChamp(value, fieldName, minLength = 1) {
  const texte = String(value ?? '').trim();
  if (!texte) return `${fieldName} est obligatoire.`;
  if (texte.length < minLength) return `${fieldName} doit contenir au moins ${minLength} caractères.`;
  return null;
}

function validerEmail(emailValue) {
  const value = String(emailValue ?? '').trim();
  if (!value) return "L'email est obligatoire.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "L'email n'est pas valide.";
}

function validerTelephone(telephoneValue) {
  let value = String(telephoneValue ?? '').replace(/\D/g, '');
  if (!value) return 'Le téléphone est obligatoire.';
  if (value.length > 9) value = value.slice(-9);
  if (!/^\d{9}$/.test(value)) return 'Le téléphone doit contenir 9 chiffres.';
  const estSN = /^(70|75|76|77|78)/.test(value);
  const estKSA = /^5/.test(value);
  if (!estSN && !estKSA) return 'Numéro invalide (Sénégal : 70/75/76/77/78 — Arabie Saoudite : 5X).';
  return null;
}

async function soumettre() {
  erreurNom.value = '';
  erreurTelephone.value = '';
  erreurEmail.value = '';
  erreurPhoto.value = '';

  const nom = nomComplet.value.trim();
  const tel = telephone.value.trim();
  const mail = email.value.trim();

  let invalide = false;
  const errNom = validerChamp(nom, 'Le nom complet');
  if (errNom) { erreurNom.value = errNom; invalide = true; }
  const errMail = validerEmail(mail);
  if (errMail) { erreurEmail.value = errMail; invalide = true; }
  const errTel = validerTelephone(tel);
  if (errTel) { erreurTelephone.value = errTel; invalide = true; }
  if (invalide) return;

  chargement.value = true;
  try {
    const excludeUserId = props.guide ? props.guide.utilisateurId : null;
    if (await emailExiste(mail, excludeUserId)) {
      erreurEmail.value = 'Cet email est déjà utilisé.';
      return;
    }
    if (await telephoneExiste(tel, excludeUserId)) {
      erreurTelephone.value = 'Ce téléphone est déjà utilisé.';
      return;
    }

    let photoUrl = '';
    if (photoFile.value) {
      try {
        const result = await uploadUserPhoto(photoFile.value);
        photoUrl = result.photoUrl;
      } catch (e) {
        erreurPhoto.value = e.message;
        return;
      }
    }

    if (props.guide) {
      const majUtilisateur = { nomComplet: nom, email: mail, telephone: tel };
      if (photoUrl) majUtilisateur.photo = photoUrl;
      await updateUtilisateur(props.guide.utilisateurId, majUtilisateur);
      await updateGuide(props.guide.id, {
        utilisateurId: props.guide.utilisateurId,
        disponibilite: disponibilite.value,
      });
      success('Guide modifié avec succès.');
      if (props.onSaved) props.onSaved();
      emit('success');
      emit('close');
    } else {
      const { motDePasseGenere } = await createGuide({
        nomComplet: nom,
        email: mail,
        telephone: tel,
        disponibilite: disponibilite.value,
        photo: photoUrl,
      });
      success('Guide créé avec succès.');
      if (props.onSaved) props.onSaved();
      emit('success');
      emit('close');
      if (props.onCompteCree) props.onCompteCree({ nomComplet: nom, motDePasseGenere });
    }
  } catch (e) {
    error(e.message);
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="soumettre" class="grid gap-4">
    <AppInput v-model="nomComplet" label="Nom complet de l'Oustadh *" placeholder="Ex: Oustadh Massaer Mboup" :error="erreurNom" />
    <AppInput v-model="telephone" type="text" label="Téléphone de Contact *" placeholder="77 123 45 67" :error="erreurTelephone" />
    <AppInput v-model="email" type="email" label="Email *" placeholder="email@gmail.com" :error="erreurEmail" />

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Image (facultatif)</label>
      <div v-if="photoActuelle" class="mb-2 flex items-center gap-3">
        <img :src="photoActuelle" alt="" class="h-14 w-14 rounded-full object-cover" />
        <span class="text-xs text-slate-500">Photo actuelle — choisissez un fichier pour la remplacer.</span>
      </div>
      <input
        type="file"
        accept="image/*"
        @change="surChangementPhoto"
        class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm focus:outline-none"
        :class="erreurPhoto ? 'border-rose-500' : 'border-slate-200'"
      />
      <p v-if="erreurPhoto" class="mt-1 text-xs text-rose-600">{{ erreurPhoto }}</p>
    </div>

    <label class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
      <span>Actuellement en Service actif (Sur place)</span>
      <input type="checkbox" v-model="disponibilite" class="h-5 w-5 accent-[#333D2A]" />
    </label>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" @click="$emit('close')" type="button">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">{{ props.guide ? 'Mettre à jour' : 'Sauvegarder le guide' }}</AppButton>
    </div>
  </form>
</template>
