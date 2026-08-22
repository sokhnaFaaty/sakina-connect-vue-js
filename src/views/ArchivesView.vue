<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast, useConfirm } from '@/composables/index.js'
import { apiClient } from '@/services/apiClient.js'
import PageHeader from '@/components/ui/PageHeader.vue'

// Port fidèle de js/pages/archivesPage.js
// Les aides d'archivage du Vanilla (getXxxArchives / restoreXxx / deleteXxxDefinitif)
// sont reimplementées ici : les services Vue restent du CRUD simple.
const { success, error: toastError } = useToast()
const { askConfirmation } = useConfirm()

const pelerinsArchives = ref([])
const guidesArchives = ref([])
const groupesArchives = ref([])
const prochesArchives = ref([])
const utilisateurs = ref([])

async function charger() {
  try {
    const [pel, gui, grp, pro, us] = await Promise.all([
      apiClient.get('/pelerins'), apiClient.get('/guides'), apiClient.get('/groupes'), apiClient.get('/proches'),
      apiClient.get('/utilisateurs'),
    ])
    pelerinsArchives.value = pel.filter((p) => p.isActive === false)
    guidesArchives.value = gui.filter((g) => g.isActive === false)
    groupesArchives.value = grp.filter((g) => g.isActive === false)
    prochesArchives.value = pro.filter((p) => p.isActive === false)
    utilisateurs.value = us
  } catch (e) { toastError(e.message) }
}
onMounted(charger)

const um = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])))

const onglets = computed(() => ({
  pelerins: {
    label: 'Pèlerins', icon: 'fa-users',
    items: pelerinsArchives.value,
    chemin: '/pelerins',
    nom: (p) => um.value[p.utilisateurId]?.nomComplet || '-',
    sous: (p) => `Passeport : ${p.numeroPasseport || '-'}`,
  },
  guides: {
    label: 'Guides', icon: 'fa-user-tie',
    items: guidesArchives.value,
    chemin: '/guides',
    nom: (g) => um.value[g.utilisateurId]?.nomComplet || '-',
    sous: () => 'Guide',
  },
  groupes: {
    label: 'Groupes', icon: 'fa-people-group',
    items: groupesArchives.value,
    chemin: '/groupes',
    nom: (g) => g.nom || '-',
    sous: (g) => `ID : ${String(g.id).slice(0, 6).toUpperCase()}`,
  },
  proches: {
    label: 'Proches', icon: 'fa-hand-holding-heart',
    items: prochesArchives.value,
    chemin: '/proches',
    nom: (p) => um.value[p.utilisateurId]?.nomComplet || '-',
    sous: (p) => `Lien : ${p.lienParente || '-'}`,
  },
}))

const actif = ref('pelerins')
const search = ref('')

const itemsFiltres = computed(() => {
  const o = onglets.value[actif.value]
  const q = search.value.toLowerCase()
  return o.items.filter((it) => !q || `${o.nom(it)} ${o.sous(it)}`.toLowerCase().includes(q))
})

function libelleRestaure(label) {
  return `${label.slice(0, -1)} restauré(e).`
}

async function restaurerItem(it) {
  const o = onglets.value[actif.value]
  try {
    // Fiche (PATCH partiel, comme le Vanilla)
    await apiClient.patch(`${o.chemin}/${it.id}`, { isActive: true })
    // Compte utilisateur lié (pèlerin, guide, proche) — pas pour les groupes
    if (it.utilisateurId) {
      await apiClient.patch(`/utilisateurs/${it.utilisateurId}`, { isActive: true })
    }
    success(libelleRestaure(o.label))
    await charger()
  } catch (e) { toastError(e.message) }
}

async function supprimerDefinitivement(it) {
  const o = onglets.value[actif.value]
  if (!await askConfirmation('Cette action est irréversible. Supprimer définitivement cet élément (et son compte lié le cas échéant) ?')) return
  try {
    await apiClient.delete(`${o.chemin}/${it.id}`)
    if (it.utilisateurId) {
      await apiClient.delete(`/utilisateurs/${it.utilisateurId}`)
    }
    success('Élément supprimé définitivement.')
    await charger()
  } catch (e) { toastError(e.message) }
}
</script>

<template>
  <section>
    <PageHeader kicker="Corbeille" title="Liste des Archives" subtitle="Gérez les fiches supprimées temporairement (soft delete). Restaurez-les ou supprimez-les définitivement." />

    <div class="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(o, key) in onglets"
          :key="key"
          type="button"
          class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition"
          :class="actif === key ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          @click="actif = key"
        >
          <i class="fa-solid" :class="o.icon"></i> {{ o.label }} archivés ({{ o.items.length }})
        </button>
      </div>
      <div class="relative sm:w-72">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input v-model="search" type="text" placeholder="Rechercher…" class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm" />
      </div>
    </div>

    <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div v-if="itemsFiltres.length" class="grid gap-3">
        <div v-for="it in itemsFiltres" :key="it.id" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div>
            <p class="font-bold text-slate-800">{{ onglets[actif].nom(it) }}</p>
            <p class="text-xs text-slate-500">{{ onglets[actif].sous(it) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600" @click="restaurerItem(it)">
              <i class="fa-solid fa-rotate-left"></i> Restaurer
            </button>
            <button type="button" class="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700" @click="supprimerDefinitivement(it)">
              <i class="fa-solid fa-trash"></i> Supprimer définitivement
            </button>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center gap-2 py-10 text-center text-sm text-slate-400">
        <i class="fa-solid fa-box-archive text-2xl"></i>
        <p>Aucun élément archivé dans « {{ onglets[actif].label }} ».</p>
      </div>
    </div>
  </section>
</template>
