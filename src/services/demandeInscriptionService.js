import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

/**
 * Demande d'inscription d'un pèlerin — route PUBLIQUE et ANONYME.
 *
 * Contrainte à comprendre avant d'y toucher : cet appel ne crée aucun compte.
 * Il enregistre une simple demande en attente, que l'administrateur accepte
 * ou refuse depuis son tableau de bord. Le pèlerin n'existe pas en base tant
 * que l'acceptation n'a pas eu lieu.
 *
 * Conséquence pour le mot de passe : il est choisi ICI par le pèlerin, transmis
 * en clair sur HTTPS, et stocké hashé par le backend à l'acceptation. Un compte
 * ne peut donc pas être activé avec un mot de passe que son titulaire ne
 * connaît pas.
 *
 * `anonyme: true` est indispensable : sans ce drapeau, un 401 déclencherait
 * un logout + redirection vers /login depuis une page publique.
 */
export async function creerDemandeInscription(donnees) {
    return apiRequest(
        ENDPOINTS.demandesInscription,
        {
            method: "POST",
            body: JSON.stringify(donnees),
        },
        "Impossible d'envoyer votre demande. Réessayez plus tard.",
        { anonyme: true },
    );
}
