// services/utilisateurService.js
import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

/**
 * Répertoire minimal — c'est ce dont le front a besoin dans presque toutes les
 * vues, pour afficher un nom à côté d'un `utilisateurId`.
 *
 * Il cible volontairement `/utilisateurs/repertoire` et non `/utilisateurs` :
 * la liste complète est réservée à l'ADMIN, parce qu'elle contient l'email et
 * l'état de tous les comptes. Utiliser la liste complète ici ferait échouer la
 * requête en 403 pour un pèlerin, un guide ou un proche.
 */
export async function getUtilisateurs() {
    return apiRequest(
        `${ENDPOINTS.utilisateurs}/repertoire`,
        {},
        "Impossible de charger l'annuaire."
    );
}

/**
 * Liste COMPLÈTE — ADMIN uniquement.
 *
 * Réservée aux écrans qui doivent montrer une donnée sensible : l'annuaire des
 * guides affiche l'email, que le répertoire ne contient pas. Appeler celle-ci
 * depuis une vue non-ADMIN renvoie 403.
 */
export async function getUtilisateursComplet() {
    return apiRequest(
        ENDPOINTS.utilisateurs,
        {},
        "Impossible de charger les utilisateurs."
    );
}

export async function getUtilisateurById(id) {
    return apiRequest(`${ENDPOINTS.utilisateurs}/${id}`, {}, "Impossible de charger cet utilisateur.");
}

// Met à jour un compte utilisateur (self-service depuis "Mon profil", ou admin).
// `data` ne contient que les champs à modifier (email, telephone, photo, motDePasse, nomComplet...).
export async function updateUtilisateur(id, data) {
  return apiRequest(
    `${ENDPOINTS.utilisateurs}/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    "Impossible de mettre à jour le compte."
  );
}