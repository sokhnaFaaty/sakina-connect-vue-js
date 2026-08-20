<script setup>
import { ref, computed } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import ToastContainer from '@/components/ui/ToastContainer.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppDrawer from '@/components/ui/AppDrawer.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppNavbar from '@/components/layout/AppNavbar.vue';

const auth = useAuthStore();
const isAuthenticated = computed(() => auth.isAuthenticated);
const sidebarOpen = ref(false);
</script>
<template>
  <div class="min-h-screen bg-[#F2F2DE] font-sans text-slate-900">
    <div v-if="isAuthenticated" class="fixed inset-0 flex">
      <AppSidebar v-model:open="sidebarOpen" />
      <div class="flex flex-1 flex-col overflow-hidden">
        <AppNavbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:pl-8">
          <RouterView />
        </main>
      </div>
    </div>
    <div v-else class="min-h-screen">
      <RouterView />
    </div>
    <ToastContainer />
    <ConfirmDialog />
    <AppModal />
    <AppDrawer />
  </div>
</template>