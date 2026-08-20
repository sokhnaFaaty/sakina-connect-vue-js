<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { getNotifications, countUnseen, markSeen } from '@/services/notificationService.js';
import { useToast } from '@/composables/useToast.js';

const emit = defineEmits(['toggle-sidebar']);

const router = useRouter();
const auth = useAuthStore();
const { success } = useToast();

// État du menu déroulant "Profil"
const dropdownOuvert = ref(false);
const dropdownRef = ref(null);

// État du panneau "Notifications"
const notifOuvert = ref(false);
const notifRef = ref(null);
const notifications = ref([]);
const badgeNb = ref(0);

const roleLabel = computed(() => auth.role);
const userInitial = computed(() => auth.user?.nomComplet?.charAt(0) || '?');

// Charger les notifications au montage
async function chargerNotifications() {
  if (!auth.user || !auth.role) return;
  try {
    const items = await getNotifications(auth.user, auth.role);
    notifications.value = items;
    badgeNb.value = countUnseen(items, auth.user.id);
  } catch {
    notifications.value = [];
  }
}
onMounted(chargerNotifications);

// Logique de fermeture au clic extérieur pour le menu et les notifs
function fermerTout(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    dropdownOuvert.value = false;
  }
  if (notifRef.value && !notifRef.value.contains(event.target)) {
    notifOuvert.value = false;
  }
}
onMounted(() => document.addEventListener('click', fermerTout));
onUnmounted(() => document.removeEventListener('click', fermerTout));

function toggleDropdown() { dropdownOuvert.value = !dropdownOuvert.value; }
function toggleNotif() { 
  if (!notifOuvert.value) {
    markSeen(auth.user.id);
    badgeNb.value = 0;
  }
  notifOuvert.value = !notifOuvert.value; 
}

async function logout() {
  dropdownOuvert.value = false;
  auth.logout();
  await router.replace('/login');
  success('Déconnexion réussie.');
}
</script>

<template>
  <header class="flex h-16 shrink-0 items-center justify-between bg-[#333D2A] px-4">
    
    <!-- Zone gauche : Bouton burger + Logo -->
    <div class="flex items-center gap-3">
      <button 
        id="sidebarToggle" 
        class="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 lg:hidden" 
        @click="$emit('toggle-sidebar')"
        aria-label="Ouvrir le menu"
      >
        <i class="fa-solid fa-bars"></i>
      </button>
      <i class="fa-solid fa-moon text-[#BC7B3B]"></i>
      <span class="font-display text-base font-black text-white">Sakina Connect</span>
    </div>

    <!-- Zone droite : Notifications + Menu profil -->
    <div class="flex items-center gap-2 sm:gap-4">
      
      <!-- Cloche de notifications -->
      <button 
        ref="notifRef"
        id="notifBtn" 
        @click="toggleNotif"
        class="relative flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10" 
        aria-label="Notifications"
      >
        <i class="fa-solid fa-bell"></i>
        <span 
          v-if="badgeNb > 0" 
          class="absolute right-1 top-1 min-w-[18px] rounded-full bg-[#B40909] px-1 text-center text-[10px] font-black leading-[18px] text-white"
        >
          {{ badgeNb > 9 ? '9+' : badgeNb }}
        </span>
      </button>

      <!-- Panneau de notifications (déroulant) -->
      <Teleport to="body">
        <div 
          v-if="notifOuvert"
          ref="notifRef"
          class="fixed right-3 top-16 z-[90] w-80 max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div class="flex items-center justify-between bg-[#333D2A] px-4 py-3 text-white">
            <span class="font-black">Notifications</span>
            <span class="text-xs text-slate-300">{{ notifications.length }}</span>
          </div>
          <div class="max-h-96 overflow-y-auto">
            <button 
              v-for="n in notifications" 
              :key="n.id"
              @click="router.push(n.page); notifOuvert = false"
              class="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 last:border-0"
            >
              <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="n.type === 'sos' ? 'bg-rose-100 text-rose-600' : 'bg-[#F2F2DE] text-[#333D2A]'">
                <i class="fa-solid" :class="n.icon"></i>
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="truncate font-bold text-slate-800">{{ n.titre }}</span>
                  <span v-if="n.urgent" class="shrink-0 rounded-full bg-rose-100 px-1.5 text-[9px] font-black text-rose-700">URGENT</span>
                </span>
                <span class="mt-0.5 block truncate text-xs text-slate-500">{{ n.sous }}</span>
              </span>
            </button>
            <p v-if="notifications.length === 0" class="p-6 text-center text-sm text-slate-400">Aucune notification.</p>
          </div>
        </div>
      </Teleport>

      <!-- Menu Utilisateur (Avatar) -->
      <div ref="dropdownRef" class="relative">
        <button 
          type="button" 
          @click="toggleDropdown" 
          class="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white/10" 
          aria-haspopup="menu"
        >
          <div class="hidden text-right sm:block">
            <p class="text-sm font-bold text-white">{{ auth.user?.nomComplet || '' }}</p>
            <span class="text-xs text-slate-300">{{ roleLabel }}</span>
          </div>
          <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-sm font-bold text-white">
            <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" class="h-full w-full object-cover" />
            <span v-else>{{ userInitial }}</span>
          </div>
          <i class="fa-solid fa-chevron-down text-xs text-slate-300 transition-transform" :class="{ 'rotate-180': dropdownOuvert }"></i>
        </button>

        <!-- Panneau Menu déroulant -->
        <div 
          v-if="dropdownOuvert"
          class="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-white py-1 shadow-lg"
          role="menu"
        >
          <div class="border-b px-4 py-3">
            <p class="text-sm font-semibold text-slate-800">{{ auth.user?.nomComplet || 'Utilisateur' }}</p>
            <p class="truncate text-xs text-slate-500">{{ auth.user?.email || '-' }}</p>
          </div>
          <button 
            @click="logout" 
            class="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
          >
            <i class="fa-solid fa-right-from-bracket w-4 text-center"></i>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  </header>
</template>