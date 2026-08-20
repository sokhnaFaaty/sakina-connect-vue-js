// src/stores/auth.js
import { defineStore } from 'pinia';
import { login as apiLogin } from '@/services/authService.js';

// Fonction utilitaire pour lire le localStorage au démarrage
function getSessionFromStorage() {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('currentUser');
  let user = null;
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch {
      // Si le JSON est corrompu, on nettoie
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      token = null;
    }
  }
  return { token, user };
}

export const useAuthStore = defineStore('auth', {
  // L'état initial est lu depuis le localStorage (persistance au rechargement)
  state: () => {
    const { token, user } = getSessionFromStorage();
    return {
      token: token,
      user: user,
    };
  },

  getters: {
    // Retourne true si l'utilisateur est connecté
    isAuthenticated: (state) => !!state.token,
    // Retourne le rôle de l'utilisateur (ou null)
    role: (state) => state.user?.role || null,
  },

  actions: {
    // Action de connexion : appelle le service, puis met à jour le store + localStorage
    async login(email, motDePasse) {
      // `apiLogin` ne fait plus que l'appel réseau (voir étape 2 ci-dessous)
      const { token, user } = await apiLogin(email, motDePasse);

      // 1. Mise à jour du store Pinia (état réactif)
      this.token = token;
      this.user = user;

      // 2. Mise à jour du localStorage (pour persistance après rafraîchissement)
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));

      return user;
    },

    // Action de déconnexion
    logout() {
      // 1. Nettoyer le store
      this.token = null;
      this.user = null;

      // 2. Nettoyer le localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    },
  },
});