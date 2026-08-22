import { apiClient } from './apiClient.js';

export function getProches() {
  return apiClient.get('/proches');
}

export function getProcheByUtilisateurId(id) {
  return apiClient.get(`/proches?utilisateurId=${id}`);
}

export function createProche(data) {
  return apiClient.post('/proches', data);
}

export function updateProche(id, data) {
  return apiClient.patch(`/proches/${id}`, data);
}

export function deleteProche(id) {
  return apiClient.delete(`/proches/${id}`);
}