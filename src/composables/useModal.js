// src/composables/useModal.js
import { ref, shallowRef } from 'vue';

// `shallowRef` est important pour stocker un composant Vue sans rendre réactif tout son intérieur
const isOpen = ref(false);
const component = shallowRef(null);
const props = ref({});
const title = ref('');

export function useModal() {
  function open(componentToMount, options = {}) {
    component.value = componentToMount;
    title.value = options.title || '';
    props.value = options.props || {};
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
    // On nettoie les données après fermeture
    setTimeout(() => {
      component.value = null;
      props.value = {};
      title.value = '';
    }, 300);
  }

  return {
    isOpen,
    component, // Le composant dynamique à rendre
    props,     // Ses props (ex: `{ groupe, onSucces }`)
    title,
    open,
    close,
  };
}