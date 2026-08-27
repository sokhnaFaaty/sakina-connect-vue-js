<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { HOME_PAGE_BY_ROLE } from '@/config/roles.js';
import { validateLoginEmail, validateLoginPassword } from '@/utils/validators.js';

import coverImage from '@/assets/CouvertureLogin.jpg';

const email = ref('');
const motDePasse = ref('');
const motDePasseVisible = ref(false);
const erreurEmail = ref('');
const erreurMotDePasse = ref('');
const chargement = ref(false);
const erreurMessage = ref('');
const router = useRouter();
const auth = useAuthStore();

watch(email, (valeur) => {
  if (String(valeur).trim()) erreurEmail.value = '';
});

watch(motDePasse, (valeur) => {
  if (String(valeur).trim()) erreurMotDePasse.value = '';
});

function basculerMotDePasse() {
  motDePasseVisible.value = !motDePasseVisible.value;
}

async function seConnecter() {
  erreurMessage.value = '';

  let hasError = false;

  const erreurEmailValidation = validateLoginEmail(email.value.trim());
  if (erreurEmailValidation) {
    erreurEmail.value = erreurEmailValidation;
    hasError = true;
  } else {
    erreurEmail.value = '';
  }

  const erreurMotDePasseValidation = validateLoginPassword(motDePasse.value);
  if (erreurMotDePasseValidation) {
    erreurMotDePasse.value = erreurMotDePasseValidation;
    hasError = true;
  } else {
    erreurMotDePasse.value = '';
  }

  if (hasError) return;

  chargement.value = true;
  try {
    await auth.login(email.value.trim(), motDePasse.value);
    router.push('/' + (HOME_PAGE_BY_ROLE[auth.role] || 'login'));
  } catch (e) {
    erreur.value = e.message;
  } finally {
    chargement.value = false;
  }
}

const bgStyle = {
  backgroundImage: `linear-gradient(rgba(35,42,27,.82), rgba(35,42,27,.94)), url(${coverImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
};
</script>
<template>
  <div class="flex min-h-screen flex-col lg:grid lg:grid-cols-2">

    <div class="relative flex flex-col justify-center overflow-hidden p-8 text-white lg:p-14" :style="bgStyle">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-moon text-2xl text-[#BC7B3B]"></i>
        <span class="text-2xl font-black">Sakina <span class="text-[#BC7B3B]">Connect</span></span>
      </div>

      <h1 class="mt-10 max-w-lg text-3xl font-black leading-tight lg:text-4xl">
        La sérénité au cœur de votre pèlerinage
      </h1>
      <p class="mt-4 max-w-md text-slate-200">
        Plateforme de gestion des voyages Omra &amp; Hajj : suivi des pèlerins et des groupes,
        itinéraires, annonces et assistance SOS géolocalisée en temps réel.
      </p>

      <ul class="mt-10 grid max-w-md gap-3">
        <li class="flex items-center gap-3">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#BC7B3B]/20 text-[#BC7B3B]"
            ><i class="fa-solid fa-users"></i
          ></span>
          <span class="text-sm text-slate-200">Suivi des pèlerins, guides et groupes</span>
        </li>
        <li class="flex items-center gap-3">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#BC7B3B]/20 text-[#BC7B3B]"
            ><i class="fa-solid fa-route"></i
          ></span>
          <span class="text-sm text-slate-200">Itinéraires et rituels planifiés</span>
        </li>
        <li class="flex items-center gap-3">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#BC7B3B]/20 text-[#BC7B3B]"
            ><i class="fa-solid fa-triangle-exclamation"></i
          ></span>
          <span class="text-sm text-slate-200">Assistance SOS géolocalisée</span>
        </li>
        <li class="flex items-center gap-3">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#BC7B3B]/20 text-[#BC7B3B]"
            ><i class="fa-solid fa-hand-holding-heart"></i
          ></span>
          <span class="text-sm text-slate-200">Portail famille pour les proches</span>
        </li>
      </ul>

      <p class="mt-12 text-xs text-slate-400">
        Gestion sereine et organisation de la logistique physique.
      </p>
    </div>

    <div class="flex items-center justify-center bg-[#F2F2DE] p-6 sm:p-10 lg:p-14">
      <div class="w-full max-w-md">
        <h2 class="text-2xl font-black text-[#333D2A]">Connexion</h2>
        <p class="mt-1 text-sm text-slate-500">Accédez à votre espace personnel.</p>

        <div v-if="erreurMessage" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          <i class="fa-solid fa-circle-exclamation mr-2"></i>
          <span>{{ erreurMessage }}</span>
        </div>

        <div class="mt-6 grid gap-4">
          <div>
            <label class="mb-1 block text-xs font-bold text-[#333D2A]" for="loginEmail">Adresse email :</label>
            <input
              v-model="email"
              class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
              :class="erreurEmail ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-[#BC7B3B]/30'"
              type="email"
              id="loginEmail"
              placeholder="nom@gmail.com"
              autocomplete="email"
            />
            <p v-if="erreurEmail" class="mt-1 text-xs text-rose-600">{{ erreurEmail }}</p>
          </div>

          <div>
            <label class="mb-1 block text-xs font-bold text-[#333D2A]" for="loginPassword"
              >Mot de passe :</label
            >
            <div class="relative">
              <input
                v-model="motDePasse"
                @keyup.enter="seConnecter"
                class="w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm outline-none focus:ring-2"
                :class="erreurMotDePasse ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-[#BC7B3B]/30'"
                :type="motDePasseVisible ? 'text' : 'password'"
                id="loginPassword"
                placeholder="••••••••••••"
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="basculerMotDePasse"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Afficher/masquer le mot de passe"
              >
                <i class="fa-solid" :class="motDePasseVisible ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
            <p v-if="erreurMotDePasse" class="mt-1 text-xs text-rose-600">{{ erreurMotDePasse }}</p>
          </div>

          <button
            @click="seConnecter"
            :disabled="chargement"
            class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#333D2A] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="chargement" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            {{ chargement ? 'Connexion...' : 'Connexion' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template> 
