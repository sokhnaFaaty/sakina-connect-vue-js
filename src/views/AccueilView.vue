<script setup>
import { useTheme } from '@/composables/useTheme.js';

import coverImage from '@/assets/CouvertureLogin.jpg';

const { isDark, toggleTheme } = useTheme();

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
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#F2F2DE] dark:bg-black">
    <!-- ============ ZONE 1 : HEADER ============ -->
    <header
      class="sticky top-0 z-40 border-b border-[#333D2A]/10 bg-[#F2F2DE]/85 backdrop-blur-md dark:border-white/10 dark:bg-black/85"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <RouterLink to="/" class="flex items-center gap-3">
          <i class="fa-solid fa-moon text-2xl text-[#BC7B3B]"></i>
          <span class="text-xl font-black tracking-tight text-[#333D2A] dark:text-white">
            Sakina <span class="text-[#BC7B3B]">Connect</span>
          </span>
        </RouterLink>

        <!-- Double entrée : connexion d'un côté, inscription de l'autre. -->
        <div class="flex items-center gap-2 sm:gap-3">
          <button
            @click="toggleTheme"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-[#333D2A]/15 text-[#333D2A] transition hover:bg-white dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
          >
            <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
          </button>

          <RouterLink
            to="/login"
            class="rounded-xl px-3 py-3 text-sm font-bold text-[#333D2A] transition hover:bg-[#333D2A]/5 dark:text-white dark:hover:bg-white/10 sm:px-4"
          >
            Se connecter
          </RouterLink>

          <RouterLink
            to="/nous-rejoindre"
            class="rounded-xl bg-[#BC7B3B] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#BC7B3B]/25 transition hover:brightness-110 sm:px-5"
          >
            Nous rejoindre
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="flex-1">
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

              <RouterLink
                to="/login"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                J'ai déjà un compte
              </RouterLink>
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
    </main>

    <!-- ============ ZONE 3 : FOOTER ============ -->
    <footer
      class="border-t border-[#333D2A]/10 py-8 text-center text-xs text-[#333D2A]/60 dark:border-white/10 dark:text-slate-400"
    >
      Sakina Connect — gestion sereine et organisation de la logistique du pèlerinage.
    </footer>
  </div>
</template>
