<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const NAV_LINKS_BY_ROLE = {
  ADMIN: [
    { page: 'dashboard-admin', label: 'Tableau de Bord', icon: 'fa-gauge' },
    { page: 'annuaire-guides', label: 'Annuaire des Guides', icon: 'fa-user-tie' },
    { page: 'groupes', label: 'Liste des Groupes', icon: 'fa-people-group' },
    { page: 'pelerins', label: 'Liste des Pèlerins', icon: 'fa-users' },
    { page: 'itineraire', label: 'Itinéraire Voyage', icon: 'fa-route' },
    { page: 'annonces', label: "Tableau d'affichage", icon: 'fa-bullhorn' },
  ],
  GUIDE: [
    { page: 'dashboard-guide', label: 'Tableau de Bord', icon: 'fa-gauge' },
    { page: 'mon-groupe', label: 'Mon groupe', icon: 'fa-users' },
    { page: 'itineraire', label: 'Itinéraire Voyage', icon: 'fa-route' },
    { page: 'annonces', label: "Tableau d'annonces", icon: 'fa-bullhorn' },
  ],
  PELERIN: [
    { page: 'dashboard-pelerin', label: 'Tableau de Bord', icon: 'fa-gauge' },
    { page: 'mon-profil', label: 'Mon profil', icon: 'fa-user' },
    { page: 'mon-groupe-pelerin', label: 'Mon groupe', icon: 'fa-users' },
    { page: 'itineraire', label: 'Itinéraire Voyage', icon: 'fa-route' },
    { page: 'annonces', label: "Tableau d'annonces", icon: 'fa-bullhorn' },
  ],
  PROCHE: [
    { page: 'dashboard-proche', label: 'Tableau de Bord', icon: 'fa-gauge' },
    { page: 'suivi-familial', label: 'Suivi Familial', icon: 'fa-heart' },
    { page: 'mon-profil-proche', label: 'Mon profil', icon: 'fa-user' },
  ],
};

const POLE_URGENCE_BY_ROLE = {
  ADMIN: 'pole-urgence',
  GUIDE: 'mon-pole-urgence',
  PELERIN: 'pole-urgence-pelerin',
};

const role = computed(() => auth.role);
const links = computed(() => NAV_LINKS_BY_ROLE[role.value] || []);

function naviguer(page) {
  router.push(`/${page}`);
}
</script>

<template>
  <aside class="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
    <p class="px-5 pb-2 pt-6 text-xs font-extrabold uppercase tracking-widest text-slate-400">Vues système :</p>

    <nav class="grid flex-1 content-start gap-1 overflow-y-auto px-4 pb-4" aria-label="Navigation principale">
      <button 
        v-for="link in links" 
        :key="link.page"
        @click="naviguer(link.page)"
        class="flex items-center gap-3 rounded-xl border-l-4 border-transparent px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-[#F2F2DE]/60"
        :class="route.path.startsWith('/' + link.page) ? 'border-blue-500 bg-[#F2F2DE] text-[#333D2A]' : ''"
      >
        <i class="fa-solid" :class="link.icon + ' w-5 text-center'"></i>
        <span>{{ link.label }}</span>
      </button>
    </nav>

    <!-- Bouton SOS (non disponible pour PROCHE), collé en bas -->
    <div v-if="role !== 'PROCHE'" class="mt-auto grid w-full gap-3 px-5 pb-5">
      <button 
        @click="naviguer(POLE_URGENCE_BY_ROLE[role])"
        class="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#B40909] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
      >
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>Urgence SOS</span>
      </button>
    </div>
  </aside>
</template>
