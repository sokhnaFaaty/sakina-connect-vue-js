// src/composables/useToast.js
import { ref } from 'vue';

// Liste globale partagée par toute l'application
const toasts = ref([]);
let nextId = 0;

function addToast(message, type = 'success') {
  const id = nextId++;
  toasts.value.push({ id, message, type });

  // Supprime automatiquement le toast après 3 secondes
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
}

export function useToast() {
  return {
    toasts, // La liste réactive
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  };
}