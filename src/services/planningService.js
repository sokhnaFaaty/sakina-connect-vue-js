import { apiClient } from './apiClient.js';

export function getPlanning() {
  return apiClient.get('/plannings');
}

export function createPlanningEvent(data) {
  return apiClient.post('/plannings', data);
}

export function updatePlanningEvent(id, data) {
  return apiClient.patch(`/plannings/${id}`, data);
}

export function deletePlanningEvent(id) {
  return apiClient.delete(`/plannings/${id}`);
}