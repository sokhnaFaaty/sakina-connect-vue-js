<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getPelerinByUtilisateurId, updatePelerin } from '@/services/pelerinService.js';
import { useToast } from '@/composables/index.js';

const auth = useAuthStore(); const form = ref({ telephone: '', email: '' });
const { succes, erreur } = useToast();

onMounted(async () => {
  const p = await getPelerinByUtilisateurId(auth.utilisateur.id);
  form.value = { telephone: auth.utilisateur.telephone, email: auth.utilisateur.email, id: p.id };
});

async function save() {
  try { await updatePelerin(form.value.id, form.value); succes('Profil mis à jour.'); } catch(e) { erreur(e.message); }
}
</script>
<template>
  <section>
    <PageHeader title="Mon Profil Spirituel" kicker="Identité" />
    <div class="bg-white p-6 rounded-2xl border max-w-2xl">
      <AppInput v-model="form.telephone" label="Numéro de téléphone" />
      <AppInput v-model="form.email" label="Adresse email" type="email" />
      <AppInput type="password" label="Nouveau mot de passe" placeholder="Laisser vide" />
      <AppButton @click="save" class="mt-4">Enregistrer</AppButton>
    </div>
  </section>
</template>