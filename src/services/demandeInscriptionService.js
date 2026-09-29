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

// ---------------------------------------------------------------------------
// Côté ADMIN — les trois appels qui font vivre le circuit de la demande.
//
// Tous exigent le rôle ADMIN : le backend répond 403 avant même de lire le
// corps. Aucune de ces fonctions ne prend `anonyme`, donc un 401 déclenche le
// logout normal, ce qui est le comportement voulu sur une page privée.
//
// `accepterDemande` est l'appel le plus important du back-office : il crée le
// compte, la fiche pèlerin et l'affectation de groupe dans UNE seule transaction.
// Si elle échoue, il n'y a pas de compte à moitié créé.
// ---------------------------------------------------------------------------

/** Liste les demandes, optionnellement filtrées par statut (EN_ATTENTE...). */
export async function getDemandesInscription(statut) {
    const url = statut
        ? `${ENDPOINTS.demandesInscription}?statut=${encodeURIComponent(statut)}`
        : ENDPOINTS.demandesInscription;

    return apiRequest(
        url,
        {},
        "Impossible de charger les demandes d'inscription.",
    );
}

/**
 * Accepte une demande et crée le pèlerin.
 *
 * Le corps ne contient QUE ce que l'administrateur doit décider : le groupe
 * d'affectation, le numéro de passeport saisi à la main, et le contact
 * d'urgence s'il le connaît. Ni l'email, ni le mot de passe, ni l'identité ne
 * transitent : ils viennent de la demande elle-même.
 */
export async function accepterDemandeInscription(id, donnees) {
    return apiRequest(
        `${ENDPOINTS.demandesInscription}/${id}/accepter`,
        {
            method: "POST",
            body: JSON.stringify(donnees),
        },
        "Impossible d'accepter cette demande.",
    );
}

/** Refuse une demande. Le motif est obligatoire, le commentaire est facultatif. */
export async function refuserDemandeInscription(id, donnees) {
    return apiRequest(
        `${ENDPOINTS.demandesInscription}/${id}/refuser`,
        {
            method: "POST",
            body: JSON.stringify(donnees),
        },
        "Impossible de refuser cette demande.",
    );
}
