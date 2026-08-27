// src/stores/auth.js
import { defineStore } from 'pinia';
import { login as apiLogin } from '@/services/authService.js';

// Retourne true si le token JWT est valide (non expiré).
// Le backend signe des JWT valides 24h ; on vérifie le champ `exp` (secondes).
function tokenEstExpire(token) {
  if (!token) return true;
  const morceaux = token.split('.');
  if (morceaux.length !== 3) return false; // pas un JWT : on le laisse (à vérifier côté serveur)
  try {
    const payload = JSON.parse(atob(morceaux[1]));
    if (typeof payload.exp === 'number') return payload.exp * 1000 < Date.now();
    return false;
  } catch {
    return false; // payload non décodable, on ne prend pas le risque de déconnecter
  }
}

// Fonction utilitaire pour lire le localStorage au démarrage
// et nettoyer la session si le token est absent ou expiré (ou si le JSON est corrompu).
function getSessionFromStorage() {
  let token = localStorage.getItem('token');
  const userData = localStorage.getItem('currentUser');
  let user = null;
  let corrompu = false;
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch {
      // Si le JSON est corrompu, on nettoie
      corrompu = true;
    }
  }

  // Pas de token (ou token expiré / données corrompues) => on vide tout
  if (corrompu || !token || tokenEstExpire(token)) {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    return { token: null, user: null };
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