import { apiClient } from './apiClient.js';

export function getPelerins() {
  return apiClient.get('/pelerins');
}

export function getPelerinByUtilisateurId(id) {
  return apiClient.get(`/pelerins?utilisateurId=${id}`);
}

export function createPelerin(data) {
  return apiClient.post('/pelerins', data);
}

export function updatePelerin(id, data) {
  return apiClient.patch(`/pelerins/${id}`, data);
}

export function deletePelerin(id) {
  return apiClient.delete(`/pelerins/${id}`);
}