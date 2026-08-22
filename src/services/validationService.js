import { apiClient } from './apiClient.js';

export function emailExiste(email) {
  return apiClient.get(`/utilisateurs?email=${email}`);
}

export function telephoneExiste(telephone) {
  return apiClient.get(`/utilisateurs?telephone=${telephone}`);
}

export function passeportExiste(numeroPasseport) {
  return apiClient.get(`/pelerins?numeroPasseport=${numeroPasseport}`);
}