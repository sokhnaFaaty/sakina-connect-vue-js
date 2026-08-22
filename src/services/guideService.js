import { apiClient } from './apiClient.js';

export function getGuides() {
  return apiClient.get('/guides');
}

export function getGuideByUtilisateurId(utilisateurId) {
  return apiClient.get(`/guides?utilisateurId=${utilisateurId}`);
}

export function createGuide(data) {
  return apiClient.post('/guides', data);
}

export function updateGuide(id, data) {
  return apiClient.patch(`/guides/${id}`, data);
}

export function deleteGuide(id) {
  return apiClient.delete(`/guides/${id}`);
}