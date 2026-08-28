<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

// Icônes SVG en trait fin (style Lucide) pour le menu "Centre de contrôle"
const ICONES_SVG = {
  dashboard:
    '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  megaphone:
    '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
};

const NAV_LINKS_BY_ROLE = {
  ADMIN: [
    { page: 'dashboard-admin', label: 'Accueil', icon: 'fa-gauge', svg: 'dashboard' },
    { page: 'annuaire-guides', label: 'Guides', icon: 'fa-user-tie', svg: 'users' },
    { page: 'groupes', label: 'Groupes', icon: 'fa-people-group', svg: 'users' },
    { page: 'pelerins', label: 'Pèlerins', icon: 'fa-users', svg: 'users' },
    { page: 'itineraire', label: 'Itinéraire', icon: 'fa-route', svg: 'route' },
    { page: 'annonces', label: 'Annonces', icon: 'fa-bullhorn', svg: 'megaphone' },
  ],
  GUIDE: [
    { page: 'dashboard-guide', label: 'Accueil', icon: 'fa-gauge', svg: 'dashboard' },
    { page: 'mon-groupe', label: 'Groupe', icon: 'fa-users', svg: 'users' },
    { page: 'itineraire', label: 'Itinéraire', icon: 'fa-route', svg: 'route' },
    { page: 'annonces', label: 'Annonces', icon: 'fa-bullhorn', svg: 'megaphone' },
  ],
  PELERIN: [
    { page: 'dashboard-pelerin', label: 'Tableau de Bord', icon: 'fa-gauge', svg: 'dashboard' },
    { page: 'mon-profil', label: 'Profil', icon: 'fa-user', svg: 'user' },
    { page: 'mon-groupe-pelerin', label: 'Groupe', icon: 'fa-users', svg: 'users' },
    { page: 'itineraire', label: 'Itinéraire', icon: 'fa-route', svg: 'route' },
    { page: 'annonces', label: 'Annonces', icon: 'fa-bullhorn', svg: 'megaphone' },
  ],
  PROCHE: [
    { page: 'dashboard-proche', label: 'Tableau de Bord', icon: 'fa-gauge', svg: 'dashboard' },
    { page: 'suivi-familial', label: 'Suivi', icon: 'fa-heart', svg: 'heart' },
    { page: 'mon-profil-proche', label: 'Profil', icon: 'fa-user', svg: 'user' },
  ],
};

// Positions "Assistive Touch" : (colonne / ligne) sur une grille de 3 colonnes
//   1 en haut au centre, 2 au milieu (gauche/droite), 2 en bas (gauche/droite), 1 en bas au centre
const POSITIONS_ASSISTIVE = [
  [2, 1],
  [1, 2],
  [3, 2],
  [1, 3],
  [3, 3],
  [2, 3],
];

const POLE_URGENCE_BY_ROLE = {
  ADMIN: 'pole-urgence',
  GUIDE: 'mon-pole-urgence',
  PELERIN: 'pole-urgence-pelerin',
};

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const role = computed(() => auth.role);
const estStaff = computed(() => role.value === 'ADMIN' || role.value === 'GUIDE');
const liens = computed(() => NAV_LINKS_BY_ROLE[role.value] || []);

// ADMIN/GUIDE : la barre affiche SOS + 2 raccourcis + le bouton central ;
// le reste des pages s'ouvre dans le menu du "Centre de contrôle".
const raccourcis = computed(() => liens.value.filter((l) => !l.page.startsWith('dashboard')).slice(0, 2));
const menuOuvert = ref(false);

const iconesMenus = computed(() =>
  liens.value.map((lien, index) => {
    const pos = POSITIONS_ASSISTIVE[index] || POSITIONS_ASSISTIVE[0];
    return {
      ...lien,
      style: { gridColumn: pos[0], gridRow: pos[1] },
    };
  })
);

function naviguer(page) {
  menuOuvert.value = false;
  if (page) router.push('/' + page);
}

function sos() {
  naviguer(POLE_URGENCE_BY_ROLE[role.value]);
}

function estActif(page) {
  return route.path.startsWith('/' + page);
}
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden" aria-label="Navigation mobile">
    <!-- Centre de contrôle : style menu "Assistive Touch" iOS -->
    <transition name="assistive">
      <div
        v-if="menuOuvert && estStaff"
        class="fixed inset-0 z-50 flex items-center justify-center p-6"
        @click.self="menuOuvert = false"
      >
        <div class="assistive-menu relative w-full max-w-xs rounded-[24px] px-6 py-8">
          <div class="grid grid-cols-3 gap-x-2 gap-y-6" style="grid-template-rows: repeat(3, auto)">
            <button
              v-for="lien in iconesMenus"
              :key="lien.page"
              :style="lien.style"
              @click="naviguer(lien.page)"
              class="assistive-item group flex min-w-0 flex-col items-center justify-center gap-2 px-1"
              :class="{ active: estActif(lien.page) }"
              aria-label="Accéder à {{ lien.label }}"
            >
              <span class="assistive-icon">
                <svg
                  width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  v-html="ICONES_SVG[lien.svg]"
                ></svg>
              </span>
              <span class="assistive-label">{{ lien.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <div class="flex items-end justify-around px-2 pb-2 pt-1">
      <!-- SOS (rouge), sauf pour PROCHE -->
      <button
        v-if="role !== 'PROCHE'"
        @click="sos"
        class="flex flex-col items-center gap-0.5 px-2"
        aria-label="Urgence SOS"
      >
        <span class="flex h-11 w-11 items-center justify-center rounded-full bg-[#B40909] text-white shadow-lg shadow-[#B40909]/30 transition hover:opacity-90">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </span>
        <span class="text-[10px] font-bold text-[#B40909]">SOS</span>
      </button>

      <!-- Raccourci direct avant le bouton central -->
      <template v-if="estStaff">
        <button
          v-if="raccourcis[0]"
          @click="naviguer(raccourcis[0].page)"
          class="flex w-14 flex-col items-center gap-0.5 border-t-2 py-1"
          :class="estActif(raccourcis[0].page) ? 'border-[#225BBF] text-[#333D2A] dark:text-white' : 'border-transparent text-slate-500 dark:text-slate-400'"
        >
          <i class="fa-solid text-lg" :class="raccourcis[0].icon"></i>
          <span class="text-[10px] font-semibold">{{ raccourcis[0].label }}</span>
        </button>
      </template>
      <!-- PELERIN / PROCHE : leurs pages principales directement dans la barre -->
      <template v-else>
        <button
          v-for="lien in liens.slice(0, role === 'PELERIN' ? 4 : 3)"
          :key="lien.page"
          @click="naviguer(lien.page)"
          class="flex w-14 flex-col items-center gap-0.5 border-t-2 py-1"
          :class="estActif(lien.page) ? 'border-[#225BBF] text-[#333D2A] dark:text-white' : 'border-transparent text-slate-500 dark:text-slate-400'"
        >
          <i class="fa-solid text-lg" :class="lien.icon"></i>
          <span class="text-[10px] font-semibold">{{ lien.label }}</span>
        </button>
      </template>

      <!-- Bouton central : Centre de contrôle (vert foncé) — ADMIN et GUIDE -->
      <button v-if="estStaff" @click="menuOuvert = !menuOuvert" class="relative flex flex-col items-center -mt-6" aria-label="Centre de contrôle">
        <span
          class="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white text-xl text-white shadow-lg transition"
          :class="menuOuvert ? 'bg-[#B40909]' : 'bg-[#333D2A] hover:opacity-90'"
        >
          <i class="fa-solid" :class="menuOuvert ? 'fa-xmark' : 'fa-table-columns'"></i>
        </span>
        <span class="mt-0.5 text-[10px] font-extrabold text-[#333D2A] dark:text-white">Contrôle</span>
      </button>

      <!-- Raccourci 2 (staff uniquement, après le bouton central) -->
      <button
        v-if="estStaff && raccourcis[1]"
        @click="naviguer(raccourcis[1].page)"
        class="flex w-14 flex-col items-center gap-0.5 border-t-2 py-1"
        :class="estActif(raccourcis[1].page) ? 'border-[#225BBF] text-[#333D2A] dark:text-white' : 'border-transparent text-slate-500 dark:text-slate-400'"
      >
        <i class="fa-solid text-lg" :class="raccourcis[1].icon"></i>
        <span class="text-[10px] font-semibold">{{ raccourcis[1].label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* Fenêtre flottante façon "Assistive Touch" iOS */
.assistive-menu {
  background-color: rgba(25, 25, 25, 0.75);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

/* Icône SVG en trait fin, blanc, dans une pastille neutre */
.assistive-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
  border-radius: 18px;
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.08);
  transition: background-color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.assistive-item {
  color: #ffffff;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.assistive-item:active {
  transform: scale(0.92);
  opacity: 0.75;
}
.assistive-item.active .assistive-icon {
  background-color: rgba(34, 91, 191, 0.55);
}

@media (hover: hover) {
  .assistive-item:hover .assistive-icon {
    background-color: rgba(255, 255, 255, 0.16);
  }
  .assistive-item:hover {
    opacity: 0.9;
  }
}

/* Étiquette sous l'icône */
.assistive-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: 0.2px;
}

/* Animation d'apparition : scale 0.9 -> 1 + fondu sur 200ms */
.assistive-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.assistive-enter-from {
  opacity: 0;
  transform: scale(0.9);
}
.assistive-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.assistive-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
