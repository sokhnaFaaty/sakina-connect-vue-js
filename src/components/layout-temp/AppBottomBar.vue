<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const NAV_LINKS_BY_ROLE = {
  ADMIN: [
    { page: 'dashboard-admin', label: 'Tableau de Bord', icon: 'fa-gauge' },
    { page: 'annuaire-guides', label: 'Guides', icon: 'fa-user-tie' },
    { page: 'groupes', label: 'Groupes', icon: 'fa-people-group' },
    { page: 'pelerins', label: 'Pèlerins', icon: 'fa-users' },
    { page: 'itineraire', label: 'Itinéraire', icon: 'fa-route' },
    { page: 'annonces', label: 'Annonces', icon: 'fa-bullhorn' },
  ],
  GUIDE: [
    { page: 'dashboard-guide', label: 'Tableau de Bord', icon: 'fa-gauge' },
    { page: 'mon-groupe', label: 'Mon groupe', icon: 'fa-users' },
    { page: 'itineraire', label: 'Itinéraire', icon: 'fa-route' },
    { page: 'annonces', label: 'Annonces', icon: 'fa-bullhorn' },
  ],
  PELERIN: [
    { page: 'dashboard-pelerin', label: 'Tableau de Bord', icon: 'fa-gauge' },
    { page: 'mon-profil', label: 'Profil', icon: 'fa-user' },
    { page: 'mon-groupe-pelerin', label: 'Groupe', icon: 'fa-users' },
    { page: 'itineraire', label: 'Itinéraire', icon: 'fa-route' },
    { page: 'annonces', label: 'Annonces', icon: 'fa-bullhorn' },
  ],
  PROCHE: [
    { page: 'dashboard-proche', label: 'Tableau de Bord', icon: 'fa-gauge' },
    { page: 'suivi-familial', label: 'Suivi', icon: 'fa-heart' },
    { page: 'mon-profil-proche', label: 'Profil', icon: 'fa-user' },
  ],
};

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
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white lg:hidden" aria-label="Navigation mobile">
    <!-- Menu du Centre de contrôle (ADMIN / GUIDE uniquement) -->
    <div
      v-if="menuOuvert"
      class="absolute bottom-full inset-x-2 mb-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl"
    >
      <p class="px-1 pb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">Centre de contrôle</p>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="lien in liens"
          :key="lien.page"
          @click="naviguer(lien.page)"
          class="flex flex-col items-center gap-1 rounded-2xl border-l-4 border-transparent px-2 py-3 text-[11px] font-bold text-slate-600 transition"
          :class="estActif(lien.page) ? 'border-[#225BBF] bg-[#F2F2DE] text-[#333D2A]' : 'hover:bg-slate-50'"
        >
          <i class="fa-solid text-lg" :class="lien.icon"></i>
          <span>{{ lien.label }}</span>
        </button>
      </div>
    </div>

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
          :class="estActif(raccourcis[0].page) ? 'border-[#225BBF] text-[#333D2A]' : 'border-transparent text-slate-500'"
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
          :class="estActif(lien.page) ? 'border-[#225BBF] text-[#333D2A]' : 'border-transparent text-slate-500'"
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
        <span class="mt-0.5 text-[10px] font-extrabold text-[#333D2A]">Contrôle</span>
      </button>

      <!-- Raccourci 2 (staff uniquement, après le bouton central) -->
      <button
        v-if="estStaff && raccourcis[1]"
        @click="naviguer(raccourcis[1].page)"
        class="flex w-14 flex-col items-center gap-0.5 border-t-2 py-1"
        :class="estActif(raccourcis[1].page) ? 'border-[#225BBF] text-[#333D2A]' : 'border-transparent text-slate-500'"
      >
        <i class="fa-solid text-lg" :class="raccourcis[1].icon"></i>
        <span class="text-[10px] font-semibold">{{ raccourcis[1].label }}</span>
      </button>
    </div>
  </nav>
</template>
