// src/services/authService.js (Version épurée)
import { ENDPOINTS } from "../config/api.js";

export async function login(email, password) {
  if (!email || !password) {
    throw new Error("Email et mot de passe obligatoires.");
  }

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

  // ⚠️ SUPPRIME `saveSession` ici. On renvoie juste les données au Store.
  // const { token, user } = donnees;
  // saveSession(user, token); // <--- À ENLEVER
  
  // Le Store se chargera de persister le token et l'utilisateur.
  return donnees; 
}