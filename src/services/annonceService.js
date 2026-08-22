import { apiClient } from './apiClient.js';

export function getAnnonces() {
  return apiClient.get('/annonces');
}

export function createAnnonce(data) {
  return apiClient.post('/annonces', data);
}

export function updateAnnonce(id, data) {
  return apiClient.patch(`/annonces/${id}`, data);
}

export function deleteAnnonce(id) {
  return apiClient.delete(`/annonces/${id}`);
}