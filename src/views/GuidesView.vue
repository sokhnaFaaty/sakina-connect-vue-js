<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast, useConfirm } from '@/composables/index.js';
import { useDrawer } from '@/composables/useDrawer.js';
import { getGuides, deleteGuide } from '@/services/guideService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getGroupes } from '@/services/groupeService.js';
import PageHeader from '@/components/ui/PageHeader.vue';
import AppButton from '@/components/ui/AppButton.vue';
import ViewToggle from '@/components/ui/ViewToggle.vue';
import GuideForm from '@/components/forms/GuideForm.vue';

const router = useRouter();
const { success, error } = useToast();
const { askConfirmation } = useConfirm();
const { open: ouvrirDrawer } = useDrawer();

const CLE_VUE = 'sakina:view:guides';

function lireVue() {
  try {
    return localStorage.getItem(CLE_VUE) || 'card';
  } catch {
    return 'card';
  }
}

const guides = ref([]);
const utilisateurs = ref([]);
const groupes = ref([]);
const vue = ref(lireVue());
const recherche = ref('');
const filtreGroupe = ref('');
const compteCree = ref(null);

watch(vue, (v) => {
  try {
    localStorage.setItem(CLE_VUE, v);
  } catch {}
});

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])));

const groupesParGuide = computed(() => {
  const m = {};
  groupes.value.forEach((g) => {
    if (g.guideId) (m[g.guideId] = m[g.guideId] || []).push(g);
  });
  return m;
});

function nomGuide(guide) {
  return utilisateurMap.value[guide.utilisateurId]?.nomComplet || 'Guide inconnu';
}

function groupesLabel(guide) {
  const gs = groupesParGuide.value[guide.id] || [];
  return gs.length ? gs.map((g) => g.nom).join(', ') : 'Aucun groupe assigné';
}

const guidesFiltres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();
  return guides.value.filter((guide) => {
    const u = utilisateurMap.value[guide.utilisateurId] || {};
    const nom = String(u.nomComplet ?? '').toLowerCase();
    const tel = String(u.telephone ?? '').toLowerCase();
    const mail = String(u.email ?? '').toLowerCase();
    const matcheRecherche = !terme || nom.includes(terme) || tel.includes(terme) || mail.includes(terme);
    const matcheGroupe =
      !filtreGroupe.value || (groupesParGuide.value[guide.id] || []).some((g) => g.id === filtreGroupe.value);
    return matcheRecherche && matcheGroupe;
  });
});

async function charger() {
  try {
    const [guidesData, utilisateursData, groupesData] = await Promise.all([
      getGuides(),
      getUtilisateurs(),
      getGroupes(),
    ]);
    guides.value = guidesData;
    utilisateurs.value = utilisateursData;
    groupes.value = groupesData;
  } catch (e) {
    error(e.message);
  }
}
onMounted(charger);

function ouvrirFormulaire(guide = null) {
  ouvrirDrawer(GuideForm, {
    title: guide ? 'Modifier un Guide' : 'Ajouter un Guide',
    icon: 'fa-user-tie',
    props: {
      guide,
      utilisateurs: utilisateurs.value,
      onSaved: charger,
      onCompteCree: ({ nomComplet, motDePasseGenere }) => {
        setTimeout(() => {
          compteCree.value = { nomComplet, motDePasse: motDePasseGenere };
        }, 200);
      },
    },
  });
}

async function supprimer(guide) {
  const nom = utilisateurMap.value[guide.utilisateurId]?.nomComplet || '';
  const ok = await askConfirmation(
    `Êtes-vous sûr de vouloir supprimer le guide "${nom}" ? Le guide sera archivé et pourra être restauré.`,
    { title: 'Confirmer la suppression', confirmLabel: 'OUI', cancelLabel: 'NON' }
  );
  if (!ok) return;
  try {
    await deleteGuide(guide.id);
    success('Guide archivé.');
    charger();
  } catch (e) {
    error(e.message);
  }
}

function copierMotDePasse() {
  navigator.clipboard.writeText(compteCree.value.motDePasse);
  success('Mot de passe copié.');
}

function fermerCompteCree() {
  compteCree.value = null;
}
</script>

<template>
  <section>
    <PageHeader kicker="Équipe" title="Guides Spirituels (Oustadhs/Oustadhas)" subtitle="Gérez et affectez les guides et leurs groupes.">
      <template #actions>
        <AppButton variant="primary" @click="ouvrirFormulaire()">
          <i class="fa-solid fa-user-plus"></i> Ajouter un guide
        </AppButton>
        <AppButton variant="secondary" @click="router.push('/archives')">
          <i class="fa-solid fa-trash-can-arrow-up"></i> Corbeille
        </AppButton>
      </template>
    </PageHeader>

    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative flex-1 sm:max-w-xs">
          <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
          <input
            v-model="recherche"
            type="search"
            placeholder="Rechercher un guide (nom, tél, email)…"
            class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <select v-model="filtreGroupe" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:w-56">
          <option value="">Tous les groupes</option>
          <option v-for="g in groupes" :key="g.id" :value="g.id">{{ g.nom }}</option>
        </select>
      </div>
      <ViewToggle v-model="vue" />
    </div>

    <div
      v-if="guidesFiltres.length === 0 && vue === 'card'"
      class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm"
    >
      Aucun guide ne correspond à votre recherche.
    </div>

    <div v-else-if="vue === 'card'" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="guide in guidesFiltres"
        :key="guide.id"
        class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="flex-1 p-5">
          <div class="mb-3 flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <img
                v-if="utilisateurMap[guide.utilisateurId]?.photo"
                :src="utilisateurMap[guide.utilisateurId].photo"
                alt=""
                class="h-12 w-12 shrink-0 rounded-full object-cover"
              />
              <div v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F2F2DE] text-[#333D2A]">
                <i class="fa-solid fa-user-tie"></i>
              </div>
              <div>
                <h3 class="font-black text-slate-950">{{ nomGuide(guide) }}</h3>
                <span class="mt-1 inline-block rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">{{ guide.id.slice(0, 6).toUpperCase() }}</span>
              </div>
            </div>
            <span
              class="shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-black"
              :class="guide.disponibilite ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
            >{{ guide.disponibilite ? 'En Service' : 'Indisponible' }}</span>
          </div>

          <div class="mt-4 grid gap-2 text-sm text-slate-600">
            <p class="flex items-center gap-2"><i class="fa-solid fa-phone w-4 text-[#333D2A]"></i> {{ utilisateurMap[guide.utilisateurId]?.telephone || '-' }}</p>
            <p class="flex items-center gap-2"><i class="fa-solid fa-envelope w-4 text-[#333D2A]"></i> {{ utilisateurMap[guide.utilisateurId]?.email || '-' }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2 bg-[#F2F2DE]/70 px-5 py-3">
          <div class="min-w-0">
            <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Groupe assigné</p>
            <p class="truncate text-sm font-bold text-slate-800">{{ groupesLabel(guide) }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-3 text-base">
            <button @click="ouvrirFormulaire(guide)" class="text-indigo-500 hover:text-indigo-700" title="Modifier">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button @click="supprimer(guide)" class="text-rose-500 hover:text-rose-700" title="Archiver">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div
        v-if="guidesFiltres.length === 0"
        class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500"
      >
        Aucun guide ne correspond à votre recherche.
      </div>
      <div v-else class="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead class="bg-slate-50">
              <tr>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Image</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Nom</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Téléphone</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Email</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Disponibilité</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Groupes assignés</th>
                <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="guide in guidesFiltres" :key="guide.id" class="transition hover:bg-slate-50">
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <img
                    v-if="utilisateurMap[guide.utilisateurId]?.photo"
                    :src="utilisateurMap[guide.utilisateurId].photo"
                    alt=""
                    class="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2F2DE] text-[#333D2A]">
                    <i class="fa-solid fa-user-tie"></i>
                  </div>
                </td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <strong class="font-bold text-slate-950">{{ utilisateurMap[guide.utilisateurId]?.nomComplet || '-' }}</strong>
                </td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ utilisateurMap[guide.utilisateurId]?.telephone || '-' }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ utilisateurMap[guide.utilisateurId]?.email || '-' }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <span
                    class="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-black"
                    :class="guide.disponibilite ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                  >{{ guide.disponibilite ? 'En Service' : 'Indisponible' }}</span>
                </td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ groupesLabel(guide) }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <div class="flex items-center gap-3 text-base">
                    <button @click="ouvrirFormulaire(guide)" class="text-indigo-500 hover:text-indigo-700" title="Modifier">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button @click="supprimer(guide)" class="text-rose-500 hover:text-rose-700" title="Archiver">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="compteCree"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        @click="fermerCompteCree"
      >
        <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" @click.stop>
          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <i class="fa-solid fa-key"></i>
              </div>
              <h2 class="text-xl font-black tracking-tight text-slate-950">Compte guide créé</h2>
            </div>
            <button type="button" @click="fermerCompteCree" class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <p class="text-sm text-slate-600">
            Le compte de <strong>{{ compteCree.nomComplet }}</strong> a été créé. Communique-lui ce mot de passe temporaire :
          </p>
          <div class="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span class="text-lg font-black tracking-widest text-slate-950">{{ compteCree.motDePasse }}</span>
            <button type="button" @click="copierMotDePasse" class="text-slate-500 hover:text-slate-800">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>

          <div class="mt-2 flex justify-end gap-3">
            <button
              type="button"
              @click="fermerCompteCree"
              class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#333D2A]/20 transition hover:opacity-90"
            >
              <i class="fa-solid fa-check"></i>
              <span>J'ai noté</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
