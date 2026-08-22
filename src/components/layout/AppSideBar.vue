<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const props = defineProps({ open: Boolean });
const emit = defineEmits(['update:open']);

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

function fermerSidebar() {
  emit('update:open', false);
}

function naviguer(page) {
  router.push(`/${page}`);
  fermerSidebar();
}
</script>

<template>
  <Teleport to="body">
    <!-- Overlay (visible uniquement sur mobile) -->
    <div 
      v-if="open" 
      class="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden" 
      @click="fermerSidebar"
    ></div>
  </Teleport>

  <aside 
    class="fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0"
    :class="{ 'translate-x-0': open }"
  >
    <p class="px-5 pb-2 pt-6 text-xs font-extrabold uppercase tracking-widest text-slate-400">Vues système :</p>

    <nav class="grid gap-1 px-4 pb-4" aria-label="Navigation principale">
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

    <!-- Bouton SOS (non disponible pour PROCHE) -->
    <div v-if="role !== 'PROCHE'" class="absolute bottom-5 w-full px-5 grid gap-3">
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