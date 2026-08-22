import { ref } from 'vue';
const isOpen = ref(false);
const message = ref('');
let resolvePromise = null;

export function useConfirm() {
  function askConfirmation(msg) {
    message.value = msg;
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
  return { isOpen, message, askConfirmation, confirm, cancel };
}