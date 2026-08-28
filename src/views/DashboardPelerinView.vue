<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getGuides } from '@/services/guideService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getPlanningDuGroupe } from '@/services/planningService.js'
import { getSosActifDuPelerin, declencherSos } from '@/services/sosService.js'
import { useToast, useConfirm } from '@/composables/index.js'

const router = useRouter()
const auth = useAuthStore()
const { success, error } = useToast()
const { askConfirmation } = useConfirm()

const chargement = ref(true)
const pelerin = ref(null)
const groupe = ref(null)
const guide = ref(null)
const planning = ref([])
const sosActif = ref(null)
const prochainRituel = ref(null)

async function charger() {
  try {
    pelerin.value = await getPelerinByUtilisateurId(auth.user?.id)
    if (!pelerin.value) return

    const [groupes, guides, utilisateurs, planningData, sosData] = await Promise.all([
      getGroupes(),
      getGuides(),
      getUtilisateurs(),
      getPlanningDuGroupe(pelerin.value.groupeId),
      getSosActifDuPelerin(pelerin.value.id),
    ])

    groupe.value = groupes.find((g) => g.id === pelerin.value.groupeId)
    const guideObj = groupe.value ? guides.find((g) => g.id === groupe.value.guideId) : null
    guide.value = guideObj ? utilisateurs.find((u) => u.id === guideObj.utilisateurId) : null
    planning.value = planningData
    sosActif.value = sosData

    // Prochain rituel : premier événement futur, sinon le premier du planning
    const maintenant = new Date()
    prochainRituel.value = planning.value
      .filter((p) => new Date(`${p.date}T${p.heure}`) >= maintenant)
      .sort((a, b) => new Date(`${a.date}T${a.heure}`) - new Date(`${b.date}T${b.heure}`))[0]
      || planning.value[0] || null
  } catch (e) {
    error(e.message)
  } finally {
    chargement.value = false
  }
}
onMounted(charger)

async function lancerSos() {
  const ok = await askConfirmation("Ta position actuelle sera envoyée à ton guide et à l'administration. Confirmer l'envoi ?", {
    title: 'Déclencher une alerte SOS',
    confirmLabel: 'OUI, ENVOYER',
    cancelLabel: 'NON',
  })
  if (!ok) return

  try {
    await declencherSos({
      pelerinId: pelerin.value.id,
      guideId: groupe.value?.guideId || null,
      commentaire: '',
    })
    success('Alerte SOS envoyée. De l\'aide arrive.')
    sosActif.value = await getSosActifDuPelerin(pelerin.value.id)
  } catch (e) {
    error(e.message)
  }
}
</script>

<template>
  <!-- Garde : aucun profil pèlerin associé (fidèle au Vanilla) -->
  <section v-if="!chargement && !pelerin" class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
    <p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p>
  </section>

  <section v-else>
    <!-- Bannière d'accueil -->
    <div class="mb-6 rounded-3xl bg-[#333D2A] p-6 text-white shadow-sm sm:p-7">
      <p class="text-sm font-bold text-[#BC7B3B]">ASSALAMU ALAYKUM,</p>
      <h1 class="font-display text-2xl font-black sm:text-3xl">{{ auth.user?.nomComplet }}</h1>
      <p class="mt-1 text-sm text-slate-300">Votre guide pour l'Omra : {{ guide?.nomComplet || '-' }}</p>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-2">
      <!-- Carte 1 : Mon planning du jour -->
      <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F2DE] text-[#333D2A] dark:bg-slate-700/50 dark:text-[#BC7B3B]"><i class="fa-regular fa-clock"></i></div>
        <h2 class="font-black text-slate-950 dark:text-slate-100">1. Mon planning du jour</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Voir les horaires et les lieux de rencontre</p>
        <div v-if="prochainRituel" class="mt-3 rounded-xl bg-[#F2F2DE] p-3 dark:bg-slate-700/50">
          <p class="text-xs font-extrabold uppercase tracking-wider text-[#333D2A] dark:text-[#BC7B3B]">Prochain rituel :</p>
          <p class="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{{ prochainRituel.titre }} ({{ prochainRituel.lieu }}) à {{ prochainRituel.heure }}</p>
        </div>
        <p v-else class="mt-3 text-sm text-slate-400 dark:text-slate-500">Aucun événement à venir.</p>
      </div>

      <!-- Carte 2 : Contacter mon guide -->
      <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"><i class="fa-solid fa-phone"></i></div>
        <h2 class="font-black text-slate-950 dark:text-slate-100">2. Contacter mon guide</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Besoin d'aide ou égaré ? Parlez à l'Oustadh</p>
        <div class="mt-3 flex items-center justify-between rounded-xl bg-[#F2F2DE] p-3 dark:bg-slate-700/50">
          <div>
            <p class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ guide?.nomComplet || 'Non assigné' }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">Langues : Wolof - Français - Anglais</p>
          </div>
          <a :href="`tel:${guide?.telephone || ''}`" class="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            <i class="fa-solid fa-phone"></i> Appeler
          </a>
        </div>
      </div>
    </div>

    <!-- Zone SOS : état actif -->
    <div v-if="sosActif" class="rounded-3xl border-2 border-rose-300 bg-rose-50 p-6 text-center dark:border-rose-500/40 dark:bg-rose-500/10">
      <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white">
        <i class="fa-solid fa-triangle-exclamation text-xl"></i>
      </div>
      <h2 class="text-lg font-black text-rose-700 dark:text-rose-400">Alerte SOS en cours</h2>
      <p class="mt-1 text-sm text-rose-600 dark:text-rose-300">Ton guide et le centre de contrôle ont été alertés. Reste où tu es si possible, de l'aide arrive.</p>
      <button @click="router.push('/pole-urgence-pelerin')" class="mt-3 text-sm font-bold text-rose-700 underline dark:text-rose-400">Voir le détail dans Pôle d'Urgence SOS</button>
    </div>

    <!-- Zone SOS : déclenchement -->
    <div v-else class="flex flex-col items-center gap-4 rounded-3xl border-2 border-rose-200 bg-rose-50 p-6 sm:flex-row sm:justify-between sm:text-left dark:border-rose-500/40 dark:bg-rose-500/10">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-black text-rose-700 dark:text-rose-400">
          <i class="fa-solid fa-shield-halved"></i> Aide d'urgence en Cas d'Égarement
        </h2>
        <p class="mt-1 max-w-xl text-sm text-rose-600 dark:text-rose-300">
          Si tu te perds dans la foule, perds de vue ton groupe, ou si tu as besoin d'une assistance immédiate,
          appuie sur le <strong>GRAND BOUTON ROUGE</strong>. Ton guide et le centre de contrôle seront alertés à l'instant.
        </p>
      </div>
      <button
        @click="lancerSos"
        class="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-rose-600 text-lg font-black text-white shadow-lg shadow-rose-300 transition hover:bg-rose-700 active:scale-95"
      >
        SOS
      </button>
    </div>
  </section>
</template>
