// L'URL du backend dépend de l'endroit d'où la page est servie :
// en local on tape le serveur local, en ligne on tape celui de Render.
const EN_LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const API_BASE_URL = EN_LOCAL
  ? "http://localhost:3000"
  : "https://backendsakinaconnectapi.onrender.com";

export const ENDPOINTS = {
  utilisateurs: `${API_BASE_URL}/utilisateurs`,
  guides: `${API_BASE_URL}/guides`,
  pelerins: `${API_BASE_URL}/pelerins`,
  proches: `${API_BASE_URL}/proches`,
  groupes: `${API_BASE_URL}/groupes`,
  hotels: `${API_BASE_URL}/hotels`,
  categories: `${API_BASE_URL}/categories`,
  planning: `${API_BASE_URL}/plannings`,
  annonces: `${API_BASE_URL}/annonces`,
  sos: `${API_BASE_URL}/sos`,
  admins: `${API_BASE_URL}/admins`,
  connexion: `${API_BASE_URL}/connecter`,
};