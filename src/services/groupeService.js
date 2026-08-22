import { apiClient } from './apiClient.js';

export function getGroupes() {
  return apiClient.get('/groupes');
}

export function createGroupe(data) {
  return apiClient.post('/groupes', data);
}

export function updateGroupe(id, data) {
  return apiClient.patch(`/groupes/${id}`, data);
}

export function deleteGroupe(id) {
  return apiClient.delete(`/groupes/${id}`);
}