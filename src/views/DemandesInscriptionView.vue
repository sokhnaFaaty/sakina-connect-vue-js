<script setup>
import { ref, computed, onMounted } from 'vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { useToast, useModal } from '@/composables/index.js';
import { getGroupes } from '@/services/groupeService.js';
import { getGuides } from '@/services/guideService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getDemandesInscription } from '@/services/demandeInscriptionService.js';
import DemandeAcceptationForm from '@/components/forms/DemandeAcceptationForm.vue';
import DemandeRefusModal from '@/components/forms/DemandeRefusModal.vue';

// ---------------------------------------------------------------------------
// L'écran qui manquait pour que le formulaire public serve à quelque chose.
//
// Le backend existait et était testé : lister, accepter, refuser. Mais aucune
// interface ne permettait de traiter une demande, donc `/nous-rejoindre`
// envoyait des demandes dans le vide. C'est le dernier maillon de la
// fonctionnalité.
//
// Deux règles de conception tiennent dans cette vue :
//
//  1. On ne montre que les demandes en attente par défaut. Une demande traitée
//     est un dossier clos : la mélanger à la file d'attente de travail ferait
//     perdre le seul chiffre qui compte, « combien restent à traiter ».
//  2. Le mot de passe du pèlerin n'est ni affiché, ni recopié, ni modifiable.
//     Le backend ne l'expose jamais dans ses réponses, et cette vue ne fait
//     rien pour le retrouver : c'est le compte créé à l'acceptation qui portera
//     le mot de passe choisi par le pèlerin lui-même.
// ---------------------------------------------------------------------------

// Seul `error` est utilisé ici : les succès sont annoncés par les modales
// elles-mêmes, qui connaissent le nom du pèlerin et la nature de la décision.
const { error } = useToast();
const { open } = useModal();

const demandes = ref([]);
const groupes = ref([]);
const guides = ref([]);
const utilisateurs = ref([]);
const chargement = ref(false);
const onglet = ref('EN_ATTENTE');

const FILTRES = [
  { code: 'EN_ATTENTE', label: 'En attente', badge: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  { code: 'ACCEPTEE', label: 'Acceptées', badge: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { code: 'REFUSEE', label: 'Refusées', badge: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
];

const groupeMap = computed(() => Object.fromEntries(groupes.value.map((g) => [g.id, g])));
const enAttente = computed(() => demandes.value.filter((d) => d.statut === 'EN_ATTENTE').length);

const dateLisible = (valeur) => {
  if (!valeur) return '-';
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('fr-FR');
};

const badge = (statut) => FILTRES.find((f) => f.code === statut)?.badge || '';

async function charger() {
  chargement.value = true;
  try {
    // Une seule requête pour tout le tableau : le filtre est fait côté client,
    // sinon on re-demande la même liste à chaque changement d'onglet.
    demandes.value = await getDemandesInscription();
  } catch (e) {
    error(e.message);
  } finally {
    chargement.value = false;
  }
}

function accepter(demande) {
  open(DemandeAcceptationForm, {
    title: `Accepter ${demande.prenom} ${demande.nom}`,
    props: {
      demande,
      groupes: groupes.value,
      guides: guides.value,
      utilisateurs: utilisateurs.value,
      onTraitee: apresTraitement,
    },
  });
}

function refuser(demande) {
  open(DemandeRefusModal, {
    title: `Refuser ${demande.prenom} ${demande.nom}`,
    props: { demande, onTraitee: apresTraitement },
  });
}

// `AppModal` écoute le `@success` de la modale pour la refermer, mais elle ne
// propage rien à la vue qui l'a ouverte. Sans ce callback, la liste afficherait
// encore la demande traitée jusqu'au rechargement manuel de la page. On passe
// donc le rafraîchissement en prop, comme le fait `RejetMotifModal`.
function apresTraitement() {
  charger();
}

onMounted(async () => {
  await Promise.all([
    getGroupes()
      .then((g) => (groupes.value = g))
      .catch(() => (groupes.value = [])),
    getGuides()
      .then((g) => (guides.value = g))
      .catch(() => (guides.value = [])),
    getUtilisateurs()
      .then((u) => (utilisateurs.value = u))
      .catch(() => (utilisateurs.value = [])),
  ]);
  await charger();
});
</script>

<template>
  <PageHeader
    kicker="Administration"
    title="Demandes d'inscription"
    :subtitle="`${demandes.length} demande(s) reçue(s) — ${enAttente} en attente de traitement.`"
  >
    <template #actions>
      <button
        @click="charger"
        :disabled="chargement"
        class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <i class="fa-solid fa-rotate" :class="{ 'fa-spin': chargement }"></i>
      </button>
    </template>
  </PageHeader>

  <div class="mb-6 flex flex-wrap gap-2">
    <button
      v-for="f in FILTRES"
      :key="f.code"
      @click="onglet = f.code"
      class="rounded-2xl px-4 py-2 text-sm font-extrabold transition"
      :class="onglet === f.code ? 'bg-[#333D2A] text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300'"
    >
      {{ f.label }}
      <span
        v-if="f.code === 'EN_ATTENTE' && enAttente"
        class="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs"
      >{{ enAttente }}</span>
    </button>
  </div>

  <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th class="px-5 py-4">Pèlerin</th>
            <th class="px-5 py-4">Contact</th>
            <th class="px-5 py-4">Paiement</th>
            <th class="px-5 py-4">Reçue le</th>
            <th class="px-5 py-4">Statut</th>
            <th class="px-5 py-4 text-center">Décision</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
          <tr
            v-for="d in demandes.filter((x) => x.statut === onglet)"
            :key="d.id"
            class="transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            <td class="px-5 py-4">
              <p class="font-bold text-slate-800 dark:text-slate-100">{{ d.prenom }} {{ d.nom }}</p>
              <p v-if="d.pelerinId" class="text-xs text-emerald-600"> affecté — {{ groupeMap[d.groupeId]?.nom || '' }}</p>
            </td>
            <td class="px-5 py-4 text-slate-600 dark:text-slate-300">
              <p>{{ d.email }}</p>
              <p class="text-xs text-slate-400">{{ d.telephone }}</p>
            </td>
            <td class="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{{ d.referencePaiement }}</td>
            <td class="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{{ dateLisible(d.dateDemande) }}</td>
            <td class="px-5 py-4">
              <span class="rounded-full px-3 py-1 text-xs font-extrabold" :class="badge(d.statut)">
                {{ d.statut }}
              </span>
            </td>
            <td class="px-5 py-4 text-center whitespace-nowrap">
              <template v-if="d.statut === 'EN_ATTENTE'">
                <button @click="accepter(d)" class="mr-3 text-emerald-600 hover:text-emerald-800" title="Accepter">
                  <i class="fa-solid fa-user-check"></i>
                </button>
                <button @click="refuser(d)" class="text-rose-500 hover:text-rose-700" title="Refuser">
                  <i class="fa-solid fa-ban"></i>
                </button>
              </template>
              <span v-else class="text-xs text-slate-400">
                {{ d.dateTraitement ? 'le ' + dateLisible(d.dateTraitement) : '' }}
              </span>
            </td>
          </tr>

          <tr v-if="!chargement && demandes.filter((x) => x.statut === onglet).length === 0">
            <td colspan="6" class="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
              Aucune demande {{ onglet === 'EN_ATTENTE' ? 'en attente' : onglet.toLowerCase() }}.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
