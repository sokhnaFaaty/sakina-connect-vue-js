<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppDrawer from '@/components/ui/AppDrawer.vue'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppBottomBar from '@/components/layout/AppBottomBar.vue'

const auth = useAuthStore()
const isAuthenticated = computed(() => auth.isAuthenticated)
</script>

<template>
  <div class="min-h-screen bg-[#F2F2DE]">
    <!-- Layout Connecté -->
    <div v-if="isAuthenticated" class="flex h-screen flex-col">
      
      <!-- Navbar en HAUT (pleine largeur) -->
      <AppNavbar />

      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar : gère elle-même sa visibilité (cachée sur mobile uniquement) -->
        <AppSidebar />

        <!-- Contenu principal (à droite de la sidebar) -->
        <main class="flex-1 overflow-y-auto p-4 pb-24 lg:p-8">
          <RouterView />
        </main>
      </div>

      <!-- BottomBar visible sur mobile (< lg), cachée sur desktop -->
      <AppBottomBar class="lg:hidden" />
    </div>

    <!-- Page publique (Login) -->
    <div v-else class="min-h-screen">
      <RouterView />
    </div>

    <ToastContainer />
    <ConfirmDialog />
    <AppModal />
    <AppDrawer />
  </div>
</template>