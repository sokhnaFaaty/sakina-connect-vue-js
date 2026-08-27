<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast, useConfirm } from '@/composables/index.js';
import { useDrawer } from '@/composables/useDrawer.js';
import { getPelerins, deletePelerin } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getGroupes } from '@/services/groupeService.js';
import { getHotels } from '@/services/hotelService.js';
import { getGuides } from '@/services/guideService.js';
import { getProches } from '@/services/procheService.js';
import { getSos } from '@/services/sosService.js';
import PageHeader from '@/components/ui/PageHeader.vue';
import AppButton from '@/components/ui/AppButton.vue';
import ViewToggle from '@/components/ui/ViewToggle.vue';
import PelerinForm from '@/components/forms/PelerinForm.vue';

const router = useRouter();
const { success, error } = useToast();
const { askConfirmation } = useConfirm();
const { open: ouvrirDrawer } = useDrawer();

const CLE_VUE = 'sakina:view:pelerins';

function lireVue() {
  try {
    return localStorage.getItem(CLE_VUE) || 'table';
  } catch {
    return 'table';
  }
}

const pelerins = ref([]);
const utilisateurs = ref([]);
const groupes = ref([]);
const hotels = ref([]);
const guides = ref([]);
const vue = ref(lireVue());
const recherche = ref('');
const filtreGroupe = ref('');
const procheCree = ref(null);
const detail = ref(null);

watch(vue, (v) => {
  try {
    localStorage.setItem(CLE_VUE, v);
  } catch {}
});

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])));

function nomPelerin(p) {
  return utilisateurMap.value[p.utilisateurId]?.nomComplet || '—';
}

function nomGroupe(groupeId) {
  return groupes.value.find((g) => g.id === groupeId)?.nom || null;
}

const pelerinsFiltres = computed(() => {
  const terme = recherche.value.trim().toLowerCase();
  return pelerins.value.filter((p) => {
    const nom = String(utilisateurMap.value[p.utilisateurId]?.nomComplet || '').toLowerCase();
    const passeport = String(p.numeroPasseport || '').toLowerCase();
    const matcheRecherche = !terme || nom.includes(terme) || passeport.includes(terme);
    const matcheGroupe = !filtreGroupe.value || p.groupeId === filtreGroupe.value;
    return matcheRecherche && matcheGroupe;
  });
});

function visaClasse(statutVisa) {
  return statutVisa === 'APPROUVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
}

function visaLibelle(statutVisa) {
  return statutVisa === 'APPROUVE' ? 'Approuvé' : statutVisa;
}

async function charger() {
  try {
    const [pelerinsData, groupesData, utilisateursData, hotelsData, guidesData] = await Promise.all([
      getPelerins(),
      getGroupes(),
      getUtilisateurs(),
      getHotels(),
      getGuides(),
    ]);
    pelerins.value = pelerinsData;
    groupes.value = groupesData;
    utilisateurs.value = utilisateursData;
    hotels.value = hotelsData;
    guides.value = guidesData;
  } catch (e) {
    error(e.message);
  }
}
onMounted(charger);

function ouvrirFormulaire(pelerin = null) {
  ouvrirDrawer(PelerinForm, {
    title: pelerin ? 'Modifier un Pèlerin' : 'Ajouter un Pèlerin',
    icon: 'fa-user',
    props: {
      pelerin,
      groupes: groupes.value,
      onSaved: charger,
      onProcheCree: ({ nomComplet, motDePasseGenere }) => {
        setTimeout(() => {
          procheCree.value = { nomComplet, motDePasse: motDePasseGenere };
        }, 200);
      },
    },
  });
}

async function ouvrirDetail(pelerin) {
  try {
    const utilisateur = utilisateurMap.value[pelerin.utilisateurId];
    const groupe = groupes.value.find((g) => g.id === pelerin.groupeId) || null;
    const hotelMecque = groupe ? hotels.value.find((h) => h.id === groupe.hotelMecqueId)?.nom || '-' : '-';
    const hotelMedine = groupe ? hotels.value.find((h) => h.id === groupe.hotelMedineId)?.nom || '-' : '-';
    const guide = groupe ? guides.value.find((g) => g.id === groupe.guideId) : null;
    const guideNom = guide ? utilisateurMap.value[guide.utilisateurId]?.nomComplet || '-' : '-';

    const [proches, sos] = await Promise.all([getProches(), getSos()]);
    const procheAssocie = proches.find((pr) => pr.pelerinId === pelerin.id) || null;
    const procheUtilisateur = procheAssocie ? utilisateurMap.value[procheAssocie.utilisateurId] : null;
    const sosRecents = sos
      .filter((s) => s.pelerinId === pelerin.id)
      .sort((a, b) => String(b.dateHeure).localeCompare(String(a.dateHeure)));

    detail.value = {
      pelerin,
      utilisateur,
      groupe,
      hotelMecque,
      hotelMedine,
      guideNom,
      procheAssocie,
      procheUtilisateur,
      sosRecents,
    };
  } catch (e) {
    error(e.message);
  }
}

function fermerDetail() {
  detail.value = null;
}

function formaterDateSos(dateHeure) {
  if (!dateHeure) return '-';
  const d = new Date(dateHeure);
  return Number.isNaN(d.getTime()) ? String(dateHeure) : d.toLocaleString('fr-FR');
}

async function supprimer(pelerin) {
  const ok = await askConfirmation(
    'Voulez-vous supprimer ce pèlerin ? Il sera archivé (avec son compte) et pourra être restauré.',
    { title: 'Confirmer la suppression', confirmLabel: 'OUI', cancelLabel: 'NON' }
  );
  if (!ok) return;
  try {
    await deletePelerin(pelerin.id);
    success('Pèlerin archivé.');
    charger();
  } catch (e) {
    error(e.message);
  }
}

function copierMotDePasse() {
  navigator.clipboard.writeText(procheCree.value.motDePasse);
  success('Mot de passe copié.');
}

function fermerProcheCree() {
  procheCree.value = null;
}

const colonnes = [
  { label: 'Nom', render: (p) => utilisateurMap.value[p.utilisateurId]?.nomComplet || '-' },
  { label: 'Passeport', key: 'numeroPasseport' },
  { label: 'Groupe', render: (p) => groupeMap.value[p.groupeId] || '-' },
  { label: 'Visa', render: (p) => p.statutVisa === 'APPROUVE' ? '✅ Approuvé' : '⏳ En attente' }
];
</script>

<template>
  <section>
    <PageHeader
      kicker="Sécurité & Suivi"
      title="Manifeste des Pèlerins"
      subtitle="Enregistrez, suivez et validez la conformité réglementaire de tous les inscrits."
    >
      <template #actions>
        <AppButton variant="secondary" @click="router.push('/archives')">
          <i class="fa-solid fa-trash-can-arrow-up"></i> Corbeille
        </AppButton>
        <AppButton variant="primary" @click="ouvrirFormulaire()">
          <i class="fa-solid fa-user-plus"></i> Ajouter un Nouveau Pelerin
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
            placeholder="Rechercher un pèlerin (nom, passeport)…"
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
      v-if="pelerinsFiltres.length === 0"
      class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm"
    >
      Aucun pèlerin ne correspond à votre recherche.
    </div>

    <template v-else>
      <article v-if="vue === 'table'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse">
              <thead class="bg-slate-50">
                <tr>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Image</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Nom</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">N Passeport</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Groupe</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Statut Visa</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Santé</th>
                  <th class="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="p in pelerinsFiltres" :key="p.id" class="transition hover:bg-slate-50">
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                    <img
                      v-if="utilisateurMap[p.utilisateurId]?.photo"
                      :src="utilisateurMap[p.utilisateurId].photo"
                      alt=""
                      class="h-10 w-10 rounded-full object-cover"
                    />
                    <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <i class="fa-solid fa-user"></i>
                    </div>
                  </td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                    <strong class="font-bold text-slate-950">{{ nomPelerin(p) }}</strong>
                  </td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ p.numeroPasseport }}</td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ nomGroupe(p.groupeId) || '-' }}</td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                    <span
                      class="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold"
                      :class="visaClasse(p.statutVisa)"
                    >{{ visaLibelle(p.statutVisa) }}</span>
                  </td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ p.informationsMedicales || '----' }}</td>
                  <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                    <div class="flex flex-wrap gap-2">
                      <button type="button" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" title="Voir" @click="ouvrirDetail(p)">
                        <i class="fa-solid fa-eye"></i>
                      </button>
                      <button type="button" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" title="Modifier" @click="ouvrirFormulaire(p)">
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button type="button" class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white" title="Supprimer" @click="supprimer(p)">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="p in pelerinsFiltres"
          :key="p.id"
          class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="flex-1 p-5">
            <div class="mb-3 flex items-center gap-3">
              <img
                v-if="utilisateurMap[p.utilisateurId]?.photo"
                :src="utilisateurMap[p.utilisateurId].photo"
                alt=""
                class="h-10 w-10 rounded-full object-cover"
              />
              <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <i class="fa-solid fa-user"></i>
              </div>
              <div>
                <h3 class="font-black text-slate-950">{{ nomPelerin(p) }}</h3>
                <p class="text-xs text-slate-500">{{ nomGroupe(p.groupeId) || 'Sans groupe' }}</p>
              </div>
            </div>
            <div class="grid gap-2 text-sm text-slate-600">
              <p class="flex items-center gap-2"><i class="fa-solid fa-passport w-4 text-[#333D2A]"></i> {{ p.numeroPasseport }}</p>
              <p class="flex items-center gap-2">
                <i class="fa-solid fa-file-shield w-4 text-[#333D2A]"></i>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                  :class="visaClasse(p.statutVisa)"
                >{{ visaLibelle(p.statutVisa) }}</span>
              </p>
              <p class="flex items-center gap-2"><i class="fa-solid fa-heart-pulse w-4 text-[#333D2A]"></i> {{ p.informationsMedicales || '----' }}</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 bg-[#F2F2DE]/70 px-5 py-3">
            <button type="button" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" title="Voir" @click="ouvrirDetail(p)">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button type="button" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" title="Modifier" @click="ouvrirFormulaire(p)">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white" title="Supprimer" @click="supprimer(p)">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </article>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="detail"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        @click="fermerDetail"
      >
        <div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" @click.stop>
          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2F2DE] text-[#333D2A]">
                <i class="fa-solid fa-circle-info"></i>
              </div>
            </div>
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer" @click="fermerDetail">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="grid gap-4">
            <div class="-m-6 mb-0 flex items-start gap-4 border-b border-slate-100 p-6 pb-5">
              <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
                <img v-if="detail.utilisateur?.photo" :src="detail.utilisateur.photo" alt="" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center text-slate-300">
                  <i class="fa-solid fa-user text-2xl"></i>
                </div>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-black text-slate-950">{{ detail.utilisateur?.nomComplet || '-' }}</h2>
                  <span class="rounded-full bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">{{ detail.pelerin.id.slice(0, 5).toUpperCase() }}</span>
                </div>
                <p class="text-sm text-slate-500">Passeport : {{ detail.pelerin.numeroPasseport }}</p>
                <p class="mt-1 text-sm text-slate-500">
                  Statut du Visa :
                  <span v-if="detail.pelerin.statutVisa === 'APPROUVE'" class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700"><i class="fa-solid fa-check"></i> Approuvé</span>
                  <span v-else class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{{ detail.pelerin.statutVisa }}</span>
                </p>
              </div>
            </div>

            <div class="grid gap-4 pt-4 sm:grid-cols-2">
              <div>
                <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0B6E4F]">
                  <i class="fa-solid fa-route"></i> Logistique &amp; Accompagnement
                </p>
                <div class="rounded-2xl bg-[#F2F2DE] p-4 text-sm">
                  <p class="text-slate-500">Guide spirituel assigné :</p>
                  <p class="mb-3 font-bold text-slate-800">{{ detail.guideNom }}</p>
                  <p class="text-slate-500">Groupe de voyage :</p>
                  <p class="font-bold text-slate-800">{{ detail.groupe?.nom || '-' }}</p>
                </div>

                <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0B6E4F]">
                  <i class="fa-solid fa-hotel"></i> Hébergements d'hôtels
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-2xl bg-[#F2F2DE] p-3 text-sm">
                    <p class="text-xs font-bold text-slate-500">LA MECQUE :</p>
                    <p class="font-bold text-slate-800">{{ detail.hotelMecque }}</p>
                  </div>
                  <div class="rounded-2xl bg-[#F2F2DE] p-3 text-sm">
                    <p class="text-xs font-bold text-slate-500">MÉDINE :</p>
                    <p class="font-bold text-slate-800">{{ detail.hotelMedine }}</p>
                  </div>
                </div>
              </div>

              <div>
                <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
                  <i class="fa-solid fa-heart-pulse"></i> Fiche médicale &amp; pathologies
                </p>
                <div class="rounded-2xl bg-rose-50 p-4 text-sm">
                  <p class="text-xs font-bold text-rose-700">PATHOLOGIES SIGNALÉES :</p>
                  <p class="mt-1 text-slate-700">{{ detail.pelerin.informationsMedicales || 'Aucune pathologie signalée.' }}</p>
                </div>

                <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
                  <i class="fa-solid fa-hand-holding-heart"></i> Proches &amp; contacts d'urgence
                </p>
                <div class="rounded-2xl bg-[#F2F2DE] p-4 text-sm">
                  <p class="text-slate-500">Contact d'urgence — Proche associé (Portail Famille) :</p>
                  <template v-if="detail.procheUtilisateur">
                    <p class="font-bold text-slate-800">
                      {{ detail.procheUtilisateur.nomComplet }}<template v-if="detail.procheAssocie.lienParente"> ({{ detail.procheAssocie.lienParente }})</template>
                    </p>
                    <p class="text-slate-600">{{ detail.procheUtilisateur.telephone || '' }}</p>
                  </template>
                  <p v-else class="font-bold text-slate-800">Aucun proche associé.</p>
                </div>

                <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
                  <i class="fa-solid fa-triangle-exclamation"></i> Historique d'urgence SOS récent
                </p>
                <div v-if="detail.sosRecents.length === 0" class="rounded-2xl bg-[#F2F2DE] p-4 text-sm text-slate-400">
                  Aucune alerte SOS récente déclenchée.
                </div>
                <div v-else class="grid gap-2 rounded-2xl bg-[#F2F2DE] p-4 text-sm">
                  <div v-for="s in detail.sosRecents" :key="s.id" class="rounded-xl bg-white/80 px-3 py-2">
                    <p class="font-bold text-slate-800">{{ formaterDateSos(s.dateHeure) }}</p>
                    <p class="text-xs text-slate-500">{{ s.commentaire || 'Alerte SOS déclenchée.' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-2 flex justify-end gap-3">
              <button type="button" class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#333D2A]/20 transition hover:opacity-90" @click="fermerDetail">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Fermer le Profil</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="procheCree"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        @click="fermerProcheCree"
      >
        <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" @click.stop>
          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <i class="fa-solid fa-key"></i>
              </div>
              <h2 class="text-xl font-black tracking-tight text-slate-950">Compte proche créé</h2>
            </div>
            <button type="button" @click="fermerProcheCree" class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <p class="text-sm text-slate-600">
            Le compte de <strong>{{ procheCree.nomComplet }}</strong> a été créé. Communique-lui ce mot de passe temporaire :
          </p>
          <div class="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span class="text-lg font-black tracking-widest text-slate-950">{{ procheCree.motDePasse }}</span>
            <button type="button" @click="copierMotDePasse" class="text-slate-500 hover:text-slate-800">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>

          <div class="mt-2 flex justify-end gap-3">
            <button type="button" @click="fermerProcheCree" class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#333D2A]/20 transition hover:opacity-90">
              <i class="fa-solid fa-check"></i>
              <span>J'ai noté</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
