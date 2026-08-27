// L'URL du backend est fournie via la variable d'environnement VITE_API_URL
// (fichier .env local, jamais versionné, ou variables d'environnement Vercel).
// Aucune URL de production n'est codée en dur ici pour des raisons de sécurité.
const API_URL_DEFAUT = "https://backendsakinaconnectapi.onrender.com/";

export const API_BASE_URL = import.meta.env.VITE_API_URL || API_URL_DEFAUT;

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