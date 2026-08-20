<!-- src/views/LoginView.vue -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js'; // Tu vas créer ce store Pinia

const email = ref('');
const motDePasse = ref('');
const chargement = ref(false);
const erreurMessage = ref('');

const router = useRouter();
const authStore = useAuthStore();

async function handleLogin() {
  if (!email.value || !motDePasse.value) return;
  chargement.value = true;
  erreurMessage.value = '';

  try {
    await authStore.login(email.value, motDePasse.value);
    // Redirection après succès (gérée par Vue Router)
    router.push('/groupes'); 
  } catch (e) {
    erreurMessage.value = e.message;
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#F2F2DE]">
    <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
      <h2 class="text-2xl font-black text-[#333D2A]">Connexion</h2>
      <p class="mt-1 text-sm text-slate-500">Accédez à votre espace personnel.</p>

      <!-- Message d'erreur -->
      <div v-if="erreurMessage" class="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">
        {{ erreurMessage }}
      </div>

      <div class="mt-6 grid gap-4">
        <div>
          <label class="mb-1 block text-xs font-bold text-[#333D2A]">Adresse email</label>
          <input v-model="email" type="email" class="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#BC7B3B]" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold text-[#333D2A]">Mot de passe</label>
          <input v-model="motDePasse" type="password" class="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#BC7B3B]" />
        </div>
        <button 
          @click="handleLogin" 
          :disabled="chargement"
          class="mt-2 flex w-full justify-center rounded-xl bg-[#333D2A] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          <span v-if="chargement" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
          {{ chargement ? 'Connexion...' : 'Se connecter' }}
        </button>
      </div>
    </div>
  </div>
</template>