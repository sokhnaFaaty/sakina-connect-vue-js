<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { HOME_PAGE_BY_ROLE } from '@/config/roles.js';

const router = useRouter();
const auth = useAuthStore();

const fuyant = ref(false);

function allerALaPageAssociee() {
  const page = HOME_PAGE_BY_ROLE[auth.role];
  fuyant.value = true;
  setTimeout(() => router.push(page ? { name: page } : { name: 'login' }), 350);
}

const positionsEtapes = [
  { icone: 'fa-solid fa-kaaba', top: '8%', left: '10%', duree: 9 },
  { icone: 'fa-solid fa-mosque', top: '18%', right: '12%', duree: 11 },
  { icone: 'fa-solid fa-compass', bottom: '20%', left: '14%', duree: 10 },
  { icone: 'fa-solid fa-moon', bottom: '16%', right: '16%', duree: 12 },
  { icone: 'fa-solid fa-star-and-crescent', top: '48%', left: '4%', duree: 13 },
];

const etoiles = ref([]);
onMounted(() => {
  etoiles.value = Array.from({ length: 26 }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    taille: Math.random() * 3 + 1,
    duree: Math.random() * 3 + 2,
    delai: Math.random() * 3,
  }));
});
onBeforeUnmount(() => (etoiles.value = []));
</script>

<template>
  <div
    class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#333D2A] p-6 text-center"
    :class="{ 'scale-95 opacity-0': fuyant }"
    style="transition: transform 0.35s ease, opacity 0.35s ease"
  >
    <!-- Dégradé animé -->
    <div class="pointer-events-none absolute inset-0 animate-halo">
      <span class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#BC7B3B]/25 blur-3xl"></span>
      <span class="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#225BBF]/25 blur-3xl"></span>
    </div>

    <!-- Étoiles scintillantes -->
    <span
      v-for="(etoile, i) in etoiles"
      :key="i"
      class="pointer-events-none absolute rounded-full bg-white animate-twinkle"
      :style="{
        left: etoile.left + '%',
        top: etoile.top + '%',
        width: etoile.taille + 'px',
        height: etoile.taille + 'px',
        animationDuration: etoile.duree + 's',
        animationDelay: etoile.delai + 's',
      }"
    ></span>

    <!-- Icônes flottantes -->
    <span
      v-for="(s, i) in positionsEtapes"
      :key="i"
      class="pointer-events-none absolute select-none opacity-60"
      :style="{ top: s.top, left: s.left, right: s.right, bottom: s.bottom }"
    >
      <i class="block text-3xl animate-float" :class="s.icone" :style="{ animationDuration: s.duree + 's' }"></i>
    </span>

    <!-- Contenu -->
    <div class="relative z-10 flex flex-col items-center animate-rise">
      <div class="flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#BC7B3B] text-xl">
          <i class="fa-solid fa-moon"></i>
        </span>
        <span class="text-2xl font-black text-white"
          >Sakina <span class="text-[#BC7B3B]">Connect</span></span
        >
      </div>

      <div class="relative mt-10 flex items-end">
        <span class="animate-bounce-number text-[7rem] font-black leading-none text-[#BC7B3B] sm:text-[9rem]">4</span>
        <span class="mx-2 animate-spin-slower mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#BC7B3B]/30 bg-white/5 text-3xl backdrop-blur sm:h-24 sm:w-24">
          <i class="fa-solid fa-compass text-[#BC7B3B]"></i>
        </span>
        <span class="animate-bounce-number text-[7rem] font-black leading-none text-[#BC7B3B] sm:text-[9rem]">4</span>
      </div>

      <h1 class="mt-6 text-2xl font-black text-white sm:text-3xl">Page introuvable</h1>
      <p class="mt-3 max-w-md text-sm text-slate-300 sm:text-base">
        Oups ! Il semble que vous vous soyez égaré hors du chemin du pèlerinage.
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>

      <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <button
          @click="allerALaPageAssociee"
          class="inline-flex items-center gap-2 rounded-full bg-[#BC7B3B] px-7 py-3 text-sm font-black text-white shadow-lg shadow-[#BC7B3B]/30 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
        >
          <i class="fa-solid fa-rotate-left"></i>
          Retour à mon espace
        </button>
        <button
          @click="router.back()"
          class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10 active:scale-95"
        >
          <i class="fa-solid fa-arrow-left"></i>
          Revenir en arrière
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-rise {
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes bounce-number {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}
.animate-bounce-number {
  animation: bounce-number 2.6s ease-in-out infinite;
}

@keyframes spin-slower {
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slower {
  animation: spin-slower 12s linear infinite;
}

@keyframes halo {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.08);
  }
}
.animate-halo {
  animation: halo 6s ease-in-out infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.9;
  }
}
.animate-twinkle {
  animation: twinkle 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-18px);
  }
}
.animate-float {
  animation: float 8s ease-in-out infinite;
}
</style>
