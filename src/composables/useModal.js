import { ref, shallowRef } from 'vue';
const isOpen = ref(false);
const component = shallowRef(null);
const props = ref({});
const title = ref('');

export function useModal() {
  function open(comp, options = {}) {
    component.value = comp;
    title.value = options.title || '';
    props.value = options.props || {};
    isOpen.value = true;
  }
  function close() {
    isOpen.value = false;
    setTimeout(() => {
      component.value = null;
      props.value = {};
      title.value = '';
    }, 300);
  }
  return { isOpen, component, props, title, open, close };
}