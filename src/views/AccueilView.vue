<script setup>
import { useTheme } from '@/composables/useTheme.js';

import coverImage from '@/assets/CouvertureLogin.jpg';

const { isDark, toggleTheme } = useTheme();

/**
 * La direction artistique utilise les trois couleurs de la marque comme trois
 * MATIÈRES, pas comme des accents : crème pour le hero, vert foncé pleine
 * largeur pour le bandeau, marron pour l'action principale. Un aplat vert
 * foncé structure la page et la rend méconnaissable d'un gabarit générique.
 */

const PILIERS = [
  { icone: 'fa-users', titre: 'Suivi des pèlerins', texte: 'Chaque pèlerin, chaque guide, chaque groupe.' },
  { icone: 'fa-route', titre: 'Itinéraires et rituels', texte: 'Les étapes du voyage, partagées avec tous.' },
  { icone: 'fa-triangle-exclamation', titre: 'Assistance SOS', texte: 'Alerte géolocalisée transmise aux guides.' },
  { icone: 'fa-hand-holding-heart', titre: 'Portail famille', texte: 'Les proches suivent le parcours à distance.' },
];

const ETAPES = [
  {
    numero: '01',
    titre: 'Vous déposez votre demande',
    texte: 'Le formulaire enregistre une demande. Aucun compte n’est créé.',
  },
  {
    numero: '02',
    titre: 'L’administration l’examine',
    texte: 'Elle vérifie votre dossier et vous attribue un groupe.',
  },
  {
    numero: '03',
    titre: 'Vous recevez vos accès',
    texte: 'Vous vous connectez avec le mot de passe choisi à l’étape 01.',
  },
];
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#F2F2DE] dark:bg-black">
    <!-- ============ HEADER ============ -->
    <header
      class="sticky top-0 z-40 border-b border-[#333D2A]/10 bg-[#F2F2DE]/90 backdrop-blur-md dark:border-white/10 dark:bg-black/90"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <RouterLink to="/" class="flex items-center gap-3">
          <i class="fa-solid fa-moon text-2xl text-[#BC7B3B]"></i>
          <span class="text-xl font-black tracking-tight text-[#333D2A] dark:text-white">
            Sakina <span class="text-[#BC7B3B]">Connect</span>
          </span>
        </RouterLink>

        <div class="flex items-center gap-2 sm:gap-4">
          <button
            @click="toggleTheme"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-[#333D2A]/15 text-[#333D2A] transition hover:bg-white dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
          >
            <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
          </button>

          <RouterLink
            to="/login"
            class="hidden text-sm font-bold text-[#333D2A] transition hover:text-[#BC7B3B] sm:block dark:text-white"
          >
            Se connecter
          </RouterLink>

          <RouterLink
            to="/nous-rejoindre"
            class="rounded-full bg-[#BC7B3B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#333D2A]"
          >
            Nous rejoindre
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <!-- ============ HÉRO : asymétrique, sans photo de fond ============ -->
      <section class="mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div class="lg:col-span-7">
          <p class="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#BC7B3B]">
            <span class="h-px w-10 bg-[#BC7B3B]"></span>
            Omra &amp; Hajj
          </p>

          <h1
            class="mt-7 text-5xl font-black leading-[0.95] tracking-[-0.03em] text-[#333D2A] lg:text-7xl dark:text-white"
          >
            La sérénité<br />
            au cœur de<br />
            votre <span class="text-[#BC7B3B]">pèlerinage</span>
          </h1>

          <p class="mt-8 max-w-lg text-lg leading-relaxed text-[#333D2A]/70 dark:text-slate-300">
            Sakina Connect centralise le suivi des pèlerins, les itinéraires, les annonces et
            l'assistance d'urgence géolocalisée, pour Omra comme pour Hajj.
          </p>

          <div class="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <RouterLink
              to="/nous-rejoindre"
              class="group inline-flex items-center gap-3 rounded-full bg-[#BC7B3B] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#333D2A]"
            >
              Demander mon inscription
              <i
                class="fa-solid fa-arrow-right text-xs transition group-hover:translate-x-1"
              ></i>
            </RouterLink>

            <RouterLink
              to="/login"
              class="group inline-flex items-center gap-2 border-b-2 border-[#333D2A]/20 pb-1 text-sm font-bold text-[#333D2A] transition hover:border-[#BC7B3B] hover:text-[#BC7B3B] dark:text-white dark:border-white/20"
            >
              J'ai déjà un compte
            </RouterLink>
          </div>

          <p class="mt-12 flex items-center gap-2.5 text-xs text-[#333D2A]/50 dark:text-slate-400">
            <i class="fa-solid fa-shield-halved text-[#BC7B3B]"></i>
            L'inscription est examinée par l'administration avant toute création de compte.
          </p>
        </div>

        <!-- L'image en cadre, pas en fond voilé -->
        <div class="relative lg:col-span-5">
          <img
            :src="coverImage"
            alt="Pèlerins devant la Kaaba"
            class="h-full min-h-[22rem] w-full rounded-[1.75rem] object-cover shadow-2xl shadow-[#333D2A]/15 dark:shadow-black/60"
          />
          <div
            class="absolute -bottom-5 left-6 rounded-xl bg-[#333D2A] px-5 py-4 text-white shadow-xl dark:bg-[#BC7B3B] dark:text-[#333D2A]"
          >
            <p class="text-2xl font-black leading-none">4</p>
            <p class="mt-1 text-xs opacity-80">espaces dédiés</p>
          </div>
        </div>
      </section>

      <!-- ============ BANDEAU VERT : les 4 piliers, en colonnes ============ -->
      <section class="bg-[#333D2A] text-white dark:bg-[#0a0a0a]">
        <div class="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="(pilier, index) in PILIERS"
              :key="pilier.titre"
              class="lg:border-l lg:border-white/15 lg:pl-6"
              :class="index === 0 ? 'lg:border-l-0 lg:pl-0' : ''"
            >
              <i class="fa-solid text-lg text-[#BC7B3B]" :class="pilier.icone"></i>
              <h2 class="mt-4 font-bold leading-tight">{{ pilier.titre }}</h2>
              <p class="mt-2 text-sm leading-relaxed text-white/60">{{ pilier.texte }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ LA PROCÉDURE, en trois temps ============ -->
      <section class="bg-[#F2F2DE] dark:bg-black">
        <div class="mx-auto max-w-6xl px-5 py-20 lg:py-24">
          <div class="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-[#BC7B3B]">Comment ça marche</p>
              <h2
                class="mt-4 max-w-md text-3xl font-black leading-tight tracking-tight text-[#333D2A] lg:text-4xl dark:text-white"
              >
                De la demande à l’accès, en trois temps
              </h2>
            </div>
            <RouterLink
              to="/nous-rejoindre"
              class="text-sm font-bold text-[#BC7B3B] underline underline-offset-4 hover:text-[#333D2A] dark:hover:text-white"
            >
              Commencer ma demande
            </RouterLink>
          </div>

          <ol class="mt-14 grid gap-10 md:grid-cols-3">
            <li v-for="etape in ETAPES" :key="etape.numero" class="relative">
              <span class="block text-5xl font-black leading-none text-[#BC7B3B]/25 dark:text-[#BC7B3B]/30">
                {{ etape.numero }}
              </span>
              <h3
                class="mt-4 text-lg font-black leading-snug text-[#333D2A] dark:text-white"
              >
                {{ etape.titre }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-[#333D2A]/65 dark:text-slate-400">
                {{ etape.texte }}
              </p>
            </li>
          </ol>
        </div>
      </section>
    </main>

    <!-- ============ FOOTER ============ -->
    <footer class="border-t border-white/10 bg-[#333D2A] text-white dark:bg-[#0a0a0a]">
      <div class="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-moon text-xl text-[#BC7B3B]"></i>
          <span class="font-black">Sakina <span class="text-[#BC7B3B]">Connect</span></span>
        </div>
        <p class="text-xs text-white/50">
          Gestion sereine et organisation de la logistique du pèlerinage.
        </p>
      </div>
    </footer>
  </div>
</template>
