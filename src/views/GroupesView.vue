<script setup>
import { ref, onMounted } from 'vue';

// Import de tes services (Ils restent identiques !)
import { getGroupes, deleteGroupe } from '@/services/groupeService.js';
import { getPelerins } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getGuides } from '@/services/guideService.js';
import { getHotels } from '@/services/hotelService.js';

// Import de tes futurs Composables et Composants UI
// (Tu peux les créer à partir de tes fichiers existants)
import { useToast } from '@/composables/useToast.js';
import { useConfirm } from '@/composables/useConfirm.js';
import { useModal } from '@/composables/useModal.js';
import PageHeader from '@/components/ui/PageHeader.vue';
import AppButton from '@/components/ui/AppButton.vue';
// import AppTable from '@/components/ui/AppTable.vue'; // À créer plus tard
import GroupeForm from '@/components/forms/GroupeForm.vue'; // À créer plus tard

// ---- État réactif (au lieu de `const app = document.getElementById...`) ----
const groupes = ref([]);
const pelerins = ref([]);
const utilisateurs = ref([]);
const guides = ref([]);
const hotels = ref([]);
const vueActuelle = ref('table'); // 'card' ou 'table'

const { erreur: toastErreur, succes } = useToast();
const { demanderConfirmation } = useConfirm();
const { ouvrir: ouvrirModal } = useModal();

// ---- Chargement des données (Promise.all) ----
async function chargerDonnees() {
  try {
    const [groupesData, pelerinsData, utilisateursData, guidesData, hotelsData] = await Promise.all([
      getGroupes(),
      getPelerins(),
      getUtilisateurs(),
      getGuides(),
      getHotels(),
    ]);
    groupes.value = groupesData;
    pelerins.value = pelerinsData;
    utilisateurs.value = utilisateursData;
    guides.value = guidesData;
    hotels.value = hotelsData;
  } catch (e) {
    toastErreur(e.message);
  }
}

// ---- Montage initial (remplace ton `onMounted(charger)` actuel) ----
onMounted(chargerDonnees);

// ---- Logique d'ouverture du formulaire (Drawer) ----
function ouvrirFormulaireGroupe(groupe = null) {
  // Dans le monde Vue, le "Drawer" devient un composant qui se glisse
  // Tu l'appelles via ton futur composable `useModal`
  ouvrirModal(GroupeForm, {
    titre: groupe ? 'Modifier le groupe' : 'Ajouter un groupe',
    props: { 
      groupe, 
      guides: guides.value, 
      hotels: hotels.value, 
      utilisateurs: utilisateurs.value,
      onSucces: chargerDonnees // La modale appelle cette fonction quand elle a fini
    }
  });
}

// ---- Logique de suppression ----
async function confirmerSuppression(groupe) {
  const ok = await demanderConfirmation(`Voulez-vous supprimer le groupe "${groupe.nom}" ?`);
  if (!ok) return;
  try {
    await deleteGroupe(groupe.id);
    succes('Groupe archivé.');
    chargerDonnees(); // Recharge la liste après suppression
  } catch (e) {
    toastErreur(e.message);
  }
}
</script>

<template>
  <section>
    <!-- Header -->
    <PageHeader
      kicker="Organisation"
      title="Liste des Groupes"
      subtitle="Créer les groupes, assigner un guide et consulter les pèlerins affectés."
    >
      <template #actions>
        <AppButton variant="primary" @click="ouvrirFormulaireGroupe()">
          <i class="fa-solid fa-plus"></i> Nouveau groupe
        </AppButton>
      </template>
    </PageHeader>

    <!-- Toggle Vue Carte / Tableau (Géré par Vue, plus besoin de innerHTML) -->
    <div class="mb-4 flex justify-end">
      <div class="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
        <button 
          @click="vueActuelle = 'card'" 
          :class="vueActuelle === 'card' ? 'bg-[#333D2A] text-white' : 'text-slate-500'"
          class="h-8 w-8 flex items-center justify-center rounded text-sm transition"
        >
          <i class="fa-solid fa-table-cells-large"></i>
        </button>
        <button 
          @click="vueActuelle = 'table'" 
          :class="vueActuelle === 'table' ? 'bg-[#333D2A] text-white' : 'text-slate-500'"
          class="h-8 w-8 flex items-center justify-center rounded text-sm transition"
        >
          <i class="fa-solid fa-table-list"></i>
        </button>
      </div>
    </div>

    <!-- Contenu de la page -->
    <div v-if="groupes.length === 0" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
      Aucun groupe enregistré.
    </div>

    <!-- Vue Tableau -->
    <div v-else-if="vueActuelle === 'table'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <!-- On utilise un tableau HTML classique ici. Tu pourras remplacer ça par <AppTable> plus tard -->
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">Nom</th>
              <th class="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">Guide</th>
              <th class="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">Pèlerins</th>
              <th class="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="g in groupes" :key="g.id" class="transition hover:bg-slate-50">
              <td class="border-t border-slate-100 px-5 py-4 font-bold text-slate-950">{{ g.nom }}</td>
              <td class="border-t border-slate-100 px-5 py-4 text-sm text-slate-700">
                <!-- On trouve le nom du guide via utilisateurs -->
                {{ utilisateurs.find(u => u.id === guides.find(guide => guide.id === g.guideId)?.utilisateurId)?.nomComplet || '-' }}
              </td>
              <td class="border-t border-slate-100 px-5 py-4 text-sm text-slate-700">
                {{ pelerins.filter(p => p.groupeId === g.id).length }} pèlerins
              </td>
              <td class="border-t border-slate-100 px-5 py-4">
                <div class="flex items-center gap-2">
                  <button @click="ouvrirFormulaireGroupe(g)" class="text-indigo-500 hover:text-indigo-700 text-sm">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button @click="confirmerSuppression(g)" class="text-rose-500 hover:text-rose-700 text-sm">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Vue Cartes -->
    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="g in groupes" :key="g.id" class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="flex-1 p-5">
          <h3 class="font-black text-slate-950">{{ g.nom }}</h3>
          <div class="mt-2 text-sm text-slate-600">
            <p class="flex items-center gap-2">
              <i class="fa-solid fa-user-tie w-4 text-[#333D2A]"></i>
              {{ utilisateurs.find(u => u.id === guides.find(guide => guide.id === g.guideId)?.utilisateurId)?.nomComplet || '-' }}
            </p>
            <p class="flex items-center gap-2 mt-1">
              <i class="fa-solid fa-users w-4 text-[#333D2A]"></i>
              {{ pelerins.filter(p => p.groupeId === g.id).length }} pèlerins
            </p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 bg-[#F2F2DE]/70 px-5 py-3">
          <button @click="ouvrirFormulaireGroupe(g)" class="text-indigo-500 hover:text-indigo-700 text-base">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button @click="confirmerSuppression(g)" class="text-rose-500 hover:text-rose-700 text-base">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>