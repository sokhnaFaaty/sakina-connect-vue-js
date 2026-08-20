<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore, saveSession } from '@/stores/auth.js'; // Assure-toi d'exporter saveSession depuis ton store
import { getPelerinByUtilisateurId, updatePelerin } from '@/services/pelerinService.js';
import { updateUtilisateur } from '@/services/utilisateurService.js';
import { useToast } from '@/composables/index.js';
import { validateEmailFormat, validateTelephone } from '@/utils/validators.js';

const auth = useAuthStore();
const { success, error } = useToast();
const chargement = ref(false);

// Données du compte utilisateur
const form = ref({
  nomComplet: auth.utilisateur.nomComplet,
  email: auth.utilisateur.email,
  telephone: auth.utilisateur.telephone,
  photo: auth.utilisateur.photo || '',
  motDePasse: '',
  motDePasseConfirm: ''
});

// Données spécifiques au pèlerin
const pelerin = ref(null);
const informationsMedicales = ref('');

async function charger() {
  try {
    pelerin.value = await getPelerinByUtilisateurId(auth.utilisateur.id);
    if (pelerin.value) {
      informationsMedicales.value = pelerin.value.informationsMedicales || '';
    }
  } catch (e) { error(e.message); }
}
onMounted(charger);

async function sauvegarder() {
  let hasError = false;
  if (form.value.motDePasse && form.value.motDePasse !== form.value.motDePasseConfirm) {
    error("Les mots de passe ne correspondent pas.");
    return;
  }

  chargement.value = true;
  try {
    // 1. Mise à jour du compte utilisateur
    const majUser = {
      nomComplet: form.value.nomComplet,
      email: form.value.email,
      telephone: form.value.telephone,
      photo: form.value.photo,
    };
    if (form.value.motDePasse) majUser.motDePasse = form.value.motDePasse;
    
    await updateUtilisateur(auth.utilisateur.id, majUser);

    // 2. Mise à jour de la fiche pèlerin (Médical + Passeport si modifié par l'admin)
    await updatePelerin(pelerin.value.id, {
      numeroPasseport: pelerin.value.numeroPasseport,
      statutVisa: pelerin.value.statutVisa,
      groupeId: pelerin.value.groupeId,
      informationsMedicales: informationsMedicales.value,
    });

    // 3. Mise à jour du store et du localStorage
    const updatedUser = { ...auth.utilisateur, ...majUser };
    auth.utilisateur = updatedUser;
    saveSession(updatedUser, auth.token); // Si tu as créé cette action

    success('Profil mis à jour avec succès.');
  } catch (e) {
    error(e.message);
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <section>
    <PageHeader title="Mon Profil Spirituel" kicker="Identité" />
    <div class="max-w-2xl bg-white p-6 rounded-2xl border grid gap-4">
      <AppInput v-model="form.nomComplet" label="Nom complet" />
      <AppInput v-model="form.telephone" label="Téléphone" />
      <AppInput v-model="form.email" type="email" label="Email" />
      
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Informations médicales</label>
        <textarea v-model="informationsMedicales" rows="3" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Ex: Hypertension, diabète..."></textarea>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <AppInput v-model="form.motDePasse" type="password" label="Nouveau mot de passe" placeholder="Laisser vide" />
        <AppInput v-model="form.motDePasseConfirm" type="password" label="Confirmer le mot de passe" placeholder="Retapez" />
      </div>

      <AppButton @click="sauvegarder" :disabled="chargement" class="mt-4">Enregistrer les modifications</AppButton>
    </div>
  </section>
</template>