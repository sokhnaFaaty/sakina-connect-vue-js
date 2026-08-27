<script setup>
import { useModal } from '@/composables/useModal.js';
const { isOpen, component, props, title, close } = useModal();

function onChildSuccess() { close(); }
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" @click="close">
        <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" @click.stop>
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-xl font-black text-slate-950">{{ title }}</h2>
            <button @click="close" class="text-slate-400 hover:text-slate-700"><i class="fa-solid fa-xmark"></i></button>
          </div>
          
          <component :is="component" v-bind="props" @close="close" @success="onChildSuccess" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>