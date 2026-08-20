<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const email = ref('');
const motDePasse = ref('');
const chargement = ref(false);
const erreurMessage = ref('');
const router = useRouter();
const auth = useAuthStore();

async function seConnecter() {
  if (!email.value || !motDePasse.value) return;
  chargement.value = true;
  erreurMessage.value = '';
  try {
    await auth.login(email.value, motDePasse.value);
    router.push('/groupes');
  } catch (e) {
    erreurMessage.value = e.message;
  } finally {
    chargement.value = false;
  }
}
</script>
<template>
  <div class="flex min-h-screen items-center justify-center bg-[#F2F2DE] p-4">
    <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
      <h2 class="text-2xl font-black text-[#333D2A]">Connexion</h2>
      <p class="mt-1 text-sm text-slate-500">Accédez à votre espace.</p>
      <div v-if="erreurMessage" class="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{{ erreurMessage }}</div>
      <div class="mt-6 grid gap-4">
        <AppInput v-model="email" label="Adresse email" type="email" autocomplete="email" />
        <AppInput v-model="motDePasse" label="Mot de passe" type="password" autocomplete="current-password" />
        <AppButton @click="seConnecter" :disabled="chargement" variant="primary" class="mt-2 w-full justify-center">
          <span v-if="chargement" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          {{ chargement ? 'Connexion...' : 'Se connecter' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>