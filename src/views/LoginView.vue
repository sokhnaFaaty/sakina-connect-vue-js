<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { HOME_PAGE_BY_ROLE } from '@/config/roles.js';
import { useTheme } from '@/composables/useTheme.js';
import { validateLoginEmail, validateLoginPassword } from '@/utils/validators.js';

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
  'Un espace par rôle : pèlerin, guide, proche ou administration.',
  'Votre progression et vos documents de voyage au même endroit.',
  'Alertes SOS reçues directement par les guides de votre groupe.',
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
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#F2F2DE] dark:bg-black">
    <!-- ============ HEADER ============ -->
    <header
      class="border-b border-[#333D2A]/10 bg-[#F2F2DE]/85 backdrop-blur-md dark:border-white/10 dark:bg-black/85"
    >
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

    <main class="flex flex-1 items-center">
      <div class="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <!-- ============ GAUCHE : texte ============ -->
        <div>
          <h1 class="text-3xl font-black leading-tight tracking-tight text-[#333D2A] lg:text-4xl dark:text-white">
            La sérénité au cœur de votre pèlerinage
          </h1>
          <p class="mt-5 max-w-md leading-relaxed text-[#333D2A]/70 dark:text-slate-300">
            Sakina Connect centralise le suivi des pèlerins, les itinéraires, les annonces et
            l'assistance d'urgence géolocalisée, pour Omra comme pour Hajj.
          </p>

          <ul class="mt-9 grid gap-4">
            <li
              v-for="avantage in AVANTAGES"
              :key="avantage"
              class="flex items-start gap-3 text-[#333D2A]/80 dark:text-slate-300"
            >
              <span
                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#BC7B3B]/15 text-[#BC7B3B]"
              >
                <i class="fa-solid fa-check text-[10px]"></i>
              </span>
              <span class="text-sm leading-relaxed">{{ avantage }}</span>
            </li>
          </ul>

          <p class="mt-10 border-t border-[#333D2A]/10 pt-6 text-sm text-[#333D2A]/70 dark:border-white/10 dark:text-slate-400">
            Pas encore de place ?
            <RouterLink to="/nous-rejoindre" class="font-bold text-[#BC7B3B] hover:underline">
              Demandez votre inscription
            </RouterLink>
          </p>
        </div>

        <!-- ============ DROITE : formulaire ============ -->
        <div class="rounded-[2rem] bg-white p-7 shadow-xl shadow-[#333D2A]/5 sm:p-9 dark:bg-slate-900 dark:shadow-black/40">
          <h2 class="text-2xl font-black text-[#333D2A] dark:text-white">Connexion</h2>
          <p class="mt-1 text-sm text-[#333D2A]/60 dark:text-slate-400">
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

          <form class="mt-6 grid gap-5" novalidate @submit.prevent="seConnecter">
            <div>
              <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="loginEmail">
                Adresse email
              </label>
              <input
                v-model="email"
                type="email"
                id="loginEmail"
                autocomplete="email"
                placeholder="nom@exemple.com"
                class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition dark:bg-slate-800 dark:text-slate-100"
                :class="
                  erreurEmail
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/25 dark:border-slate-600'
                "
              />
              <p v-if="erreurEmail" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{{ erreurEmail }}</p>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-bold text-[#333D2A] dark:text-slate-300" for="loginPassword">
                Mot de passe
              </label>
              <div class="relative">
                <input
                  v-model="motDePasse"
                  :type="motDePasseVisible ? 'text' : 'password'"
                  id="loginPassword"
                  autocomplete="current-password"
                  placeholder="••••••••••••"
                  class="w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm outline-none transition dark:bg-slate-800 dark:text-slate-100"
                  :class="
                    erreurMotDePasse
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-100'
                      : 'border-slate-300 focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/25 dark:border-slate-600'
                  "
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
              <p v-if="erreurMotDePasse" class="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                {{ erreurMotDePasse }}
              </p>
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
          </form>
        </div>
      </div>
    </main>
  </div>
</template>
