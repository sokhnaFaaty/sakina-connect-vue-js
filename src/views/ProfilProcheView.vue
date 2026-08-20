<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { updateUtilisateur } from '@/services/utilisateurService.js';
import { useToast } from '@/composables/index.js';

const auth = useAuthStore(); const form = ref({ nom: auth.utilisateur.nomComplet, tel: auth.utilisateur.telephone });
const { succes, erreur } = useToast();

async function save() {
  try { await updateUtilisateur(auth.utilisateur.id, form.value); succes('Profil mis à jour.'); } catch(e) { erreur(e.message); }
}
</script>
<template>
  <section>
    <PageHeader title="Mon Profil de Proche" kicker="Identité" />
    <div class="bg-white p-6 rounded-2xl border max-w-2xl">
      <AppInput v-model="form.nom" label="Nom complet" />
      <AppInput v-model="form.tel" label="Numéro de téléphone" />
      <AppInput type="password" label="Nouveau mot de passe" placeholder="Laisser vide" />
      <AppButton @click="save" class="mt-4">Enregistrer</AppButton>
    </div>
  </section>
</template>