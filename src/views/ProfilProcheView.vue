<script setup>
import { ref } from 'vue';
import { useAuthStore, saveSession } from '@/stores/auth.js';
import { updateUtilisateur } from '@/services/utilisateurService.js';
import { useToast } from '@/composables/index.js';

const auth = useAuthStore();
const { success, error } = useToast();
const chargement = ref(false);

const form = ref({
  nomComplet: auth.utilisateur.nomComplet,
  telephone: auth.utilisateur.telephone,
  email: auth.utilisateur.email,
  photo: auth.utilisateur.photo || '',
  motDePasse: '',
  motDePasseConfirm: ''
});

async function sauvegarder() {
  if (form.value.motDePasse && form.value.motDePasse !== form.value.motDePasseConfirm) {
    error("Les mots de passe ne correspondent pas.");
    return;
  }

  chargement.value = true;
  try {
    const majUser = {
      nomComplet: form.value.nomComplet,
      email: form.value.email,
      telephone: form.value.telephone,
      photo: form.value.photo,
    };
    if (form.value.motDePasse) majUser.motDePasse = form.value.motDePasse;

    await updateUtilisateur(auth.utilisateur.id, majUser);

    // Mise à jour du store
    const updatedUser = { ...auth.utilisateur, ...majUser };
    auth.utilisateur = updatedUser;
    saveSession(updatedUser, auth.token);

    success('Profil mis à jour.');
  } catch (e) {
    error(e.message);
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <section>
    <PageHeader title="Mon Profil de Proche" kicker="Identité" />
    <div class="max-w-2xl bg-white p-6 rounded-2xl border grid gap-4">
      <AppInput v-model="form.nomComplet" label="Nom complet" />
      <AppInput v-model="form.telephone" label="Téléphone" />
      <AppInput v-model="form.email" type="email" label="Email" />
      
      <div class="grid gap-4 sm:grid-cols-2">
        <AppInput v-model="form.motDePasse" type="password" label="Nouveau mot de passe" placeholder="Laisser vide" />
        <AppInput v-model="form.motDePasseConfirm" type="password" label="Confirmer le mot de passe" placeholder="Retapez" />
      </div>

      <AppButton @click="sauvegarder" :disabled="chargement" class="mt-4">Enregistrer</AppButton>
    </div>
  </section>
</template>