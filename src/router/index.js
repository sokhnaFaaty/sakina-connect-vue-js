import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { HOME_PAGE_BY_ROLE } from '@/config/roles.js';
import { useToast } from '@/composables/useToast.js';

// Import de toutes tes vues
import AccueilView from '@/views/AccueilView.vue';
import DemandeInscriptionView from '@/views/DemandeInscriptionView.vue';
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
import NotFoundView from '@/views/NotFoundView.vue';

const routes = [
  // Pages publiques : accessibles SANS session, y compris pour un visiteur non
  // connecté. Aucune donnée personnelle n'y est exposée — l'accueil ne fait
  // qu'annoncer la plateforme, et le formulaire ne crée qu'une demande en
  // attente dont l'examen reste réservé à l'administrateur.
  { path: '/', name: 'accueil', component: AccueilView },
  { path: '/nous-rejoindre', name: 'nous-rejoindre', component: DemandeInscriptionView },
  { path: '/login', name: 'login', component: LoginView },
// Routes protégées
  { path: '/groupes', name: 'groupes', component: GroupesView, meta: { requiresAuth: true, roles: ['ADMIN'] } },
  { path: '/pelerins', name: 'pelerins', component: PelerinsView, meta: { requiresAuth: true, roles: ['ADMIN'] } },
  { path: '/annuaire-guides', name: 'annuaire-guides', component: GuidesView, meta: { requiresAuth: true, roles: ['ADMIN'] } },
  { path: '/itineraire', name: 'itineraire', component: ItineraireView, meta: { requiresAuth: true, roles: ['GUIDE', 'ADMIN', 'PELERIN'] } },
  { path: '/annonces', name: 'annonces', component: AnnoncesView, meta: { requiresAuth: true, roles: ['ADMIN', 'GUIDE', 'PELERIN'] } },
  { path: '/dashboard-admin', name: 'dashboard-admin', component: DashboardAdminView, meta: { requiresAuth: true, roles: ['ADMIN'] } },
  { path: '/dashboard-guide', name: 'dashboard-guide', component: DashboardGuideView, meta: { requiresAuth: true, roles: ['GUIDE'] } },
  { path: '/dashboard-pelerin', name: 'dashboard-pelerin', component: DashboardPelerinView, meta: { requiresAuth: true, roles: ['PELERIN'] } },
  { path: '/dashboard-proche', name: 'dashboard-proche', component: DashboardProcheView, meta: { requiresAuth: true, roles: ['PROCHE'] } },
  { path: '/suivi-familial', name: 'suivi-familial', component: SuiviFamilialView, meta: { requiresAuth: true, roles: ['PROCHE'] } },
  { path: '/mon-profil-proche', name: 'mon-profil-proche', component: ProfilProcheView, meta: { requiresAuth: true, roles: ['PROCHE'] } },
  { path: '/archives', name: 'archives', component: ArchivesView, meta: { requiresAuth: true, roles: ['ADMIN'] } },
  { path: '/mon-profil', name: 'mon-profil', component: ProfilPelerinView, meta: { requiresAuth: true, roles: ['PELERIN'] } },
  { path: '/mon-groupe-pelerin', name: 'mon-groupe-pelerin', component: MonGroupePelerinView, meta: { requiresAuth: true, roles: ['PELERIN'] } },
  { path: '/mon-groupe', name: 'mon-groupe', component: MonGroupeView, meta: { requiresAuth: true, roles: ['GUIDE'] } },
  { path: '/pole-urgence', name: 'pole-urgence', component: PoleUrgenceView, meta: { requiresAuth: true, roles: ['ADMIN'] } },
  { path: '/mon-pole-urgence', name: 'mon-pole-urgence', component: MonPoleUrgenceView, meta: { requiresAuth: true, roles: ['GUIDE'] } },
  { path: '/pole-urgence-pelerin', name: 'pole-urgence-pelerin', component: PoleUrgencePelerinView, meta: { requiresAuth: true, roles: ['PELERIN'] } },
  // Toute URL inconnue => page 404 (rendue seule, pleine page, sans layout)
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { layout: 'blank' } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Page d'accueil selon le rôle (fidèle au vanilla config/roles.js)
const redirigerAccueil = () => {
  const auth = useAuthStore();
  const page = HOME_PAGE_BY_ROLE[auth.role];
  return page ? { name: page } : { name: 'login' };
};

// Garde de navigation : empêche d'accéder aux routes protégées sans être connecté,
// et restreint chaque page aux rôles autorisés (comme le ROUTE_PERMISSIONS du vanilla)
router.beforeEach((to) => {
  const auth = useAuthStore();

  // Session invalide (token absent/expiré) => on nettoie et on va sur la page de connexion
  if (!auth.isAuthenticated) {
    if (to.meta.requiresAuth) {
      return { name: 'login' };
    }
    return true;
  }

  // Déjà connecté : on ne laisse pas accéder au login
  if (to.name === 'login') {
    return redirigerAccueil();
  }

  // Déjà connecté, sur une page publique : on renvoie vers son espace. Sans
  // cela un administrateur_CONNECTé pourrait remplir le formulaire et demander
  // un compte pèlerin, ce qui n'a aucun sens et encombre l'administration d'une
  // demande à traiter.
  if (to.name === 'accueil' || to.name === 'nous-rejoindre') {
    return redirigerAccueil();
  }

  // Restriction par rôle
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    const { error } = useToast();
    error('Accès refusé.');
    return redirigerAccueil();
  }

  return true;
});

export default router;