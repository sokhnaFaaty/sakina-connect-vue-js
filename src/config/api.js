const EN_LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);

// On lit la variable d'environnement. Si elle est absente (undefined), 
// on utilise http://localhost:3000 par défaut pour le développement local.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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