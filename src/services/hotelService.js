import { apiClient } from './apiClient.js';

export function getHotels() {
  return apiClient.get('/hotels');
}

export function createHotel(data) {
  return apiClient.post('/hotels', data);
}