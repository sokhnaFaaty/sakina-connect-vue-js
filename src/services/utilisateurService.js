import { apiClient } from './apiClient.js';

export function getUtilisateurs() {
  return apiClient.get('/utilisateurs');
}

export function updateUtilisateur(id, data) {
  return apiClient.patch(`/utilisateurs/${id}`, data);
}