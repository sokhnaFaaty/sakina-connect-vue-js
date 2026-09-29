<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { HOME_PAGE_BY_ROLE } from '@/config/roles.js';
import { useTheme } from '@/composables/useTheme.js';
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
const { isDark, toggleTheme } = useTheme();

const AVANTAGES = [
  {
    icone: 'fa-users',
    texte: 'Suivi des pèlerins, guides et groupes',
  },
  {
    icone: 'fa-route',
    texte: 'Itinéraires et rituels planifiés',
  },
  {
    icone: 'fa-triangle-exclamation',
    texte: 'Assistance SOS géolocalisée',
  },
  {
    icone: 'fa-hand-holding-heart',
    texte: 'Portail famille pour les proches',
  },
];

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

  let aUneErreur = false;

  const messageEmail = validateLoginEmail(email.value.trim());
  if (messageEmail) {
    erreurEmail.value = messageEmail;
    aUneErreur = true;
  } else {
    erreurEmail.value = '';
  }

  const messageMotDePasse = validateLoginPassword(motDePasse.value);
  if (messageMotDePasse) {
    erreurMotDePasse.value = messageMotDePasse;
    aUneErreur = true;
  } else {
    erreurMotDePasse.value = '';
  }

  if (aUneErreur) return;

  chargement.value = true;
  try {
    await auth.login(email.value.trim(), motDePasse.value);
    router.push('/' + (HOME_PAGE_BY_ROLE[auth.role] || 'login'));
  } catch (e) {
    erreurMessage.value = e.message;
  } finally {
    chargement.value = false;
  }
}

// Voile vert foncé sur l'image, pour garder le texte blanc lisible.
const styleImage = {
  backgroundImage: `linear-gradient(rgba(35,42,27,.82), rgba(35,42,27,.94)), url(${coverImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};
</script>

<template>
  <div class="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
    <!-- Bascule Sombre / Clair -->
    <button
      @click="toggleTheme"
      class="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur transition hover:bg-white/20"
      :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
    >
      <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
    </button>

    <!-- ============ GAUCHE : l'image ============ -->
    <div
      class="relative flex flex-col justify-center overflow-hidden p-8 text-white lg:p-14"
      :style="styleImage"
    >
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
        <li v-for="avantage in AVANTAGES" :key="avantage.texte" class="flex items-center gap-3">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#BC7B3B]/20 text-[#BC7B3B]"
          >
            <i class="fa-solid" :class="avantage.icone"></i>
          </span>
          <span class="text-sm text-slate-200">{{ avantage.texte }}</span>
        </li>
      </ul>

      <p class="mt-12 text-xs text-slate-400">
        Gestion sereine et organisation de la logistique physique.
      </p>
    </div>

    <!-- ============ DROITE : le formulaire ============ -->
    <div class="flex items-center justify-center bg-[#F2F2DE] p-6 sm:p-10 lg:p-14 dark:bg-black">
      <div class="w-full max-w-md">
        <h2 class="text-2xl font-black text-[#333D2A] dark:text-white">Connexion</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Accédez à votre espace personnel.
        </p>

        <div
          v-if="erreurMessage"
          class="mt-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
          role="alert"
        >
          <i class="fa-solid fa-circle-exclamation mt-0.5"></i>
          <span>{{ erreurMessage }}</span>
        </div>

        <form class="mt-6 grid gap-4" novalidate @submit.prevent="seConnecter">
          <div>
            <label class="mb-1 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="loginEmail">
              Adresse email :
            </label>
            <input
              v-model="email"
              class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100"
              :class="
                erreurEmail
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-[#BC7B3B]/30 dark:border-slate-600'
              "
              type="email"
              id="loginEmail"
              placeholder="nom@exemple.com"
              autocomplete="email"
            />
            <p v-if="erreurEmail" class="mt-1 text-xs text-rose-600 dark:text-rose-400">{{ erreurEmail }}</p>
          </div>

          <div>
            <label class="mb-1 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="loginPassword">
              Mot de passe :
            </label>
            <div class="relative">
              <input
                v-model="motDePasse"
                class="w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100"
                :class="
                  erreurMotDePasse
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-[#BC7B3B]/30 dark:border-slate-600'
                "
                :type="motDePasseVisible ? 'text' : 'password'"
                id="loginPassword"
                placeholder="••••••••••••"
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="basculerMotDePasse"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-100"
                aria-label="Afficher ou masquer le mot de passe"
              >
                <i class="fa-solid" :class="motDePasseVisible ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
            <p v-if="erreurMotDePasse" class="mt-1 text-xs text-rose-600 dark:text-rose-400">
              {{ erreurMotDePasse }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="chargement"
            class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#333D2A] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              v-if="chargement"
              class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            ></span>
            {{ chargement ? 'Connexion...' : 'Connexion' }}
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Pas encore de place ?
          <RouterLink to="/nous-rejoindre" class="font-bold text-[#BC7B3B] hover:underline">
            Demandez votre inscription
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
