import { apiClient } from './apiClient.js';

export async function login(email, password) {
  if (!email || !password) throw new Error("Email et mot de passe obligatoires.");
  return apiClient.post('/connecter', { email, motDePasse: password });
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}