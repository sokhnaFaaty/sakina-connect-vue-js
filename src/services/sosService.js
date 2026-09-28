
import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getSos() {
  return apiRequest(ENDPOINTS.sos, {}, "Impossible de charger les alertes SOS.");
}

// Pour le Guide : uniquement les SOS liés à son groupe (via la liste des pèlerins de ce groupe)
export async function getSosParPelerinIds(pelerinIds) {
  const all = await getSos();
  return all.filter((s) => pelerinIds.includes(s.pelerinId));
}

// Déclenché par le pèlerin — position capturée une seule fois, pas de suivi continu.
//
// Ni `pelerinId` ni `guideId` ne sont envoyés : le serveur les déduit du jeton et
// de l'appartenance au groupe. Les envoyer était refusé en 400 après le durcissement,
// et surtout cela aurait permis de router sa propre alerte vers un autre pèlerin ou
// un autre guide. Le client n'a rien à dire sur le destinataire d'une alerte.
export async function declencherSos({ commentaire } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const sos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            dateHeure: new Date().toISOString(),
            commentaire: commentaire || "",
          };
          const created = await apiRequest(
            ENDPOINTS.sos,
            { method: "POST", body: JSON.stringify(sos) },
            "Impossible d'envoyer l'alerte SOS."
          );
          resolve(created);
        } catch (error) {
          reject(error);
        }
      },
      () => reject(new Error("Impossible de récupérer ta position. Vérifie que la géolocalisation est autorisée.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Position déjà captée côté vue. Même contrat que declencherSos : le destinataire
// est déduit par le serveur.
export async function createSos({ latitude, longitude, dateHeure, commentaire } = {}) {
  return apiRequest(
    ENDPOINTS.sos,
    {
      method: "POST",
      body: JSON.stringify({
        latitude,
        longitude,
        dateHeure,
        commentaire: commentaire || "",
      }),
    },
    "Impossible d'envoyer l'alerte SOS."
  );
}

// Marque un SOS comme résolu — Guide ou Admin uniquement (jamais le pèlerin)
export async function marquerSosResolu(id) {
  return apiRequest(
    `${ENDPOINTS.sos}/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "RESOLU" }) },
    "Impossible de mettre à jour l'alerte SOS."
  );
}
// Vérifie si ce pèlerin a déjà un SOS en cours (EN_ATTENTE), pour éviter les doublons
export async function getSosActifDuPelerin(pelerinId) {
  const all = await getSos();
  return all.find((s) => s.pelerinId === pelerinId && s.statut === "EN_ATTENTE") || null;
}