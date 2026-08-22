import { ref, shallowRef } from 'vue';
const isOpen = ref(false);
const component = shallowRef(null);
const props = ref({});
const title = ref('');
const icon = ref('');

export function useDrawer() {
  function open(comp, options = {}) {
    component.value = comp;
    title.value = options.title || '';
    icon.value = options.icon || 'fa-circle-info';
    props.value = options.props || {};
    isOpen.value = true;
  }
  function close() {
    isOpen.value = false;
    setTimeout(() => {
      component.value = null;
      props.value = {};
      title.value = '';
      icon.value = '';
    }, 300);
  }
  return { isOpen, component, props, title, icon, open, close };
}