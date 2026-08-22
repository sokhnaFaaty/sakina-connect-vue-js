<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast, useConfirm, useDrawer } from '@/composables/index.js'
import {
  getPelerins,
  deletePelerin,
} from '@/services/pelerinService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getHotels } from '@/services/hotelService.js'
import { getGuides } from '@/services/guideService.js'
import { getProches } from '@/services/procheService.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ViewToggle from '@/components/ui/ViewToggle.vue'
import PelerinForm from '@/components/forms/PelerinForm.vue'

// Port fidèle de js/pages/pelerinsPage.js
const router = useRouter()
const { success, error: toastError } = useToast()
const { askConfirmation } = useConfirm()
const { open: openDrawer, isOpen: drawerOuvert } = useDrawer()

const pelerins = ref([])
const groupes = ref([])
const utilisateurs = ref([])
const hotels = ref([])
const guides = ref([])
const proches = ref([])

async function charger() {
  try {
    ;[pelerins.value, groupes.value, utilisateurs.value, hotels.value, guides.value, proches.value] = await Promise.all([
      getPelerins(), getGroupes(), getUtilisateurs(), getHotels(), getGuides(), getProches(),
    ])
  } catch (e) { toastError(e.message) }
}
onMounted(charger)

// Rechargement après fermeture du formulaire (PelerinForm émet 'close')
let formOuvertIci = false
watch(drawerOuvert, async (ouvert) => {
  if (!ouvert && formOuvertIci) {
    formOuvertIci = false
    await charger()
  }
})

const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])))
const groupeMap = computed(() => Object.fromEntries(groupes.value.map((g) => [g.id, g])))

// Vue tableau / cartes (persistée comme en Vanilla)
const vue = ref(localStorage.getItem('sakina:view:pelerins') || 'table')
function changerVue(v) {
  vue.value = v
  try { localStorage.setItem('sakina:view:pelerins', v) } catch { /* ignore */ }
}

// Filtres : recherche (nom, passeport) + groupe
const searchTerm = ref('')
const groupeFilter = ref('')

const pelerinsFiltres = computed(() => {
  const terme = searchTerm.value.trim().toLowerCase()
  return pelerins.value.filter((p) => {
    const nom = String(utilisateurMap.value[p.utilisateurId]?.nomComplet || '').toLowerCase()
    const passeport = String(p.numeroPasseport || '').toLowerCase()
    const matcheRecherche = !terme || nom.includes(terme) || passeport.includes(terme)
    const matcheGroupe = !groupeFilter.value || p.groupeId === groupeFilter.value
    return matcheRecherche && matcheGroupe
  })
})

function ouvrirForm(pelerin = null) {
  formOuvertIci = true
  openDrawer(PelerinForm, {
    title: pelerin ? 'Modifier un Pèlerin' : 'Ajouter un Pèlerin',
    icon: 'fa-user',
    props: { pelerin, groupes: groupes.value },
  })
}

async function supprimer(pelerin) {
  if (!await askConfirmation(`Voulez-vous supprimer ce pèlerin ?\nIl sera archivé (avec son compte) et pourra être restauré.`)) return
  try {
    await deletePelerin(pelerin.id)
    success('Pèlerin archivé.')
    await charger()
  } catch (e) { toastError(e.message) }
}

// Modale détail d'un pèlerin
const detailOuvert = ref(false)
const pelerinDetaille = ref(null)

async function ouvrirDetail(pelerin) {
  pelerinDetaille.value = pelerin
  detailOuvert.value = true
}
</script>

<template>
  <section>
    <PageHeader kicker="Sécurité & Suivi" title="Manifeste des Pèlerins" subtitle="Enregistrez, suivez et validez la conformité réglementaire de tous les inscrits.">
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
          @click="router.push('/archives')"
        >
          <i class="fa-solid fa-trash-can-arrow-up"></i>
          <span>Corbeille</span>
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
          @click="ouvrirForm()"
        >
          <i class="fa-solid fa-user-plus"></i>
          <span>Ajouter un Nouveau Pelerin</span>
        </button>
      </template>
    </PageHeader>

    <!-- Barre de filtres -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative flex-1 sm:max-w-xs">
          <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
          <input
            v-model="searchTerm"
            type="search"
            placeholder="Rechercher un pèlerin (nom, passeport)…"
            class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <select v-model="groupeFilter" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:w-56">
          <option value="">Tous les groupes</option>
          <option v-for="g in groupes" :key="g.id" :value="g.id">{{ g.nom }}</option>
        </select>
      </div>
      <ViewToggle :model-value="vue" @update:model-value="changerVue" />
    </div>

    <!-- Vue tableau -->
    <article v-if="vue === 'table'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div v-if="pelerinsFiltres.length" class="overflow-hidden rounded-3xl border border-slate-200 bg-white">
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
                  <img v-if="utilisateurMap[p.utilisateurId]?.photo" :src="utilisateurMap[p.utilisateurId].photo" alt="" class="h-10 w-10 rounded-full object-cover" />
                  <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><i class="fa-solid fa-user"></i></div>
                </td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700"><strong class="font-bold text-slate-950">{{ utilisateurMap[p.utilisateurId]?.nomComplet || '—' }}</strong></td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ p.numeroPasseport }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ groupeMap[p.groupeId]?.nom || '-' }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <span v-if="p.statutVisa === 'APPROUVE'" class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Approuvé</span>
                  <span v-else class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{{ p.statutVisa }}</span>
                </td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">{{ p.informationsMedicales || '----' }}</td>
                <td class="border-t border-slate-100 px-5 py-4 align-middle text-sm text-slate-700">
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" title="Voir" @click="ouvrirDetail(p)"><i class="fa-solid fa-eye"></i></button>
                    <button type="button" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" title="Modifier" @click="ouvrirForm(p)"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white" title="Supprimer" @click="supprimer(p)"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
        Aucun pèlerin ne correspond à votre recherche.
      </div>
    </article>

    <!-- Vue cartes -->
    <template v-else>
      <div v-if="pelerinsFiltres.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="p in pelerinsFiltres" :key="p.id" class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="flex-1 p-5">
            <div class="mb-3 flex items-center gap-3">
              <img v-if="utilisateurMap[p.utilisateurId]?.photo" :src="utilisateurMap[p.utilisateurId].photo" alt="" class="h-10 w-10 rounded-full object-cover" />
              <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><i class="fa-solid fa-user"></i></div>
              <div>
                <h3 class="font-black text-slate-950">{{ utilisateurMap[p.utilisateurId]?.nomComplet || '—' }}</h3>
                <p class="text-xs text-slate-500">{{ groupeMap[p.groupeId]?.nom || 'Sans groupe' }}</p>
              </div>
            </div>
            <div class="grid gap-2 text-sm text-slate-600">
              <p class="flex items-center gap-2"><i class="fa-solid fa-passport w-4 text-[#333D2A]"></i> {{ p.numeroPasseport }}</p>
              <p class="flex items-center gap-2"><i class="fa-solid fa-file-shield w-4 text-[#333D2A]"></i>
                <span v-if="p.statutVisa === 'APPROUVE'" class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Approuvé</span>
                <span v-else class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{{ p.statutVisa }}</span>
              </p>
              <p class="flex items-center gap-2"><i class="fa-solid fa-heart-pulse w-4 text-[#333D2A]"></i> {{ p.informationsMedicales || '----' }}</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 bg-[#F2F2DE]/70 px-5 py-3">
            <button type="button" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" title="Voir" @click="ouvrirDetail(p)"><i class="fa-solid fa-eye"></i></button>
            <button type="button" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" title="Modifier" @click="ouvrirForm(p)"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white" title="Supprimer" @click="supprimer(p)"><i class="fa-solid fa-trash"></i></button>
          </div>
        </article>
      </div>
      <div v-else class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Aucun pèlerin ne correspond à votre recherche.</div>
    </template>

    <!-- Modale détail du pèlerin -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="detailOuvert && pelerinDetaille" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" @click="detailOuvert = false">
          <div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" @click.stop>
            <div class="-m-6 mb-0 flex items-start gap-4 border-b border-slate-100 p-6 pb-5">
              <div class="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                <img v-if="utilisateurMap[pelerinDetaille.utilisateurId]?.photo" :src="utilisateurMap[pelerinDetaille.utilisateurId].photo" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user text-2xl"></i></div>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-black text-slate-950">{{ utilisateurMap[pelerinDetaille.utilisateurId]?.nomComplet || '-' }}</h2>
                  <span class="rounded-full bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">{{ String(pelerinDetaille.id).slice(0, 5).toUpperCase() }}</span>
                </div>
                <p class="text-sm text-slate-500">Passeport : {{ pelerinDetaille.numeroPasseport }}</p>
                <p class="mt-1 flex items-center gap-1 text-sm text-slate-500">Statut du Visa :
                  <span v-if="pelerinDetaille.statutVisa === 'APPROUVE'" class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700"><i class="fa-solid fa-check"></i> Approuvé</span>
                  <span v-else class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{{ pelerinDetaille.statutVisa }}</span>
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
                  <p class="mb-3 font-bold text-slate-800">{{ (() => { const g = guides.find((x) => x.id === groupeMap[pelerinDetaille.groupeId]?.guideId); return g ? utilisateurMap[g.utilisateurId]?.nomComplet || '-' : '-'; })() }}</p>
                  <p class="text-slate-500">Groupe de voyage :</p>
                  <p class="font-bold text-slate-800">{{ groupeMap[pelerinDetaille.groupeId]?.nom || '-' }}</p>
                </div>

                <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0B6E4F]">
                  <i class="fa-solid fa-hotel"></i> Hébergements d'hôtels
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-2xl bg-[#F2F2DE] p-3 text-sm">
                    <p class="text-xs font-bold text-slate-500">LA MECQUE :</p>
                    <p class="font-bold text-slate-800">{{ hotels.find((h) => h.id === groupeMap[pelerinDetaille.groupeId]?.hotelMecqueId)?.nom || '-' }}</p>
                  </div>
                  <div class="rounded-2xl bg-[#F2F2DE] p-3 text-sm">
                    <p class="text-xs font-bold text-slate-500">MÉDINE :</p>
                    <p class="font-bold text-slate-800">{{ hotels.find((h) => h.id === groupeMap[pelerinDetaille.groupeId]?.hotelMedineId)?.nom || '-' }}</p>
                  </div>
                </div>
              </div>

              <div>
                <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
                  <i class="fa-solid fa-heart-pulse"></i> Fiche médicale &amp; pathologies
                </p>
                <div class="rounded-2xl bg-rose-50 p-4 text-sm">
                  <p class="text-xs font-bold text-rose-700">PATHOLOGIES SIGNALÉES :</p>
                  <p class="mt-1 text-slate-700">{{ pelerinDetaille.informationsMedicales || 'Aucune pathologie signalée.' }}</p>
                </div>

                <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
                  <i class="fa-solid fa-hand-holding-heart"></i> Proches &amp; contacts d'urgence
                </p>
                <div class="rounded-2xl bg-[#F2F2DE] p-4 text-sm">
                  <p class="text-slate-500">Contact d'urgence — Proche associé (Portail Famille) :</p>
                  <template v-for="pr in [proches.find((x) => x.pelerinId === pelerinDetaille.id)]" :key="(pr?.id)">
                    <p v-if="pr" class="font-bold text-slate-800">{{ utilisateurMap[pr.utilisateurId]?.nomComplet }}{{ pr.lienParente ? ` (${pr.lienParente})` : '' }}</p>
                    <p v-if="pr" class="text-slate-600">{{ utilisateurMap[pr.utilisateurId]?.telephone || '' }}</p>
                    <p v-if="!pr" class="font-bold text-slate-800">Aucun proche associé.</p>
                  </template>
                </div>

                <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
                  <i class="fa-solid fa-triangle-exclamation"></i> Historique d'urgence SOS récent
                </p>
                <div class="rounded-2xl bg-[#F2F2DE] p-4 text-sm text-slate-400">
                  Aucune alerte SOS récente déclenchée.
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
                @click="detailOuvert = false"
              >Fermer le Profil</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
