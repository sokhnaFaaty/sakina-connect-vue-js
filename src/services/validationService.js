import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";


function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

// Ramène un téléphone à ses 9 derniers chiffres (ignore espaces et indicatif 221)
function normalizeTelephone(value) {
  return String(value ?? "").replace(/\D/g, "").slice(-9);
}

function normalizePasseport(value) {
  return String(value ?? "").trim().toUpperCase();
}

/**
 * Unicité d'un email / d'un téléphone, décidée par le serveur.
 *
 * Ce contrôle se faisait en téléchargeant TOUTE la liste des utilisateurs puis
 * en la parcourant côté client. Deux conséquences, dont une de sécurité : chaque
 * formulaire de profil récupérait l'annuaire complet — emails et téléphones de
 * tout le monde — pour vérifier un seul champ ; et depuis que la liste complète
 * est réservée à l'ADMIN, un pèlerin ou un proche obtenait un 403 en éditant son
 * profil.
 *
 * Le serveur normalise aussi le téléphone sur ses derniers chiffres, comme le
 * faisait ce fichier. La normalisation est donc conservée ici, pour le message
 * d'erreur, mais elle ne décide plus de l'unicité.
 */
async function verifierExistence(critere, valeur, excludeUserId = null) {
  const params = new URLSearchParams({ [critere]: valeur });
  if (excludeUserId) params.set('exclureId', excludeUserId);
  return apiRequest(
    `${ENDPOINTS.utilisateurs}/existe?${params.toString()}`,
    {},
    "Impossible de vérifier l'unicité."
  );
}

// L'email est-il déjà utilisé par un autre compte ? excludeUserId = compte à ignorer (édition)
export async function emailExiste(email, excludeUserId = null) {
  const cible = normalizeEmail(email);
  if (!cible) return false;
  const r = await verifierExistence('email', cible, excludeUserId);
  return r.email === true;
}

// Le téléphone est-il déjà utilisé par un autre compte ?
export async function telephoneExiste(telephone, excludeUserId = null) {
  const cible = normalizeTelephone(telephone);
  if (!cible) return false;
  const r = await verifierExistence('telephone', cible, excludeUserId);
  return r.telephone === true;
}

// Le numéro de passeport est-il déjà utilisé par un autre pèlerin ?
export async function passeportExiste(numeroPasseport, excludePelerinId = null) {
  const cible = normalizePasseport(numeroPasseport);
  if (!cible) return false;
  const pelerins = await apiRequest(ENDPOINTS.pelerins, {}, "Impossible de vérifier l'unicité du passeport.");
  return pelerins.some((p) => p.id !== excludePelerinId && normalizePasseport(p.numeroPasseport) === cible);
}
