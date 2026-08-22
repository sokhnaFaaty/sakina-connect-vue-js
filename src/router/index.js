import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { HOME_PAGE_BY_ROLE } from '@/config/roles.js';

// Import de toutes tes vues
import LoginView from '@/views/LoginView.vue';
import GroupesView from '@/views/GroupesView.vue';
import PelerinsView from '@/views/PelerinsView.vue';
import GuidesView from '@/views/GuidesView.vue';
import ItineraireView from '@/views/ItineraireView.vue';
import AnnoncesView from '@/views/AnnoncesView.vue';
import DashboardAdminView from '@/views/DashboardAdminView.vue';
import DashboardGuideView from '@/views/DashboardGuideView.vue';
import DashboardPelerinView from '@/views/DashboardPelerinView.vue';
import DashboardProcheView from '@/views/DashboardProcheView.vue';
import SuiviFamilialView from '@/views/SuiviFamilialView.vue';
import ProfilProcheView from '@/views/ProfilProcheView.vue';
import ArchivesView from '@/views/ArchivesView.vue';
import ProfilPelerinView from '@/views/ProfilPelerinView.vue';
import MonGroupePelerinView from '@/views/MonGroupePelerinView.vue';
import MonGroupeView from '@/views/MonGroupeView.vue';
import PoleUrgenceView from '@/views/PoleUrgenceView.vue';
import MonPoleUrgenceView from '@/views/MonPoleUrgenceView.vue';
import PoleUrgencePelerinView from '@/views/PoleUrgencePelerinView.vue';

const routes = [
  { path: '/login', name: 'login', component: LoginView },
  { path: '/', redirect: '/login' },
  
  // Routes protégées
  { path: '/groupes', name: 'groupes', component: GroupesView, meta: { requiresAuth: true } },
  { path: '/pelerins', name: 'pelerins', component: PelerinsView, meta: { requiresAuth: true } },
  { path: '/annuaire-guides', name: 'annuaire-guides', component: GuidesView, meta: { requiresAuth: true } },
  { path: '/itineraire', name: 'itineraire', component: ItineraireView, meta: { requiresAuth: true } },
  { path: '/annonces', name: 'annonces', component: AnnoncesView, meta: { requiresAuth: true } },
  { path: '/dashboard-admin', name: 'dashboard-admin', component: DashboardAdminView, meta: { requiresAuth: true } },
  { path: '/dashboard-guide', name: 'dashboard-guide', component: DashboardGuideView, meta: { requiresAuth: true } },
  { path: '/dashboard-pelerin', name: 'dashboard-pelerin', component: DashboardPelerinView, meta: { requiresAuth: true } },
  { path: '/dashboard-proche', name: 'dashboard-proche', component: DashboardProcheView, meta: { requiresAuth: true } },
  { path: '/suivi-familial', name: 'suivi-familial', component: SuiviFamilialView, meta: { requiresAuth: true } },
  { path: '/mon-profil-proche', name: 'mon-profil-proche', component: ProfilProcheView, meta: { requiresAuth: true } },
  { path: '/archives', name: 'archives', component: ArchivesView, meta: { requiresAuth: true } },
  { path: '/mon-profil', name: 'mon-profil', component: ProfilPelerinView, meta: { requiresAuth: true } },
  { path: '/mon-groupe-pelerin', name: 'mon-groupe-pelerin', component: MonGroupePelerinView, meta: { requiresAuth: true } },
  { path: '/mon-groupe', name: 'mon-groupe', component: MonGroupeView, meta: { requiresAuth: true } },
  { path: '/pole-urgence', name: 'pole-urgence', component: PoleUrgenceView, meta: { requiresAuth: true } },
  { path: '/mon-pole-urgence', name: 'mon-pole-urgence', component: MonPoleUrgenceView, meta: { requiresAuth: true } },
  { path: '/pole-urgence-pelerin', name: 'pole-urgence-pelerin', component: PoleUrgencePelerinView, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Garde de navigation : empêche d'accéder aux routes protégées sans être connecté,
// et redirige vers la page d'accueil du rôle si déjà authentifié
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  // Non authentifié : interdiction d'accéder aux routes protégées
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/login');
    return;
  }

  // Déjà authentifié : pas de retour sur /login ou /register
  if (auth.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    const homePage = HOME_PAGE_BY_ROLE[auth.role];
    if (homePage) {
      next({ name: homePage });
      return;
    }
  }

  next();
});

export default router;