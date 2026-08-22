<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { getProcheByUtilisateurId } from '@/services/procheService.js'
import { getPelerins, getGroupes, getGuides, getUtilisateurs, getSos } from '@/services/index.js'
import { useToast } from '@/composables/useToast.js'

// Port fidèle de js/pages/dashboardProchePage.js — Portail Famille & Suivi Sécurité (PROCHE)
const auth = useAuthStore()
const { error: toastError } = useToast()

const chargement = ref(true)
const messageInfo = ref(null) // 'sans-proche' | 'pelerin-introuvable'

const pelerin = ref(null)
const pelerinUtilisateur = ref(null)
const groupe = ref(null)
const guideUtilisateur = ref(null)
const sosActif = ref(null)

function heureSos(sos) {
  const t = new Date(sos.dateHeure)
  return Number.isNaN(t.getTime()) ? '-' : t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

async function charger() {
  chargement.value = true
  messageInfo.value = null
  try {
    const proche = await getProcheByUtilisateurId(auth.user.id)
    if (!proche) { messageInfo.value = 'sans-proche'; return }

    const [pels, groupes, guides, users, sos] = await Promise.all([
      getPelerins(), getGroupes(), getGuides(), getUtilisateurs(), getSos(),
    ])

    const utilisateurMap = Object.fromEntries(users.map((u) => [u.id, u]))
    const p = pels.find((x) => x.id === proche.pelerinId) || null
    if (!p) { messageInfo.value = 'pelerin-introuvable'; return }
    pelerin.value = p
    pelerinUtilisateur.value = utilisateurMap[p.utilisateurId] || null

    const g = groupes.find((x) => x.id === p.groupeId) || null
    groupe.value = g
    const guide = g ? guides.find((x) => x.id === g.guideId) : null
    guideUtilisateur.value = guide ? utilisateurMap[guide.utilisateurId] || null : null

    sosActif.value = sos.find((s) => s.pelerinId === p.id && s.statut === 'EN_ATTENTE') || null
  } catch (e) {
    toastError(e.message)
  } finally {
    chargement.value = false
  }
}
onMounted(charger)
</script>

<template>
  <section>
    <header class="mb-6 rounded-3xl bg-gradient-to-r from-[#1f4d3a] to-[#0B6E4F] p-6 text-white shadow-sm sm:p-7">
      <span class="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider">Portail Famille &amp; Suivi Sécurité</span>
      <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Assalamu alaykum {{ auth.user.nomComplet }}</h1>
      <p class="mt-1 max-w-2xl text-sm text-white/80">Bienvenue dans votre tableau de bord de sérénité. Suivez en direct le parcours spirituel et physique de votre proche.</p>
    </header>

    <div v-if="messageInfo === 'sans-proche'" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
      Aucun pèlerin associé à votre compte.
    </div>
    <div v-else-if="messageInfo === 'pelerin-introuvable'" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
      Le pèlerin suivi est introuvable.
    </div>

    <template v-else-if="pelerin">
      <p class="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Vous suivez actuellement</p>
      <div class="grid gap-4 lg:grid-cols-3">
        <article class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-user"></i> Pèlerin suivi</p>
          <p class="text-lg font-black text-slate-950">{{ pelerinUtilisateur?.nomComplet || '-' }}</p>
          <p class="mt-1 text-xs text-slate-500">ID : {{ String(pelerin.id).slice(0, 6).toUpperCase() }} &nbsp; Passeport : {{ pelerin.numeroPasseport }}</p>
          <p class="mt-4 text-xs text-slate-500">Statut de Sécurité :</p>
          <div class="mt-1">
            <span v-if="sosActif" class="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">Incident SOS Actif</span>
            <span v-else class="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Situation normale</span>
          </div>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-route"></i> Logistique &amp; Guide</p>
          <p class="text-sm text-slate-500">Groupe :</p>
          <p class="mb-2 font-bold text-slate-800">{{ groupe?.nom || '-' }}</p>
          <p class="text-sm text-slate-500">Guide responsable :</p>
          <p class="mb-3 font-bold text-slate-800">{{ guideUtilisateur?.nomComplet || '-' }}</p>
          <a
            v-if="guideUtilisateur?.telephone"
            :href="`tel:${guideUtilisateur.telephone}`"
            class="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
          ><i class="fa-solid fa-phone"></i> Appeler</a>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-circle-info"></i> État général</p>
          <p class="text-sm font-bold text-slate-800">Suivi de groupe standard</p>
          <p class="mt-1 text-sm text-slate-600">Le pèlerin suit actuellement le programme et les séances d'enseignements spirituels définis par son guide.</p>
        </article>
      </div>

      <!-- Bloc SOS actif -->
      <article v-if="sosActif" class="mt-6 rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
        <h2 class="flex items-center gap-2 text-base font-black text-rose-700"><i class="fa-solid fa-triangle-exclamation"></i> SOS ACTIF – ALERTE DÉCLENCHÉE</h2>
        <p class="mt-1 text-sm font-bold text-rose-600">Dernière localisation transmise exclusivement du SOS (ceci ne représente pas un suivi GPS continu).</p>
        <div class="mt-4 grid gap-4 rounded-2xl bg-white p-4 sm:grid-cols-3">
          <div>
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Latitude</p>
            <p class="font-bold text-slate-800">{{ sosActif.latitude ?? '-' }}</p>
          </div>
          <div>
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Longitude</p>
            <p class="font-bold text-slate-800">{{ sosActif.longitude ?? '-' }}</p>
          </div>
          <div>
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Heure</p>
            <p class="font-bold text-slate-800">{{ heureSos(sosActif) }}</p>
          </div>
        </div>
        <p class="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-rose-700">Statut : Le guide est en cours d'intervention</p>
      </article>

      <p class="mb-3 mt-6 text-xs font-extrabold uppercase tracking-widest text-slate-400">Aperçu administratif de préparation</p>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span class="text-slate-600">Passeport scanné</span>
          <span v-if="!!pelerin.numeroPasseport" class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Valide</span>
          <span v-else class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>
        </div>
        <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span class="text-slate-600">Visa Omra / Hajj</span>
          <span v-if="pelerin.statutVisa === 'APPROUVE'" class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Valide</span>
          <span v-else class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>
        </div>
        <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span class="text-slate-600">Vaccin obligatoire ACWY</span>
          <span v-if="!!pelerin.certificatVaccin" class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Valide</span>
          <span v-else class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>
        </div>
      </div>
    </template>
  </section>
</template>
