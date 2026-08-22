import { ref } from 'vue';
const toasts = ref([]);
let nextId = 0;

export function useToast() {
  const success = (msg) => addToast(msg, 'success');
  const error = (msg) => addToast(msg, 'error');
  const warning = (msg) => addToast(msg, 'warning');
  const info = (msg) => addToast(msg, 'info');

  function addToast(message, type = 'success') {
    const id = nextId++;
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id);
    }, 3000);
  }

  return { toasts, success, error, warning, info };
}