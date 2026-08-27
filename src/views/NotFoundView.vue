<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { HOME_PAGE_BY_ROLE } from '@/config/roles.js';

const router = useRouter();
const auth = useAuthStore();

function allerALaPageAssociee() {
  const page = HOME_PAGE_BY_ROLE[auth.role];
  router.push(page ? { name: page } : { name: 'login' });
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-[#F2F2DE] p-6 text-center"
  >
    <div class="flex items-center gap-3">
      <i class="fa-solid fa-moon text-2xl text-[#BC7B3B]"></i>
      <span class="text-2xl font-black text-[#333D2A]"
        >Sakina <span class="text-[#BC7B3B]">Connect</span></span
      >
    </div>

    <p class="mt-10 text-8xl font-black text-[#BC7B3B]">404</p>
    <h1 class="mt-4 text-2xl font-black text-[#333D2A]">Page introuvable</h1>
    <p class="mt-2 max-w-md text-sm text-slate-500">
      Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
    </p>

    <button
      @click="allerALaPageAssociee"
      class="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#333D2A] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
    >
      <i class="fa-solid fa-house"></i>
      Retour à mon espace
    </button>
  </div>
</template>
