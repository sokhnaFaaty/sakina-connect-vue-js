<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from '@/composables/useTheme.js';
import { useAuthStore } from '@/stores/auth.js';
import { HOME_PAGE_BY_ROLE } from '@/config/roles.js';

import coverImage from '@/assets/CouvertureLogin.jpg';

const { isDark, toggleTheme } = useTheme();
const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const motDePasse = ref('');
const motDePasseVisible = ref(false);
const chargement = ref(false);
const erreurMessage = ref('');

const FONCTIONNALITES = [
  {
    icone: 'fa-users',
    titre: 'Suivi des pèlerins',
    texte: 'Chaque pèlerin, chaque guide, chaque groupe, au même endroit.',
  },
  {
    icone: 'fa-route',
    titre: 'Itinéraires et rituels',
    texte: 'Les étapes du voyage planifiées et consultables par tous.',
  },
  {
    icone: 'fa-triangle-exclamation',
    titre: 'Assistance SOS',
    texte: 'Une alerte géolocalisée, transmise aux guides du groupe.',
  },
  {
    icone: 'fa-hand-holding-heart',
    titre: 'Portail famille',
    texte: 'Vos proches suivent votre parcours depuis chez eux.',
  },
];

function basculerMotDePasse() {
  motDePasseVisible.value = !motDePasseVisible.value;
}

async function seConnecter() {
  erreurMessage.value = '';
  if (!email.value.trim() || !motDePasse.value) {
    erreurMessage.value = 'Renseignez votre email et votre mot de passe.';
    return;
  }

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
</script>

<template>
  <div class="min-h-screen bg-[#F2F2DE] dark:bg-black">
    <header class="sticky top-0 z-40 border-b border-black/5 bg-[#F2F2DE]/90 backdrop-blur dark:border-white/10 dark:bg-black/90">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-moon text-xl text-[#BC7B3B]"></i>
          <span class="text-lg font-black text-[#333D2A] dark:text-white">
            Sakina <span class="text-[#BC7B3B]">Connect</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="toggleTheme"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
          >
            <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
          </button>
          <RouterLink
            to="/rejoindre"
            class="rounded-xl bg-[#333D2A] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 dark:bg-[#BC7B3B] dark:text-[#333D2A]"
          >
            Nous rejoindre
          </RouterLink>
        </div>
      </div>
    </header>

    <main>
      <!-- Présentation -->
      <section class="relative overflow-hidden" :style="{ backgroundImage: `linear-gradient(rgba(35,42,27,.86), rgba(35,42,27,.95)), url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }">
        <div class="mx-auto grid max-w-6xl gap-10 px-5 py-16 text-white lg:grid-cols-2 lg:py-24">
          <div>
            <h1 class="text-3xl font-black leading-tight lg:text-4xl">
              La sérénité au cœur de votre pèlerinage
            </h1>
            <p class="mt-4 text-slate-200">
              Sakina Connect centralise le suivi des pèlerins, les itinéraires, les
              annonces et l'assistance d'urgence géolocalisée, pour Omra comme pour
              Hajj.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <RouterLink
                to="/rejoindre"
                class="rounded-xl bg-[#BC7B3B] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                Demander mon inscription
              </RouterLink>
              <a
                href="#connexion"
                class="rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                J'ai déjà un compte
              </a>
            </div>
          </div>

          <ul class="grid gap-4 self-center">
            <li
              v-for="fonctionnalite in FONCTIONNALITES"
              :key="fonctionnalite.titre"
              class="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#BC7B3B]/20 text-[#BC7B3B]">
                <i class="fa-solid" :class="fonctionnalite.icone"></i>
              </span>
              <span>
                <span class="block text-sm font-bold">{{ fonctionnalite.titre }}</span>
                <span class="block text-sm text-slate-300">{{ fonctionnalite.texte }}</span>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Connexion -->
      <section id="connexion" class="mx-auto max-w-6xl px-5 py-16">
        <div class="mx-auto max-w-md">
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
              <label class="mb-1 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="accueilEmail">
                Adresse email :
              </label>
              <input
                v-model="email"
                type="email"
                id="accueilEmail"
                autocomplete="email"
                placeholder="nom@exemple.com"
                class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#BC7B3B]/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="accueilPassword">
                Mot de passe :
              </label>
              <div class="relative">
                <input
                  v-model="motDePasse"
                  :type="motDePasseVisible ? 'text' : 'password'"
                  id="accueilPassword"
                  autocomplete="current-password"
                  placeholder="••••••••••••"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[#BC7B3B]/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  @click="basculerMotDePasse"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-100"
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  <i class="fa-solid" :class="motDePasseVisible ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="chargement"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#333D2A] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-[#BC7B3B] dark:text-[#333D2A]"
            >
              <span v-if="chargement" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              {{ chargement ? 'Connexion...' : 'Connexion' }}
            </button>
          </form>
        </div>
      </section>
    </main>

    <footer class="border-t border-black/5 py-8 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
      Sakina Connect — gestion sereine et organisation de la logistique du pèlerinage.
    </footer>
  </div>
</template>
