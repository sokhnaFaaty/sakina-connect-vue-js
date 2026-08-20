// src/composables/useConfirm.js
import { ref } from 'vue';

// État global partagé
const isOpen = ref(false);
const message = ref('');
let resolvePromise = null;

export function useConfirm() {
  function askConfirmation(msg) {
    message.value = msg;
    isOpen.value = true;
    // On retourne une Promise qui attend le clic de l'utilisateur
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }

  function confirm() {
    isOpen.value = false;
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;
    }
  }

  function cancel() {
    isOpen.value = false;
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
  }

  return {
    isOpen,      // Pour le `v-if` du composant ConfirmDialog
    message,     // Pour afficher le texte
    askConfirmation, // La fonction à appeler dans les vues : `const ok = await askConfirmation('...')`
    confirm,
    cancel,
  };
}