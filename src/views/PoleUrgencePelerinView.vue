<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getGuides } from '@/services/guideService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getSos, declencherSos } from '@/services/sosService.js'
import { useToast, useConfirm } from '@/composables/index.js'
import Pagination from '@/components/ui/Pagination.vue'

const RESOLUS_PAR_PAGE = 1

const NUMEROS_URGENCE = [
  { nom: 'Secours National Saoudien', detail: 'Aide Générale et Sécurité', numero: '911' },
  { nom: 'Secours National Saoudien', detail: 'Urgences médicales', numero: '997' },
  { nom: 'Ministère du Hajj', detail: 'Assistance pèlerinage', numero: '922002814' },
]

const auth = useAuthStore()
const toast = useToast()
const { askConfirmation } = useConfirm()

const chargement = ref(true)
const pelerin = ref(null)
const groupe = ref(null)
const guideUtilisateur = ref(null)
const sosActif = ref(null)
const sosResolus = ref([])

const pageResolus = ref(1)
const totalResolusPages = computed(() => Math.max(1, Math.ceil(sosResolus.value.length / RESOLUS_PAR_PAGE)))
const resolusPagines = computed(() => {
  const debut = (pageResolus.value - 1) * RESOLUS_PAR_PAGE
  return sosResolus.value.slice(debut, debut + RESOLUS_PAR_PAGE)
})
watch(totalResolusPages, (t) => { if (pageResolus.value > t) pageResolus.value = t })

async function charger() {
  chargement.value = true
  try {
    pelerin.value = await getPelerinByUtilisateurId(auth.user?.id)
    if (!pelerin.value) return

    const [groupes, guides, utilisateurs, tousLesSos] = await Promise.all([
      getGroupes(),
      getGuides(),
      getUtilisateurs(),
      getSos(),
    ])

    groupe.value = groupes.find((g) => g.id === pelerin.value.groupeId) || null
    const guide = groupe.value ? guides.find((g) => g.id === groupe.value.guideId) : null
    const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]))
    guideUtilisateur.value = guide ? utilisateurMap[guide.utilisateurId] || null : null

    const mesSos = tousLesSos.filter((s) => s.pelerinId === pelerin.value.id)
    sosActif.value = mesSos.find((s) => s.statut === 'EN_ATTENTE') || null
    sosResolus.value = mesSos.filter((s) => s.statut === 'RESOLU')
  } catch (e) {
    console.error(e)
    toast.error(e.message)
  } finally {
    chargement.value = false
  }
}

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
    toast.success("Alerte SOS envoyée. De l'aide arrive.")
    await charger()
  } catch (e) {
    toast.error(e.message)
  }
}

onMounted(charger)
</script>

<template>
  <section v-if="!chargement && !pelerin" class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
    <p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p>
  </section>

  <section v-else>
    <div class="mb-6 flex items-start gap-4 rounded-3xl bg-[#B40909] p-6 text-white shadow-sm sm:p-7">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><i class="fa-solid fa-shield-halved"></i></div>
      <div>
        <span class="mb-1 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">Pôle Assistance Secours</span>
        <h1 class="font-display text-2xl font-black sm:text-3xl">Mon Espace SOS</h1>
        <p class="mt-1 text-sm text-rose-100">Signalez instantanément votre position exacte si vous vous perdez ou si vous faites face à une urgence. L'agence interviendra à la seconde inshaAllah.</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div class="grid gap-6">
        <template v-if="sosActif">
          <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-base font-black text-slate-950">État de l'alerte active :</h2>
              <span class="text-xs text-slate-400">Date et Heure de l'alerte : {{ new Date(sosActif.dateHeure).toLocaleString('fr-FR') }}</span>
            </div>
            <span class="mb-4 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">En attente de secours</span>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Localisation déclarée :</p>
                <p class="mt-1 flex items-center gap-1 text-sm font-bold text-slate-800">
                  <i class="fa-solid fa-location-dot text-rose-500"></i> {{ sosActif.latitude.toFixed(4) }}, {{ sosActif.longitude.toFixed(4) }}
                </p>
                <p v-if="sosActif.commentaire" class="mt-1 text-xs italic text-slate-500">"{{ sosActif.commentaire }}"</p>
                <p class="mt-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Guide responsable :</p>
                <p class="mt-1 text-sm font-bold text-slate-800">{{ guideUtilisateur?.nomComplet || 'Non assigné' }}</p>
                <p class="text-xs text-slate-500">Guide Accompagnateur</p>
                <p v-if="guideUtilisateur?.telephone" class="mt-0.5 flex items-center gap-1 text-sm text-slate-600"><i class="fa-solid fa-phone text-rose-500"></i> {{ guideUtilisateur.telephone }}</p>
              </div>
              <div class="rounded-2xl bg-rose-50 p-4">
                <p class="text-xs font-extrabold uppercase tracking-widest text-rose-600">Commentaire et Actions :</p>
                <p class="mt-1 text-sm text-rose-700">L'admin et le guide ont été notifiés. Un premier commentaire de secours s'affichera ici dès qu'un membre de l'équipe aura débuté l'intervention.</p>
              </div>
            </div>

            <div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p class="mb-1 flex items-center gap-2 text-sm font-black text-amber-700">
                <i class="fa-solid fa-triangle-exclamation"></i> Que faire en attendant ?
              </p>
              <p class="text-sm text-amber-700">
                Reste là où tu es, si possible dans un endroit visible et sécurisé. Ne panique pas. Ton guide ou un membre
                de notre équipe d'assistance t'appellera sur ton téléphone ou te rejoindra directement aux coordonnées indiquées.
              </p>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col items-center gap-4 rounded-3xl border-2 border-rose-200 bg-rose-50 p-6 sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 class="flex items-center gap-2 text-lg font-black text-rose-700">
                <i class="fa-solid fa-shield-halved"></i> Aide d'urgence en Cas d'Égarement
              </h2>
              <p class="mt-1 max-w-xl text-sm text-rose-600">
                Si tu te perds dans la foule, perds de vue ton groupe, ou si tu as besoin d'une assistance immédiate,
                appuie sur le <strong>GRAND BOUTON ROUGE</strong>. Ton guide et le centre de contrôle seront alertés à l'instant.
              </p>
            </div>
            <button @click="lancerSos" class="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-rose-600 text-lg font-black text-white shadow-lg shadow-rose-300 transition hover:bg-rose-700 active:scale-95">
              SOS
            </button>
          </div>
        </template>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-base font-black text-slate-950">Mes SOS Précédents Résolus ({{ sosResolus.length }})</h2>
          <div class="grid gap-3">
            <p v-if="sosResolus.length === 0" class="text-sm text-slate-400">Aucun SOS résolu pour l'instant.</p>
            <template v-else>
              <div v-for="s in resolusPagines" :key="s.id" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div class="mb-1 flex items-center justify-between">
                  <span class="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-black text-slate-600">{{ s.id.slice(0, 6).toUpperCase() }}</span>
                  <span class="text-xs text-slate-400">{{ new Date(s.dateHeure).toLocaleString('fr-FR') }}</span>
                </div>
                <p class="flex items-center gap-1 text-sm text-slate-600"><i class="fa-solid fa-location-dot"></i> {{ s.latitude.toFixed(4) }}, {{ s.longitude.toFixed(4) }}</p>
              </div>
            </template>
          </div>
          <Pagination v-model:page="pageResolus" :total-pages="totalResolusPages" />
        </article>
      </div>

      <div class="grid gap-6">
        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-3 flex items-center gap-2 text-base font-black text-slate-950">
            <i class="fa-solid fa-user-shield text-[#333D2A]"></i> Mon guide
          </h2>
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
              <img v-if="guideUtilisateur?.photo" :src="guideUtilisateur.photo" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user"></i></div>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">{{ guideUtilisateur?.nomComplet || 'Non assigné' }}</p>
              <p class="text-xs text-slate-500">À votre écoute 24h/24</p>
            </div>
          </div>
          <p class="mt-3 text-xs text-slate-500">Votre guide spirituel et logistique dispose d'un accès à votre profil de santé et à votre contact d'urgence.</p>
          <a v-if="guideUtilisateur?.telephone" :href="`tel:${guideUtilisateur.telephone}`" class="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
            <i class="fa-solid fa-phone"></i> Appeler mon guide
          </a>
        </article>

        <article class="rounded-[2rem] bg-[#333D2A] p-6 text-white">
          <h2 class="mb-4 flex items-center gap-2 text-base font-black">
            <i class="fa-solid fa-phone-volume text-[#BC7B3B]"></i> Numéros d'Urgences Utiles
          </h2>
          <div class="grid gap-3">
            <div v-for="n in NUMEROS_URGENCE" :key="n.numero" class="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
              <div>
                <p class="text-sm font-bold">{{ n.nom }}</p>
                <p class="text-xs text-slate-300">{{ n.detail }}</p>
              </div>
              <span class="text-base font-black text-[#BC7B3B]">{{ n.numero }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
