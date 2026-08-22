<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppDrawer from '@/components/ui/AppDrawer.vue'

import AppSidebar from '@/components/layout/AppSideBar.vue'
import AppNavbar from '@/components/layout/AppNavBar.vue'

const auth = useAuthStore()
const isAuthenticated = computed(() => auth.isAuthenticated)
</script>

<template>
  <div class="min-h-screen bg-[#F2F2DE]">
    <!-- Layout Connecté : Sidebar à gauche, Navbar + Main à droite -->
    <div v-if="isAuthenticated" class="flex h-screen w-full overflow-hidden">
      <AppSidebar />

      <!-- Conteneur vertical : Navbar en haut, Main en dessous -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <AppNavbar />
        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <RouterView />
        </main>
      </div>
    </div>

    <!-- Page publique (Login/Register) : plein écran sans Sidebar/Navbar -->
    <RouterView v-else />

    <!-- Composants globaux -->
    <ToastContainer />
    <ConfirmDialog />
    <AppModal />
    <AppDrawer />
  </div>
</template>
