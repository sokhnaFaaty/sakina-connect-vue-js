import { apiClient } from './apiClient.js';

export function getSos() {
  return apiClient.get('/sos');
}

export function createSos(data) {
  return apiClient.post('/sos', data);
}

export function updateSos(id, data) {
  return apiClient.patch(`/sos/${id}`, data);
}

export function deleteSos(id) {
  return apiClient.delete(`/sos/${id}`);
}