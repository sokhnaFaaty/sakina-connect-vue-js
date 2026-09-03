<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from '@/composables/useToast.js'
import { useDrawer } from '@/composables/useDrawer.js'
import { useTheme } from '@/composables/useTheme.js'
import { getNotifications, countUnseen, markSeen } from '@/services/notificationService.js'
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js'
import ProfilEditForm from '@/components/forms/ProfilEditForm.vue'

const ROLE_LABELS = {
  ADMIN: 'Admin',
  GUIDE: 'Guide',
  PELERIN: 'Pèlerin',
  PROCHE: 'Proche',
}

// Rôles disposant d'une page "Mon profil" complète (barre latérale).
// Pour eux, le bouton d'édition du menu y renvoie ; les autres (Admin, Guide)
// ouvrent un drawer d'édition légère.
const PROFILE_PAGE_BY_ROLE = {
  PELERIN: 'mon-profil',
  PROCHE: 'mon-profil-proche',
}

const router = useRouter()
const auth = useAuthStore()
const { success } = useToast()
const { open: ouvrirDrawer } = useDrawer()
const { isDark, toggleTheme } = useTheme()

const notifications = ref([])
const nonVues = ref(0)
const notifOuvert = ref(false)
const profilOuvert = ref(false)
const passeport = ref('')

const notifBtnRef = ref(null)
const profilBtnRef = ref(null)
const notifPanelRef = ref(null)
const profilPanelRef = ref(null)

const roleLabel = computed(() => ROLE_LABELS[auth.role] || auth.role || '')
const initiale = computed(() => auth.user?.nomComplet?.charAt(0).toUpperCase() || '?')

function formatDateNotif(d) {
  if (!d) return ''
  return String(d).slice(0, 16).replace('T', ' à ')
}

async function chargerNotifications() {
  try {
    const items = await getNotifications(auth.user, auth.role)
    notifications.value = items
    nonVues.value = countUnseen(items, auth.user.id)
  } catch {
    notifications.value = []
    nonVues.value = 0
  }
}

function toggleNotifs() {
  profilOuvert.value = false // un seul panneau ouvert à la fois
  if (!notifOuvert.value) {
    markSeen(auth.user.id) // ouvrir la cloche = tout marquer comme lu
    nonVues.value = 0
  }
  notifOuvert.value = !notifOuvert.value
}

function toggleProfil() {
  notifOuvert.value = false // un seul panneau ouvert à la fois
  if (!profilOuvert.value && auth.role === 'PELERIN' && !passeport.value) {
    // Le passeport n'existe que pour un pèlerin ; chargé à la volée sans retarder l'ouverture
    getPelerinByUtilisateurId(auth.user.id)
      .then((p) => { passeport.value = p?.numeroPasseport || '' })
      .catch(() => {})
  }
  profilOuvert.value = !profilOuvert.value
}

function aller(page) {
  fermerPanels()
  if (page) router.push('/' + page)
}

function modifierProfil() {
  fermerPanels()
  const dest = PROFILE_PAGE_BY_ROLE[auth.role]
  if (dest) {
    router.push('/' + dest)
    return
  }
  ouvrirDrawer(ProfilEditForm, {
    title: 'Modifier mon profil',
    icon: 'fa-user-pen',
    props: { user: { ...auth.user } },
  })
}

function deconnexion() {
  fermerPanels()
  auth.logout()
  router.replace('/login')
  success('Déconnexion réussie.')
}

function fermerPanels() {
  notifOuvert.value = false
  profilOuvert.value = false
}

function clicDehors(e) {
  const cible = e.target
  if (
    notifOuvert.value &&
    notifPanelRef.value && !notifPanelRef.value.contains(cible) &&
    notifBtnRef.value && !notifBtnRef.value.contains(cible)
  ) {
    notifOuvert.value = false
  }
  if (
    profilOuvert.value &&
    profilPanelRef.value && !profilPanelRef.value.contains(cible) &&
    profilBtnRef.value && !profilBtnRef.value.contains(cible)
  ) {
    profilOuvert.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', clicDehors)
  chargerNotifications()
})

onUnmounted(() => document.removeEventListener('click', clicDehors))
</script>

<template>
  <header class="flex h-16 shrink-0 items-center justify-between bg-[#333D2A] px-4">
    <div class="flex items-center gap-3">
      <i class="fa-solid fa-moon text-[#BC7B3B]"></i>
      <span class="font-display text-base font-black text-white">Sakina Connect</span>
    </div>

    <div class="flex items-center gap-2 sm:gap-4">
      <!-- Bascule Sombre / Clair -->
      <button
        @click="toggleTheme"
        class="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
        :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
      >
        <i class="fa-solid" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
      </button>

      <!-- Cloche de notifications -->
      <button
        ref="notifBtnRef"
        @click="toggleNotifs"
        class="relative flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
        aria-label="Notifications"
      >
        <i class="fa-solid fa-bell"></i>
        <span
          v-if="nonVues > 0"
          class="absolute right-1 top-1 min-w-[18px] rounded-full bg-[#B40909] px-1 text-center text-[10px] font-black leading-[18px] text-white"
        >{{ nonVues > 9 ? '9+' : nonVues }}</span>
      </button>

      <!-- Bouton utilisateur -->
      <button
        ref="profilBtnRef"
        @click="toggleProfil"
        class="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white/10"
        aria-label="Mon profil"
      >
        <div class="hidden text-right sm:block">
          <p class="text-sm font-bold text-white">{{ auth.user?.nomComplet }}</p>
          <span class="text-xs text-slate-300">{{ roleLabel }}</span>
        </div>
        <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-sm font-bold text-white">
          <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" class="h-full w-full object-cover" />
          <template v-else>{{ initiale }}</template>
        </div>
        <i class="fa-solid fa-chevron-down text-xs text-slate-300"></i>
      </button>
    </div>

    <!-- Panneau des notifications (fidèle au Vanilla : ancré sous la cloche) -->
    <div
      v-if="notifOuvert"
      ref="notifPanelRef"
      class="fixed right-3 top-16 z-[90] w-80 max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
    >
      <div class="flex items-center justify-between bg-[#333D2A] px-4 py-3 text-white">
        <span class="font-black">Notifications</span>
        <span class="text-xs text-slate-300">{{ notifications.length }}</span>
      </div>
      <div class="max-h-96 overflow-y-auto">
        <template v-if="notifications.length">
          <button
            v-for="item in notifications"
            :key="item.id"
            @click="aller(item.page)"
            class="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/50"
          >
            <span
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              :class="item.type === 'sos' ? 'bg-rose-100 text-rose-600' : 'bg-[#F2F2DE] text-[#333D2A] dark:bg-slate-700 dark:text-white'"
            >
              <i class="fa-solid" :class="item.icon"></i>
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="truncate font-bold text-slate-800 dark:text-slate-100">{{ item.titre }}</span>
                <span v-if="item.urgent" class="shrink-0 rounded-full bg-rose-100 px-1.5 text-[9px] font-black text-rose-700">URGENT</span>
              </span>
              <span class="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{{ item.sous }}</span>
              <span class="mt-0.5 block text-[10px] text-slate-400">{{ formatDateNotif(item.date) }}</span>            </span>
          </button>
        </template>
        <p v-else class="p-6 text-center text-sm text-slate-400 dark:text-slate-500">Aucune notification pour le moment.</p>
      </div>
    </div>

    <!-- Menu déroulant "Mon profil" (Avatar, Nom, Rôle, Email, Téléphone, actions) -->
    <div
      v-if="profilOuvert"
      ref="profilPanelRef"
      class="fixed right-3 top-16 z-[90] w-72 max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
    >
      <div class="flex flex-col items-center gap-2 bg-[#333D2A] px-4 py-5 text-center text-white">
        <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-xl font-black">
          <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" class="h-full w-full object-cover" />
          <template v-else>{{ initiale }}</template>
        </div>
        <div>
          <h3 class="text-base font-black">{{ auth.user?.nomComplet || '-' }}</h3>
          <span class="mt-1 inline-block rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold">{{ roleLabel }}</span>
        </div>
      </div>

      <div class="grid gap-2 p-4">
        <div class="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/40">
          <i class="fa-solid fa-envelope w-5 text-center text-[#333D2A] dark:text-[#BC7B3B]"></i>
          <div>
            <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Email</p>
            <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{{ auth.user?.email || '-' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/40">
          <i class="fa-solid fa-phone w-5 text-center text-[#333D2A] dark:text-[#BC7B3B]"></i>
          <div>
            <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Téléphone</p>
            <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{{ auth.user?.telephone || '-' }}</p>
          </div>
        </div>
        <div v-if="passeport" class="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <i class="fa-solid fa-passport w-5 text-center text-[#333D2A] dark:text-[#BC7B3B]"></i>
          <div>
            <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Passeport</p>
            <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{{ passeport }}</p>
          </div>
        </div>
      </div>

      <div class="grid gap-2 border-t border-slate-100 p-3 dark:border-slate-700">
        <button
          @click="modifierProfil"
          class="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
        >
          <i class="fa-solid fa-pen"></i> Modifier mon profil
        </button>
        <button
          @click="deconnexion"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FA0404] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
        >
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Déconnexion
        </button>
      </div>
    </div>
  </header>
</template>
