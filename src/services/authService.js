import { ENDPOINTS } from "../config/api.js";
import { saveSession, clearSession } from "../utils/auth.js";

export async function login(email, password) {
  if (!email || !password) {
    throw new Error("Email et mot de passe obligatoires.");
  }

  // Le backend vérifie le mot de passe haché (bcrypt) et renvoie un JWT.
  // La comparaison ne se fait plus côté navigateur.
  let response;
  try {
    response = await fetch(ENDPOINTS.connexion, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse: password }),
    });
  } catch {
    throw new Error("Serveur injoignable. Vérifie que le backend est démarré.");
  }

  const donnees = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(donnees?.erreur ?? "Email ou mot de passe incorrect.");
  }

  const { token, user } = donnees;
  saveSession(user, token);

  return user;
}

export function logout() {
  clearSession();
  window.location.href = window.location.pathname;
}
