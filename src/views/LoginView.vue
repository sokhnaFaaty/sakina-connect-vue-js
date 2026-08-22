<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { AppInput, AppButton } from '@/components/ui/index.js'
import { showError, hideError } from '@/utils/formValidator.js'
import { validateLoginEmail, validateLoginPassword } from '@/utils/validators.js'

const email = ref('')
const password = ref('')
const chargement = ref(false)
const erreur = ref('')
const router = useRouter()
const auth = useAuthStore()

async function handleLogin() {
  erreur.value = ''
  const emailError = validateLoginEmail(email.value)
  const passwordError = validateLoginPassword(password.value)
  if (emailError || passwordError) {
    erreur.value = emailError || passwordError
    return
  }

  chargement.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/') // ou la page selon le rôle
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
    <!-- Colonne gauche -->
    <div class="relative flex flex-col justify-center overflow-hidden p-8 text-white lg:p-14"
         style="background-image: linear-gradient(rgba(35,42,27,.82), rgba(35,42,27,.94)), url('@/assets/CouvertureLogin.jpg'); background-size: cover; background-position: center;">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-moon text-2xl text-[#BC7B3B]"></i>
        <span class="text-2xl font-black">Sakina <span class="text-[#BC7B3B]">Connect</span></span>
      </div>
      <h1 class="mt-10 max-w-lg text-3xl font-black leading-tight lg:text-4xl">La sérénité au cœur de votre pèlerinage</h1>
      <p class="mt-4 max-w-md text-slate-200">Plateforme de gestion des voyages Omra & Hajj : suivi des pèlerins et des groupes, itinéraires, annonces et assistance SOS géolocalisée.</p>
      <ul class="mt-10 grid max-w-md gap-3">
        <li class="flex items-center gap-3"><span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BC7B3B]/20 text-[#BC7B3B]"><i class="fa-solid fa-users"></i></span><span class="text-sm text-slate-200">Suivi des pèlerins, guides et groupes</span></li>
        <li class="flex items-center gap-3"><span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BC7B3B]/20 text-[#BC7B3B]"><i class="fa-solid fa-route"></i></span><span class="text-sm text-slate-200">Itinéraires et rituels planifiés</span></li>
        <li class="flex items-center gap-3"><span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BC7B3B]/20 text-[#BC7B3B]"><i class="fa-solid fa-triangle-exclamation"></i></span><span class="text-sm text-slate-200">Assistance SOS géolocalisée</span></li>
        <li class="flex items-center gap-3"><span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BC7B3B]/20 text-[#BC7B3B]"><i class="fa-solid fa-hand-holding-heart"></i></span><span class="text-sm text-slate-200">Portail famille pour les proches</span></li>
      </ul>
    </div>

    <!-- Colonne droite -->
    <div class="flex items-center justify-center bg-[#F2F2DE] p-6 sm:p-10 lg:p-14">
      <div class="w-full max-w-md">
        <h2 class="text-2xl font-black text-[#333D2A]">Connexion</h2>
        <p class="mt-1 text-sm text-slate-500">Accédez à votre espace personnel.</p>
        <div v-if="erreur" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          <i class="fa-solid fa-circle-exclamation mr-2"></i>{{ erreur }}
        </div>
        <form @submit.prevent="handleLogin" class="mt-6 grid gap-4">
          <AppInput v-model="email" label="Adresse email" type="email" placeholder="nom@gmail.com" autocomplete="email" />
          <AppInput v-model="password" label="Mot de passe" type="password" placeholder="••••••••••••" autocomplete="current-password" />
          <AppButton type="submit" variant="primary" :disabled="chargement" class="mt-2 w-full justify-center">
            <span v-if="chargement" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            {{ chargement ? 'Connexion...' : 'Se connecter' }}
          </AppButton>
        </form>
      </div>
    </div>
  </div>
</template>