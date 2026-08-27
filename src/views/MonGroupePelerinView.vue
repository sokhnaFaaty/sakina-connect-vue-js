<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js'
import { getProcheByPelerinId } from '@/services/procheService.js'
import { getUtilisateurById } from '@/services/utilisateurService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getPlanningDuGroupe } from '@/services/planningService.js'
import { getCategories } from '@/services/categorieService.js'
import { useToast } from '@/composables/index.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'

const PAR_PAGE = 2

const auth = useAuthStore()
const toast = useToast()

const chargement = ref(true)
const pelerin = ref(null)
const groupe = ref(null)
const planning = ref([])
const categorieMap = ref({})
const procheAssocie = ref(null)
const procheUser = ref(null)

const pageActuelle = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(planning.value.length / PAR_PAGE)))
const planningPagines = computed(() => {
  const debut = (pageActuelle.value - 1) * PAR_PAGE
  return planning.value.slice(debut, debut + PAR_PAGE)
})
watch(totalPages, (t) => { if (pageActuelle.value > t) pageActuelle.value = t })

const titre = computed(() => `Mon groupe${groupe.value?.nom ? ' : ' + groupe.value.nom : ''}`)

const badgesEtat = computed(() => [
  { label: 'Passeport', ok: !!pelerin.value?.numeroPasseport, texteOk: 'Complet' },
  { label: 'Visa de voyage', ok: pelerin.value?.statutVisa === 'APPROUVE', texteOk: 'Approuvé' },
  { label: 'Certification de vaccination', ok: !!pelerin.value?.certificatVaccin, texteOk: 'Valide' },
  { label: "Tenue d'Ihram emballée", ok: false, texteOk: '' },
])

function numeroJour(e) {
  const joursUniques = [...new Set(planning.value.map((x) => x.date))].sort()
  return joursUniques.indexOf(e.date) + 1
}

async function charger() {
  chargement.value = true
  try {
    pelerin.value = await getPelerinByUtilisateurId(auth.user?.id)
    if (!pelerin.value) return

    const groupeTrouve = (await getGroupes()).find((g) => g.id === pelerin.value.groupeId)
    if (!groupeTrouve) return

    const [planningData, categories] = await Promise.all([
      getPlanningDuGroupe(groupeTrouve.id),
      getCategories(),
    ])
    groupe.value = groupeTrouve
    planning.value = planningData
    categorieMap.value = Object.fromEntries(categories.map((c) => [c.id, c.libelle]))

    procheAssocie.value = await getProcheByPelerinId(pelerin.value.id)
    procheUser.value = procheAssocie.value ? await getUtilisateurById(procheAssocie.value.utilisateurId) : null
  } catch (e) {
    console.error(e)
    toast.error(e.message)
  } finally {
    chargement.value = false
  }
}
onMounted(charger)
</script>
<template>
  <section v-if="!chargement && !pelerin" class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
    <p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p>
  </section>

  <section v-else-if="!chargement && !groupe">
    <PageHeader kicker="Mon voyage" title="Mon groupe" subtitle="" />
    <div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Aucun groupe ne t'est encore assigné.</div>
  </section>

  <section v-else>
    <PageHeader kicker="Mon voyage" :title="titre" subtitle="Vos informations enregistrées et état de préparation." />

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <article class="rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-briefcase text-[#333D2A]"></i> Ma fiche Logistique</h2>

        <p class="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Identité & contact d'urgence</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl bg-[#F2F2DE]/60 p-4 text-sm">
            <p class="text-slate-500">Nom complet :</p>
            <p class="mb-2 font-bold text-slate-800">{{ auth.user?.nomComplet || '-' }}</p>
            <p class="text-slate-500">Identifiant pèlerin :</p>
            <p class="mb-2 font-bold text-slate-800">{{ (pelerin?.id || '').slice(0, 6).toUpperCase() }}</p>
            <p class="text-slate-500">Numéro de passeport :</p>
            <p class="mb-2 font-bold text-slate-800">{{ pelerin?.numeroPasseport || '-' }}</p>
            <template v-if="procheUser">
              <p class="text-slate-500">Contact d'urgence (proche) :</p>
              <p class="font-bold text-slate-800">{{ procheUser.nomComplet || '-' }}{{ procheAssocie?.lienParente ? ` (${procheAssocie.lienParente})` : '' }}</p>
              <p class="text-slate-600">{{ procheUser.telephone || '' }}</p>
            </template>
          </div>
          <div class="grid gap-3">
            <div v-for="b in badgesEtat" :key="b.label" class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span class="text-slate-600">{{ b.label }}</span>
              <span v-if="b.ok" class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> {{ b.texteOk }}</span>
              <span v-else class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-clock text-[#333D2A]"></i> Planning de voyages</h2>
        <div class="grid gap-3">
          <p v-if="planning.length === 0" class="text-sm text-slate-400">Aucun événement planifié pour l'instant.</p>
          <template v-else>
            <div v-for="e in planningPagines" :key="e.id" class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="mb-1 flex items-center justify-between gap-2">
                <span class="rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Jour {{ numeroJour(e) }}</span>
                <span v-if="categorieMap[e.categorieId]" class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{{ categorieMap[e.categorieId] }}</span>
              </div>
              <h3 class="font-black text-slate-900">{{ e.titre }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ e.description || '' }}</p>
              <p class="mt-2 flex items-center gap-1 text-xs text-slate-500"><i class="fa-solid fa-location-dot"></i> {{ e.lieu || '-' }} · {{ e.heure || '' }}</p>
            </div>
          </template>
        </div>
        <Pagination v-model:page="pageActuelle" :total-pages="totalPages" />
      </article>
    </div>
  </section>
</template>
