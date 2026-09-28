<script setup>
import { ref } from 'vue';
import DemandeInscriptionForm from '@/components/forms/DemandeInscriptionForm.vue';
import { useTheme } from '@/composables/useTheme.js';

import coverImage from '@/assets/CouvertureLogin.jpg';

const { isDark, toggleTheme } = useTheme();

const envoye = ref(false);

const stylePanneau = {
  backgroundImage: `linear-gradient(rgba(35,42,27,.88), rgba(35,42,27,.96)), url(${coverImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

const ETAPES = [
  {
    numero: '1',
    titre: 'Vous déposez votre demande',
    texte: 'Le formulaire ci-contre ne crée aucun compte : il enregistre une demande.',
  },
  {
    numero: '2',
    titre: "L'administration l'examine",
    texte: 'Elle vérifie votre dossier et vous attribue un groupe.',
  },
  {
    numero: '3',
    titre: 'Vous recevez vos accès',
    texte: 'Vous vous connectez avec le mot de passe choisi ici.',
  },
];
</script>

<template>
  <!-- Sur mobile la page défile normalement : un formulaire long n'a pas à être
       enfermé dans la fenêtre. À partir de lg, on verrouille la hauteur sur
       l'écran et chaque colonne défile de son côté, sinon le contenu de gauche
       (titre + 3 étapes) repousse le formulaire hors de la fenêtre. -->
  <div
    class="flex min-h-screen flex-col lg:h-screen lg:grid lg:grid-cols-2 lg:overflow-hidden"
  >
    <!-- Bascule sombre / clair -->
    <button
      @click="toggleTheme"
      class="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur transition hover:bg-white/20"
      :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
    >
      <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
    </button>

    <!-- Panneau de présentation -->
    <aside
      class="relative flex flex-col justify-center p-8 text-white lg:overflow-y-auto lg:p-14"
      :style="stylePanneau"
    >
      <RouterLink to="/" class="flex items-center gap-3">
        <i class="fa-solid fa-moon text-2xl text-[#BC7B3B]"></i>
        <span class="text-2xl font-black">Sakina <span class="text-[#BC7B3B]">Connect</span></span>
      </RouterLink>

      <h1 class="mt-10 text-3xl font-black leading-tight lg:text-4xl">
        Demandez votre place
      </h1>
      <p class="mt-4 max-w-md leading-relaxed text-slate-200">
        Remplissez le formulaire, l'administration examine votre dossier et vous
        communique la suite. Vous'avez déjà un compte ?
        <RouterLink to="/login" class="font-bold text-[#BC7B3B] underline underline-offset-4">
          Se connecter
        </RouterLink>
      </p>

      <ol class="mt-10 grid max-w-md gap-4">
        <li v-for="etape in ETAPES" :key="etape.numero" class="flex items-start gap-3">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#BC7B3B] text-sm font-black text-white"
          >
            {{ etape.numero }}
          </span>
          <span>
            <span class="block text-sm font-bold">{{ etape.titre }}</span>
            <span class="block text-sm text-slate-300">{{ etape.texte }}</span>
          </span>
        </li>
      </ol>
    </aside>

    <!-- Formulaire -->
    <main
      class="flex items-center justify-center bg-[#F2F2DE] p-6 sm:p-10 lg:overflow-y-auto lg:p-14 dark:bg-black"
    >
      <div class="w-full max-w-lg">
        <!-- Confirmation : on affiche l'état réel plutôt que de rendre le
             formulaire. Le laisser visible laisserait croire qu'un second envoi
             serait pris en compte, alors qu'il serait refusé en 409. -->
        <div
          v-if="envoye"
          class="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl shadow-[#333D2A]/5 dark:border-emerald-900 dark:bg-slate-900"
          role="status"
        >
          <span
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          >
            <i class="fa-solid fa-check"></i>
          </span>
          <h2 class="mt-6 text-xl font-black text-[#333D2A] dark:text-white">Demande envoyée</h2>
          <p class="mt-3 text-sm leading-relaxed text-[#333D2A]/70 dark:text-slate-300">
            Elle est en attente d'examen. Vous recevrez un email dès qu'elle sera
            acceptée. Vous pourrez alors vous connecter avec le mot de passe que
            vous venez de choisir.
          </p>
          <button
            @click="envoye = false"
            class="mt-6 text-sm font-bold text-[#BC7B3B] underline underline-offset-4"
          >
            Envoyer une autre demande
          </button>
        </div>

        <template v-else>
          <h2 class="text-2xl font-black text-[#333D2A] dark:text-white">Votre dossier</h2>
          <p class="mt-1 text-sm text-[#333D2A]/60 dark:text-slate-400">
            Tous les champs sont obligatoires.
          </p>

          <div class="mt-6">
            <DemandeInscriptionForm @envoye="envoye = true" />
          </div>
        </template>
      </div>
    </main>
  </div>
</template>
