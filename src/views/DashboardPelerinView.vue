<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getGuides } from '@/services/guideService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getPlanning } from '@/services/planningService.js'
import { getSos, createSos } from '@/services/sosService.js'
import { useToast, useConfirm } from '@/composables/index.js'

// Port fidèle de js/pages/dashboardPelerinPage.js
const router = useRouter()
const auth = useAuthStore()
const { success, error: toastError } = useToast()
const { askConfirmation } = useConfirm()

const chargement = ref(true)
const messageInfo = ref(false) // aucun profil pèlerin

const pelerin = ref(null)
const groupe = ref(null)
const guideUtilisateur = ref(null)
const prochainRituel = ref(null)
const sosActif = ref(null)

async function charger() {
  chargement.value = true
  messageInfo.value = false
  try {
    const profil = await getPelerinByUtilisateurId(auth.user.id)
    if (!profil) { messageInfo.value = true; return }
    pelerin.value = Array.isArray(profil) ? profil[0] : profil

    const [groupes, guides, utilisateurs, planning, sos] = await Promise.all([
      getGroupes(),
      getGuides(),
      getUtilisateurs(),
      getPlanning(),
      getSos(),
    ])

    groupe.value = groupes.find((g) => g.id === pelerin.value.groupeId) || null
    const guide = groupe.value ? guides.find((g) => g.id === groupe.value.guideId) : null
    const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]))
    guideUtilisateur.value = guide ? utilisateurMap[guide.utilisateurId] || null : null

    // Prochain rituel : premier événement futur, sinon le premier du planning
    const duGroupe = planning
      .filter((p) => p.groupeId === pelerin.value.groupeId)
      .sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`))
    const maintenant = new Date()
    prochainRituel.value =
      duGroupe.find((p) => new Date(`${p.date}T${p.heure}`) >= maintenant) || duGroupe[0] || null

    sosActif.value = sos.find((s) => s.pelerinId === pelerin.value.id && s.statut === 'EN_ATTENTE') || null
  } catch (e) {
    toastError(e.message)
  } finally {
    chargement.value = false
  }
}
onMounted(charger)

async function declencherSos() {
  if (!await askConfirmation('Ta position actuelle sera envoyée à ton guide et à l\'administration. Confirmer l\'envoi ?')) return
  try {
    await createSos({
      pelerinId: pelerin.value.id,
      guideId: groupe.value?.guideId || null,
      commentaire: '',
      latitude: 0,
      longitude: 0,
      statut: 'EN_ATTENTE',
    })
    success('Alerte SOS envoyée. De l\'aide arrive.')
    await charger()
  } catch (e) {
    toastError(e.message)
  }
}
</script>

<template>
  <!-- Aucun profil pèlerin -->
  <section v-if="messageInfo" class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
    <p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p>
  </section>

  <section v-else>
    <div class="mb-6 rounded-3xl bg-[#333D2A] p-6 text-white shadow-sm sm:p-7">
      <p class="text-sm font-bold text-[#BC7B3B]">ASSALAMU ALAYKUM,</p>
      <h1 class="font-display text-2xl font-black sm:text-3xl">{{ auth.user.nomComplet }}</h1>
      <p class="mt-1 text-sm text-slate-300">Votre guide pour l'Omra : {{ guideUtilisateur?.nomComplet || '-' }}</p>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-2">
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F2DE] text-[#333D2A]"><i class="fa-regular fa-clock"></i></div>
        <h2 class="font-black text-slate-950">1. Mon planning du jour</h2>
        <p class="text-xs text-slate-500">Voir les horaires et les lieux de rencontre</p>
        <div v-if="prochainRituel" class="mt-3 rounded-xl bg-[#F2F2DE] p-3">
          <p class="text-xs font-extrabold uppercase tracking-wider text-[#333D2A]">Prochain rituel :</p>
          <p class="mt-1 text-sm font-bold text-slate-800">{{ prochainRituel.titre }} ({{ prochainRituel.lieu }}) à {{ prochainRituel.heure }}</p>
        </div>
        <p v-else class="mt-3 text-sm text-slate-400">Aucun événement à venir.</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><i class="fa-solid fa-phone"></i></div>
        <h2 class="font-black text-slate-950">2. Contacter mon guide</h2>
        <p class="text-xs text-slate-500">Besoin d'aide ou égaré ? Parlez à l'Oustadh</p>
        <div class="mt-3 flex items-center justify-between rounded-xl bg-[#F2F2DE] p-3">
          <div>
            <p class="text-sm font-bold text-slate-800">{{ guideUtilisateur?.nomComplet || 'Non assigné' }}</p>
            <p class="text-xs text-slate-500">Langues : Wolof - Français - Anglais</p>
          </div>
          <a
            :href="`tel:${guideUtilisateur?.telephone || ''}`"
            class="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <i class="fa-solid fa-phone"></i> Appeler
          </a>
        </div>
      </div>
    </div>

    <!-- Zone SOS -->
    <div v-if="sosActif" class="rounded-3xl border-2 border-rose-300 bg-rose-50 p-6 text-center">
      <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white">
        <i class="fa-solid fa-triangle-exclamation text-xl"></i>
      </div>
      <h2 class="text-lg font-black text-rose-700">Alerte SOS en cours</h2>
      <p class="mt-1 text-sm text-rose-600">Ton guide et le centre de contrôle ont été alertés. Reste où tu es si possible, de l'aide arrive.</p>
      <button type="button" class="mt-3 text-sm font-bold text-rose-700 underline" @click="router.push('/pole-urgence-pelerin')">Voir le détail dans Pôle d'Urgence SOS</button>
    </div>

    <div v-else class="flex flex-col items-center gap-4 rounded-3xl border-2 border-rose-200 bg-rose-50 p-6 sm:flex-row sm:justify-between sm:text-left">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-black text-rose-700">
          <i class="fa-solid fa-shield-halved"></i> Aide d'urgence en Cas d'Égarement
        </h2>
        <p class="mt-1 max-w-xl text-sm text-rose-600">
          Si tu te perds dans la foule, perds de vue ton groupe, ou si tu as besoin d'une assistance immédiate,
          appuie sur le <strong>GRAND BOUTON ROUGE</strong>. Ton guide et le centre de contrôle seront alertés à l'instant.
        </p>
      </div>
      <button
        type="button"
        class="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-rose-600 text-lg font-black text-white shadow-lg shadow-rose-300 transition hover:bg-rose-700 active:scale-95"
        @click="declencherSos"
      >
        SOS
      </button>
    </div>
  </section>
</template>
