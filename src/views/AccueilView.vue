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

const PILLIERS = [
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

// Image de fond du héros : voile vert foncé pour garder le texte lisible.
const styleHeros = {
  backgroundImage: `linear-gradient(rgba(35,42,27,.86), rgba(35,42,27,.95)), url(${coverImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

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
    <!-- ============ ZONE 1 : HEADER ============ -->
    <header class="sticky top-0 z-40 border-b border-[#333D2A]/10 bg-[#F2F2DE]/85 backdrop-blur-md dark:border-white/10 dark:bg-black/85">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <RouterLink to="/" class="flex items-center gap-3">
          <i class="fa-solid fa-moon text-2xl text-[#BC7B3B]"></i>
          <span class="text-xl font-black tracking-tight text-[#333D2A] dark:text-white">
            Sakina <span class="text-[#BC7B3B]">Connect</span>
          </span>
        </RouterLink>

        <div class="flex items-center gap-2 sm:gap-3">
          <button
            @click="toggleTheme"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-[#333D2A]/15 text-[#333D2A] transition hover:bg-white dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
          >
            <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
          </button>

          <RouterLink
            to="/nous-rejoindre"
            class="rounded-xl bg-[#BC7B3B] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#BC7B3B]/25 transition hover:brightness-110 sm:px-5"
          >
            Nous rejoindre
          </RouterLink>
        </div>
      </div>
    </header>

    <main>
      <!-- ============ ZONE 2 : SECTION HÉRO ============ -->
      <section class="relative overflow-hidden text-white" :style="styleHeros">
        <div class="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <!-- Gauche : texte & actions -->
          <div>
            <span
              class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#BC7B3B] backdrop-blur"
            >
              <i class="fa-solid fa-star-and-crescent"></i>
              Omra &amp; Hajj
            </span>

            <h1 class="mt-6 text-4xl font-black leading-[1.1] tracking-tight lg:text-5xl">
              La sérénité au cœur de votre pèlerinage
            </h1>

            <p class="mt-6 max-w-lg text-base leading-relaxed text-slate-200 lg:text-lg">
              Sakina Connect centralise le suivi des pèlerins, les itinéraires, les annonces et
              l'assistance d'urgence géolocalisée, pour Omra comme pour Hajj.
            </p>

            <div class="mt-9 flex flex-col gap-3 sm:flex-row">
              <RouterLink
                to="/nous-rejoindre"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC7B3B] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:brightness-110"
              >
                Demander mon inscription
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </RouterLink>

              <a
                href="#connexion"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                J'ai déjà un compte
              </a>
            </div>

            <p class="mt-8 flex items-center gap-2 text-xs text-slate-400">
              <i class="fa-solid fa-shield-halved text-[#BC7B3B]"></i>
              L'inscription est examinée par l'administration avant toute création de compte.
            </p>
          </div>

          <!-- Droite : les 4 piliers, en cartes translucides -->
          <ul class="grid gap-4 sm:grid-cols-2">
            <li
              v-for="pilier in PILLIERS"
              :key="pilier.titre"
              class="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md transition hover:border-[#BC7B3B]/50 hover:bg-white/15"
            >
              <span
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#BC7B3B]/20 text-lg text-[#BC7B3B]"
              >
                <i class="fa-solid" :class="pilier.icone"></i>
              </span>
              <h2 class="mt-4 font-bold">{{ pilier.titre }}</h2>
              <p class="mt-1 text-sm leading-relaxed text-slate-300">{{ pilier.texte }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- ============ ZONE 3 : BODY — CONNEXION + FOOTER ============ -->
      <section id="connexion" class="scroll-mt-20 bg-[#F2F2DE] dark:bg-black">
        <div class="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h2 class="text-3xl font-black tracking-tight text-[#333D2A] dark:text-white">
              Déjà parmi nous ?
            </h2>
            <p class="mt-4 max-w-md leading-relaxed text-[#333D2A]/70 dark:text-slate-300">
              Connectez-vous pour retrouver votre groupe, votre itinéraire et les annonces qui vous
              concernent.
            </p>

            <ul class="mt-8 grid gap-3">
              <li class="flex items-start gap-3 text-sm text-[#333D2A]/80 dark:text-slate-300">
                <i class="fa-solid fa-circle-check mt-0.5 text-[#BC7B3B]"></i>
                Un espace par rôle : pèlerin, guide, proche ou administration.
              </li>
              <li class="flex items-start gap-3 text-sm text-[#333D2A]/80 dark:text-slate-300">
                <i class="fa-solid fa-circle-check mt-0.5 text-[#BC7B3B]"></i>
                Votre progression et vos documents de voyage au même endroit.
              </li>
              <li class="flex items-start gap-3 text-sm text-[#333D2A]/80 dark:text-slate-300">
                <i class="fa-solid fa-circle-check mt-0.5 text-[#BC7B3B]"></i>
                Alertes SOS reçues directement par les guides de votre groupe.
              </li>
            </ul>
          </div>

          <!-- Formulaire de connexion -->
          <div class="rounded-3xl bg-white p-7 shadow-xl shadow-[#333D2A]/5 dark:bg-slate-900 dark:shadow-black/40 sm:p-9">
            <h3 class="text-xl font-black text-[#333D2A] dark:text-white">Connexion</h3>
            <p class="mt-1 text-sm text-[#333D2A]/60 dark:text-slate-400">
              Accédez à votre espace personnel.
            </p>

            <div
              v-if="erreurMessage"
              class="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
              role="alert"
            >
              <i class="fa-solid fa-circle-exclamation mt-0.5"></i>
              <span>{{ erreurMessage }}</span>
            </div>

            <form class="mt-6 grid gap-4" novalidate @submit.prevent="seConnecter">
              <div>
                <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="accueilEmail">
                  Adresse email
                </label>
                <input
                  v-model="email"
                  type="email"
                  id="accueilEmail"
                  autocomplete="email"
                  placeholder="nom@exemple.com"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/25 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="accueilPassword">
                  Mot de passe
                </label>
                <div class="relative">
                  <input
                    v-model="motDePasse"
                    :type="motDePasseVisible ? 'text' : 'password'"
                    id="accueilPassword"
                    autocomplete="current-password"
                    placeholder="••••••••••••"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/25 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
              </div>

              <button
                type="submit"
                :disabled="chargement"
                class="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#333D2A] px-4 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  v-if="chargement"
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                ></span>
                {{ chargement ? 'Connexion...' : 'Connexion' }}
              </button>

              <p class="pt-1 text-center text-sm text-[#333D2A]/70 dark:text-slate-400">
                Pas encore de place ?
                <RouterLink to="/nous-rejoindre" class="font-bold text-[#BC7B3B] hover:underline">
                  Demandez votre inscription
                </RouterLink>
              </p>
            </form>
          </div>
        </div>

        <footer class="border-t border-[#333D2A]/10 py-8 text-center text-xs text-[#333D2A]/60 dark:border-white/10 dark:text-slate-400">
          Sakina Connect — gestion sereine et organisation de la logistique du pèlerinage.
        </footer>
      </section>
    </main>
  </div>
</template>
