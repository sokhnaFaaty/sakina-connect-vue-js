<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { HOME_PAGE_BY_ROLE } from '@/config/roles.js'; // Ton fichier roles.js

const email = ref('');
const motDePasse = ref('');
const chargement = ref(false);
const erreur = ref('');

const router = useRouter();
const authStore = useAuthStore(); // On récupère le store

async function seConnecter() {
  if (!email.value || !motDePasse.value) return;
  chargement.value = true;
  erreur.value = '';

  try {
    // Le store gère la connexion et la persistance
    const user = await authStore.login(email.value, motDePasse.value);
    
    // Redirection vers la page d'accueil selon son rôle
    router.push(HOME_PAGE_BY_ROLE[user.role] || '/groupes');
  } catch (e) {
    erreur.value = e.message;
  } finally {
    chargement.value = false;
  }
}
</script>
<template>
  <!-- Ton template de LoginView ici -->
</template>