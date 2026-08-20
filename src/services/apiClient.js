import { getToken, clearSession } from "../utils/auth.js";

export async function apiRequest(url, options = {}, errorMessage = "Une erreur est survenue") {
    const token = getToken();

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
        // Token absent ou expiré (24 h) : on repart de la page de connexion
        if (response.status === 401) {
            clearSession();
            window.location.href = window.location.pathname;
            throw new Error("Session expirée. Reconnecte-toi.");
        }

        // Le backend renvoie { erreur: "..." } : on préfère son message
        let messageServeur = null;
        try {
            const corps = await response.json();
            messageServeur = corps?.erreur ?? null;
        } catch {
            // réponse sans JSON exploitable, on garde le message par défaut
        }

        throw new Error(messageServeur ?? errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}
