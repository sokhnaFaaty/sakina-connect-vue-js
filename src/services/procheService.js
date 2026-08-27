import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js"; 
import { required } from "../utils/validators.js"; 
import { generateTempPassword } from "../utils/password.js"; 

function normalizeProche(data) {
  return {
    id: data.id,
    utilisateurId: data.utilisateurId,
    pelerinId: data.pelerinId,
    lienParente: String(data.lienParente).trim(),
    isActive: data.isActive !== false,
  };
}

export async function getProches() {
  const proches = await apiRequest(ENDPOINTS.proches, {}, "Impossible de charger les proches.");
  return proches.filter((p) => p.isActive !== false);
}

export async function getProchesArchives() {
  const proches = await apiRequest(ENDPOINTS.proches, {}, "Impossible de charger les proches archivés.");
  return proches.filter((p) => p.isActive === false);
}

export async function getProcheByUtilisateurId(utilisateurId) {
  const proches = await apiRequest(
    `${ENDPOINTS.proches}?utilisateurId=${utilisateurId}`,
    {},
    "Impossible de charger le profil proche."
  );
  return proches[0] || null;
}

export async function getProcheByPelerinId(pelerinId) {
  const proches = await apiRequest(
    `${ENDPOINTS.proches}?pelerinId=${pelerinId}`,
    {},
    "Impossible de charger le proche du pèlerin."
  );
  return proches.find((p) => p.isActive !== false) || null;
}

export async function createProche(data) {
  required(data.nomComplet, "Le nom complet du proche est obligatoire.");
  required(data.telephone, "Le téléphone du proche est obligatoire.");
  required(data.lienParente, "Le lien de parenté est obligatoire.");
  required(data.pelerinId, "Le pèlerin associé est obligatoire.");

  const motDePasseGenere = generateTempPassword();

  const utilisateurId = createId("user");
  const nouvelUtilisateur = {
    id: utilisateurId,
    nomComplet: String(data.nomComplet).trim(),
    email: data.email ? String(data.email).trim() : "",
    telephone: data.telephone,
    motDePasse: motDePasseGenere,
    role: "PROCHE",
    photo: "",
    dateCreation: new Date().toISOString().slice(0, 10),
    isActive: true,
  };

  await apiRequest(
    ENDPOINTS.utilisateurs,
    { method: "POST", body: JSON.stringify(nouvelUtilisateur) },
    "Impossible de créer le compte utilisateur du proche."
  );

  const proche = normalizeProche({
    id: createId("proc"),
    utilisateurId,
    pelerinId: data.pelerinId,
    lienParente: data.lienParente,
  });

  const procheCree = await apiRequest(
    ENDPOINTS.proches,
    { method: "POST", body: JSON.stringify(proche) },
    "Impossible de créer le proche."
  );

  return { proche: procheCree, motDePasseGenere };
}

export async function updateProche(procheId, utilisateurId, data) {
  required(data.nomComplet, "Le nom complet du proche est obligatoire.");
  required(data.telephone, "Le téléphone du proche est obligatoire.");
  required(data.lienParente, "Le lien de parenté est obligatoire.");

  await apiRequest(
    `${ENDPOINTS.utilisateurs}/${utilisateurId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        nomComplet: String(data.nomComplet).trim(),
        email: data.email ? String(data.email).trim() : "",
        telephone: String(data.telephone).trim(),
      }),
    },
    "Impossible de mettre à jour le compte du proche."
  );

  return apiRequest(
    `${ENDPOINTS.proches}/${procheId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ lienParente: String(data.lienParente).trim() }),
    },
    "Impossible de mettre à jour le proche."
  );
}

export async function deleteProche(id) {
  const proche = await apiRequest(`${ENDPOINTS.proches}/${id}`, {}, "Impossible de charger le proche.");
  await apiRequest(`${ENDPOINTS.proches}/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: false }) }, "Impossible d'archiver le proche.");
  if (proche?.utilisateurId) {
    await apiRequest(`${ENDPOINTS.utilisateurs}/${proche.utilisateurId}`, { method: "PATCH", body: JSON.stringify({ isActive: false }) }, "Impossible d'archiver le compte du proche.");
  }
}

export async function restoreProche(id) {
  const proche = await apiRequest(`${ENDPOINTS.proches}/${id}`, {}, "Impossible de charger le proche.");
  await apiRequest(`${ENDPOINTS.proches}/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }, "Impossible de restaurer le proche.");
  if (proche?.utilisateurId) {
    await apiRequest(`${ENDPOINTS.utilisateurs}/${proche.utilisateurId}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }, "Impossible de restaurer le compte du proche.");
  }
}

export async function deleteProcheDefinitif(id) {
  const proche = await apiRequest(`${ENDPOINTS.proches}/${id}`, {}, "Impossible de charger le proche.");
  await apiRequest(`${ENDPOINTS.proches}/${id}`, { method: "DELETE" }, "Impossible de supprimer le proche.");
  if (proche?.utilisateurId) {
    await apiRequest(`${ENDPOINTS.utilisateurs}/${proche.utilisateurId}`, { method: "DELETE" }, "Impossible de supprimer le compte du proche.");
  }
}