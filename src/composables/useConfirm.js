import { ref } from 'vue';

const isOpen = ref(false);
const message = ref('');
const titre = ref('Confirmer la suppression');
const labelConfirmer = ref('OUI');
const labelAnnuler = ref('NON');
let resolvePromise = null;

export function useConfirm() {
  function askConfirmation(msg, options = {}) {
    message.value = msg;
    titre.value = options.title || 'Confirmer la suppression';
    labelConfirmer.value = options.confirmLabel || 'OUI';
    labelAnnuler.value = options.cancelLabel || 'NON';
    isOpen.value = true;
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
    isOpen,
    message,
    titre,
    labelConfirmer,
    labelAnnuler,
    askConfirmation,
    confirm,
    cancel,
  };
}
