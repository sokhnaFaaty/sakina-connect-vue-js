<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast.js'

const router = useRouter()
const auth = useAuthStore()
const { success } = useToast()

const dropdownOuvert = ref(false)
const dropdownRef = ref(null)

function toggleDropdown() { dropdownOuvert.value = !dropdownOuvert.value }

function logout() {
  auth.logout()
  router.replace('/login')
  success('Déconnexion réussie.')
}

onMounted(() => document.addEventListener('click', (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) dropdownOuvert.value = false
}))
</script>

<template>
  <header class="flex h-16 shrink-0 items-center justify-between bg-[#333D2A] px-4">
    <div class="flex items-center gap-3">
      <i class="fa-solid fa-moon text-[#BC7B3B]"></i>
      <span class="font-display text-base font-black text-white">Sakina Connect</span>
    </div>

    <div class="flex items-center gap-2 sm:gap-4">
      <button class="relative flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10" aria-label="Notifications">
        <i class="fa-solid fa-bell"></i>
        <span class="absolute right-1 top-1 min-w-[18px] rounded-full bg-[#B40909] px-1 text-center text-[10px] font-black leading-[18px] text-white">0</span>
      </button>

      <div ref="dropdownRef" class="relative">
        <button @click="toggleDropdown" class="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white/10">
          <div class="hidden text-right sm:block">
            <p class="text-sm font-bold text-white">{{ auth.user?.nomComplet }}</p>
            <span class="text-xs text-slate-300">{{ auth.role }}</span>
          </div>
          <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-sm font-bold text-white">
            {{ auth.user?.nomComplet?.charAt(0) }}
          </div>
        </button>

        <div v-if="dropdownOuvert" class="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-white py-1 shadow-lg">
          <div class="border-b px-4 py-3">
            <p class="text-sm font-semibold">{{ auth.user?.nomComplet }}</p>
            <p class="truncate text-xs text-slate-500">{{ auth.user?.email }}</p>
          </div>
          <button @click="logout" class="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
            <i class="fa-solid fa-right-from-bracket w-4 text-center"></i> Déconnexion
          </button>
        </div>
      </div>
    </div>
  </header>
</template>