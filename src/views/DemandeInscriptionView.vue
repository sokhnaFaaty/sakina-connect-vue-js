<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import DemandeInscriptionForm from '@/components/forms/DemandeInscriptionForm.vue';
import { useTheme } from '@/composables/useTheme.js';

const { isDark, toggleTheme } = useTheme();
const router = useRouter();

const envoye = ref(false);
</script>

<template>
  <div class="min-h-screen bg-[#F2F2DE] dark:bg-black">
    <header class="sticky top-0 z-40 border-b border-black/5 bg-[#F2F2DE]/90 backdrop-blur dark:border-white/10 dark:bg-black/90">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <RouterLink to="/" class="flex items-center gap-3">
          <i class="fa-solid fa-moon text-xl text-[#BC7B3B]"></i>
          <span class="text-lg font-black text-[#333D2A] dark:text-white">
            Sakina <span class="text-[#BC7B3B]">Connect</span>
          </span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <button
            @click="toggleTheme"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
          >
            <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
          </button>
          <RouterLink
            to="/login"
            class="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Connexion
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-5 py-12">
      <h1 class="text-2xl font-black text-[#333D2A] lg:text-3xl dark:text-white">
        Demande d'inscription
      </h1>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Remplissez ce formulaire pour demander une place. L'administration examine
        chaque demande et vous communiquera la suite.
      </p>

      <!-- Confirmation : on ne remplace pas le formulaire, on affiche l'état
           réel. Repasser par le formulaire donnerait l'illusion qu'un second
           envoi serait pris en compte, alors qu'il serait refusé en 409. -->
      <div
        v-if="envoye"
        class="mt-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950"
        role="status"
      >
        <div class="flex items-start gap-3">
          <i class="fa-solid fa-circle-check mt-1 text-xl text-emerald-600 dark:text-emerald-400"></i>
          <div>
            <h2 class="font-black text-emerald-900 dark:text-emerald-200">Demande envoyée</h2>
            <p class="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
              Elle est maintenant en attente d'examen. Vous recevrez un email dès
              qu'elle sera acceptée. Vous pourrez alors vous connecter avec le mot
              de passe que vous venez de choisir.
            </p>
            <button
              @click="envoye = false"
              class="mt-4 text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300"
            >
              Envoyer une autre demande
            </button>
          </div>
        </div>
      </div>

      <div v-else class="mt-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <DemandeInscriptionForm @envoye="envoye = true" />
      </div>
    </main>
  </div>
</template>
