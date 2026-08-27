<script setup>
import { ref, computed, onMounted } from 'vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { useToast, useConfirm } from '@/composables/index.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getPelerinsArchives, restorePelerin, deletePelerinDefinitif } from '@/services/pelerinService.js';
import { getGuidesArchives, restoreGuide, deleteGuideDefinitif } from '@/services/guideService.js';
import { getGroupesArchives, restoreGroupe, deleteGroupeDefinitif } from '@/services/groupeService.js';
import { getProchesArchives, restoreProche, deleteProcheDefinitif } from '@/services/procheService.js';

const { success, error } = useToast();
const { askConfirmation } = useConfirm();

const pelerins = ref([]);
const guides = ref([]);
const groupes = ref([]);
const proches = ref([]);
const utilisateurs = ref([]);

const activeTab = ref('pelerins');
const recherche = ref('');

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])));

const onglets = computed(() => ({
  pelerins: {
    label: 'Pèlerins',
    icon: 'fa-users',
    items: pelerins.value,
    nom: (p) => utilisateurMap.value[p.utilisateurId]?.nomComplet || '-',
    sous: (p) => `Passeport : ${p.numeroPasseport || '-'}`,
    restore: restorePelerin,
    del: deletePelerinDefinitif,
  },
  guides: {
    label: 'Guides',
    icon: 'fa-user-tie',
    items: guides.value,
    nom: (g) => utilisateurMap.value[g.utilisateurId]?.nomComplet || '-',
    sous: () => 'Guide',
    restore: restoreGuide,
    del: deleteGuideDefinitif,
  },
  groupes: {
    label: 'Groupes',
    icon: 'fa-people-group',
    items: groupes.value,
    nom: (g) => g.nom || '-',
    sous: (g) => `ID : ${g.id.slice(0, 6).toUpperCase()}`,
    restore: restoreGroupe,
    del: deleteGroupeDefinitif,
  },
  proches: {
    label: 'Proches',
    icon: 'fa-hand-holding-heart',
    items: proches.value,
    nom: (p) => utilisateurMap.value[p.utilisateurId]?.nomComplet || '-',
    sous: (p) => `Lien : ${p.lienParente || '-'}`,
    restore: restoreProche,
    del: deleteProcheDefinitif,
  },
}));

const ongletActif = computed(() => onglets.value[activeTab.value]);

const itemsFiltres = computed(() => {
  const o = ongletActif.value;
  const q = recherche.value.trim().toLowerCase();
  return o.items.filter((it) => !q || `${o.nom(it)} ${o.sous(it)}`.toLowerCase().includes(q));
});

async function charger() {
  try {
    const [pelerinsData, guidesData, groupesData, prochesData, utilisateursData] = await Promise.all([
      getPelerinsArchives(),
      getGuidesArchives(),
      getGroupesArchives(),
      getProchesArchives(),
      getUtilisateurs(),
    ]);
    pelerins.value = pelerinsData;
    guides.value = guidesData;
    groupes.value = groupesData;
    proches.value = prochesData;
    utilisateurs.value = utilisateursData;
  } catch (e) {
    error(e.message);
  }
}
onMounted(charger);

async function restaurer(item) {
  try {
    await ongletActif.value.restore(item.id);
    success(`${ongletActif.value.label.slice(0, -1)} restauré(e).`);
    await charger();
  } catch (e) {
    error(e.message);
  }
}

async function supprimerDefinitivement(item) {
  const ok = await askConfirmation(
    'Cette action est irréversible. Supprimer définitivement cet élément (et son compte lié le cas échéant) ?'
  );
  if (!ok) return;
  try {
    await ongletActif.value.del(item.id);
    success('Élément supprimé définitivement.');
    await charger();
  } catch (e) {
    error(e.message);
  }
}
</script>

<template>
  <section>
    <PageHeader
      kicker="Corbeille"
      title="Liste des Archives"
      subtitle="Gérez les fiches supprimées temporairement (soft delete). Restaurez-les ou supprimez-les définitivement."
    />

    <div class="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(o, key) in onglets"
          :key="key"
          type="button"
          class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition"
          :class="activeTab === key ? 'bg-[#333D2A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          @click="activeTab = key"
        >
          <i class="fa-solid" :class="o.icon"></i> {{ o.label }} archivés ({{ o.items.length }})
        </button>
      </div>
      <div class="relative sm:w-72">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input
          v-model="recherche"
          type="text"
          placeholder="Rechercher…"
          class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm"
        />
      </div>
    </div>

    <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div v-if="itemsFiltres.length" class="grid gap-3">
        <div
          v-for="item in itemsFiltres"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
        >
          <div>
            <p class="font-bold text-slate-800">{{ ongletActif.nom(item) }}</p>
            <p class="text-xs text-slate-500">{{ ongletActif.sous(item) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
              @click="restaurer(item)"
            >
              <i class="fa-solid fa-rotate-left"></i> Restaurer
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
              @click="supprimerDefinitivement(item)"
            >
              <i class="fa-solid fa-trash"></i> Supprimer définitivement
            </button>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center gap-2 py-10 text-center text-sm text-slate-400">
        <i class="fa-solid fa-box-archive text-2xl"></i>
        <p>Aucun élément archivé dans « {{ ongletActif.label }} ».</p>
      </div>
    </div>
  </section>
</template>
