import { useAuthStore } from '../stores/auth.js';

/**
 * @param {object} options      options passés à fetch
 * @param {string} errorMessage message de repli si le backend n'en fournit pas
 * @param {object} comportement
 * @param {boolean} [comportement.anonyme=false]
 *        true pour les routes publiques (demande d'inscription).
 *        Un 401 y signifie « route mal appelée », pas « session expirée » :
 *        sans ce drapeau, on déconnecterait l'utilisateur et on le
 *        renverrait vers /login, alors qu'il est déjà sur une page publique —
 *        c'est-à-dire une boucle de redirection.
 */
export async function apiRequest(url, options = {}, errorMessage = "Une erreur est survenue", comportement = {}) {
    const { anonyme = false } = comportement;

    // On récupère le Store Pinia pour accéder au token et à la méthode logout.
    // Sur une route anonyme on ne le consulte pas du tout : la page publique
    // doit fonctionner sans session.
    const token = anonyme ? null : useAuthStore().token;

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            // Le backend protège toutes les routes par JWT
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
        },
    });

    if (!response.ok) {
        // Le backend renvoie { erreur: "..." } : on préfère son message
        let messageServeur = null;
        try {
            const corps = await response.json();
            messageServeur = corps?.erreur ?? null;
        } catch {
            // réponse sans JSON exploitable, on garde le message par défaut
        }

        // Token absent ou expiré (24 h) : le Store gère le nettoyage.
        // Ignoré sur une route anonyme, voir commentaire plus haut.
        if (response.status === 401 && !anonyme) {
            const authStore = useAuthStore();
            authStore.logout(); // Vide le store + localStorage
            window.location.href = '/login'; // Redirection vers la connexion
            throw new Error("Session expirée. Reconnecte-toi.");
        }

        throw new Error(messageServeur ?? errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}