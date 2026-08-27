<script setup>
import { useDrawer } from '@/composables/useDrawer.js';

const { isOpen, component, props, title, icon, close } = useDrawer();

// Si le composant enfant émet un événement "success" ou "close", on ferme le drawer
function onChildSuccess() {
  close();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 bg-slate-950/50" @click="close"></div>
    </Transition>

    <Transition name="slide">
      <div v-if="isOpen" class="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between border-b border-slate-100 bg-[#333D2A] px-6 py-5">
          <div class="flex items-center gap-3 text-white">
            <i class="fa-solid" :class="icon"></i>
            <h2 class="text-lg font-black">{{ title }}</h2>
          </div>
          <button @click="close" class="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Corps (Contenu dynamique) -->
        <div class="flex-1 overflow-y-auto px-6 py-5">
          <!-- On rend le composant passé dynamiquement -->
          <component 
            :is="component" 
            v-bind="props" 
            @close="close" 
            @success="onChildSuccess" 
          />
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Animation du fondu pour l'arrière-plan */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Animation du glissement du panneau */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
