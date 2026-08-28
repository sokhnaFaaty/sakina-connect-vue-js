<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import { getGroupes, deleteGroupe } from '@/services/groupeService.js';
import { getGuides } from '@/services/guideService.js';
import { getHotels } from '@/services/hotelService.js';
import { getPelerins } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import GroupeForm from '@/components/forms/GroupeForm.vue';

import { useToast } from '@/composables/useToast.js';
import { useConfirm } from '@/composables/useConfirm.js';
import { useDrawer } from '@/composables/useDrawer.js';
import { useModal } from '@/composables/useModal.js';

import PageHeader from '@/components/ui/PageHeader.vue';
import AppButton from '@/components/ui/AppButton.vue';
import ViewToggle from '@/components/ui/ViewToggle.vue';
import GroupeDetail from '@/components/forms/GroupeDetail.vue';

const router = useRouter();

const groupes = ref([]);
const pelerins = ref([]);
const utilisateurs = ref([]);
const guides = ref([]);
const hotels = ref([]);

const CLE_VUE = 'sakina:view:groupes';

function lireVueSauvegardee() {
  try {
    return localStorage.getItem(CLE_VUE) || 'table';
  } catch {
    return 'table';
  }
}

function sauvegarderVue(vue) {
  try {
    localStorage.setItem(CLE_VUE, vue);
  } catch {
    return;
  }
}

const vueActuelle = ref(lireVueSauvegardee());

watch(vueActuelle, (vue) => sauvegarderVue(vue));

const { success, error: toastErreur } = useToast();
const { askConfirmation } = useConfirm();
const { open: ouvrirDrawer } = useDrawer();
const { open: ouvrirModale } = useModal();

async function chargerDonnees() {
  try {
    [groupes.value, guides.value, hotels.value, pelerins.value, utilisateurs.value] = await Promise.all([
      getGroupes(), getGuides(), getHotels(), getPelerins(), getUtilisateurs()
    ]);
  } catch (e) { error(e.message); }
}
onMounted(chargerDonnees);

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])));
const nbPelerinsParGroupe = computed(() => {
  const m = {};
  pelerins.value.forEach((p) => {
    if (p.groupeId) m[p.groupeId] = (m[p.groupeId] || 0) + 1;
  });
  return m;
});

function guideNom(g) {
  const guide = guides.value.find((gd) => gd.id === g.guideId);
  return utilisateurMap.value[guide?.utilisateurId]?.nomComplet || '-';
}

function ouvrirFormulaireGroupe(groupe = null) {
  ouvrirDrawer(GroupeForm, {
    title: groupe ? 'Modifier le groupe de Voyage' : 'Ajouter un groupe de Voyage',
    icon: 'fa-people-group',
    props: {
      groupe,
      guides: guides.value,
      hotels: hotels.value,
      utilisateurs: utilisateurs.value,
    },
  });
}

function ouvrirDetail(groupe) {
  ouvrirModale(GroupeDetail, {
    title: `Détail du ${groupe.nom}`,
    props: {
      groupe,
      guides: guides.value,
      hotels: hotels.value,
      pelerins: pelerins.value,
      utilisateurs: utilisateurs.value,
    },
  });
}

async function confirmerSuppression(groupe) {
  const ok = await askConfirmation(
    `Êtes-vous sûr de vouloir supprimer le groupe "${groupe.nom}" ? Il sera archivé et pourra être restauré.`,
    {
      title: 'Confirmer la suppression',
      confirmLabel: 'OUI',
      cancelLabel: 'NON',
    }
  );
  if (!ok) return;
  try {
    await deleteGroupe(groupe.id);
    success('Groupe archivé.');
    chargerDonnees();
  } catch (e) {
    toastErreur(e.message);
  }
}

// Colonnes pour AppTable
const colonnes = [
  { label: 'Nom', key: 'nom' },
  { label: 'Guide', render: (g) => utilisateurMap.value[guideMap.value[g.guideId]?.utilisateurId]?.nomComplet || '-' },
  { label: 'Pèlerins', render: (g) => `${pelerins.value.filter(p => p.groupeId === g.id).length} pèlerins` },
];
</script>
<template>
  <section>
    <PageHeader
      kicker="Organisation"
      title="Liste des Groupes"
      subtitle="Créer les groupes, assigner un guide et consulter les pèlerins affectés."
    >
      <template #actions>
        <AppButton variant="secondary" @click="router.push('/archives')">
          <i class="fa-solid fa-trash-can-arrow-up"></i> Corbeille
        </AppButton>
        <AppButton variant="primary" @click="ouvrirFormulaireGroupe()">
          <i class="fa-solid fa-plus"></i> Nouveau groupe
        </AppButton>
      </template>
    </PageHeader>

    <div class="mb-4 flex justify-end">
      <ViewToggle v-model="vueActuelle" />
    </div>

    <div
      v-if="groupes.length === 0"
      class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
    >
      Aucun groupe enregistré.
    </div>

    <div v-else-if="vueActuelle === 'table'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse">
          <thead class="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th class="px-5 py-4 text-left text-xs font-black uppercase text-slate-500 dark:text-slate-400">ID</th>
              <th class="px-5 py-4 text-left text-xs font-black uppercase text-slate-500 dark:text-slate-400">Nom du groupe</th>
              <th class="px-5 py-4 text-left text-xs font-black uppercase text-slate-500 dark:text-slate-400">Guide responsable</th>
              <th class="px-5 py-4 text-left text-xs font-black uppercase text-slate-500 dark:text-slate-400">Nombre de pèlerins</th>
              <th class="px-5 py-4 text-left text-xs font-black uppercase text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr v-for="g in groupes" :key="g.id" class="transition hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <td class="px-5 py-4 text-xs font-bold text-slate-400 dark:text-slate-500">{{ g.id.slice(0, 6).toUpperCase() }}</td>
              <td class="px-5 py-4"><strong class="font-bold text-slate-950 dark:text-slate-100">{{ g.nom }}</strong></td>
              <td class="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{{ guideNom(g) }}</td>
              <td class="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{{ nbPelerinsParGroupe[g.id] || 0 }} pèlerins</td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-3 text-base">
                  <button @click="ouvrirDetail(g)" class="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100" title="Voir">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  <button @click="ouvrirFormulaireGroupe(g)" class="text-indigo-500 hover:text-indigo-700" title="Modifier">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button @click="confirmerSuppression(g)" class="text-rose-500 hover:text-rose-700" title="Supprimer">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="g in groupes"
        :key="g.id"
        class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="flex-1 p-5">
          <div class="mb-2 flex items-start justify-between gap-2">
            <h3 class="font-black text-slate-950 dark:text-slate-100">{{ g.nom }}</h3>
            <span class="rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A] dark:bg-slate-700/50 dark:text-[#BC7B3B]">{{ g.id.slice(0, 6).toUpperCase() }}</span>
          </div>
          <div class="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
            <p class="flex items-center gap-2"><i class="fa-solid fa-user-tie w-4 text-[#333D2A] dark:text-[#BC7B3B]"></i> {{ guideNom(g) }}</p>
            <p class="flex items-center gap-2"><i class="fa-solid fa-users w-4 text-[#333D2A] dark:text-[#BC7B3B]"></i> {{ nbPelerinsParGroupe[g.id] || 0 }} pèlerins</p>
            <p class="flex items-center gap-2"><i class="fa-solid fa-plane-departure w-4 text-[#333D2A] dark:text-[#BC7B3B]"></i> {{ g.dateDepart || '-' }} → {{ g.dateRetour || '-' }}</p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 bg-[#F2F2DE]/70 px-5 py-3 text-base dark:bg-slate-700/50">
          <button @click="ouvrirDetail(g)" class="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100" title="Voir">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button @click="ouvrirFormulaireGroupe(g)" class="text-indigo-500 hover:text-indigo-700" title="Modifier">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button @click="confirmerSuppression(g)" class="text-rose-500 hover:text-rose-700" title="Supprimer">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
