<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { createGroupe, updateGroupe } from '@/services/groupeService.js';
import { createHotel } from '@/services/hotelService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  groupe: { type: Object, default: null },
  guides: { type: Array, required: true },
  hotels: { type: Array, required: true },
  utilisateurs: { type: Array, default: () => [] },
});
const emit = defineEmits(['success', 'close']);

const { success, error } = useToast();

const estMecque = (ville) => /mecque|makka|makkah/i.test(ville || '');
const estMedine = (ville) => /m[ée]dine|madina|madinah/i.test(ville || '');

const nom = ref(props.groupe?.nom || '');
const guideId = ref(props.groupe?.guideId || '');
const hotelMecqueId = ref(props.groupe?.hotelMecqueId || '');
const hotelMedineId = ref(props.groupe?.hotelMedineId || '');
const dateDepart = ref(props.groupe?.dateDepart || '');
const dateRetour = ref(props.groupe?.dateRetour || '');
const chargement = ref(false);

const erreurNom = ref('');
const erreurGuide = ref('');
const erreurHotelMecque = ref('');
const erreurHotelMedine = ref('');
const erreurDateDepart = ref('');
const erreurDateRetour = ref('');

const hotelsLocales = ref([...props.hotels]);
const utilisateurMap = computed(() => Object.fromEntries(props.utilisateurs.map((u) => [u.id, u])));

const guideOptions = computed(() =>
  props.guides.map((g) => ({
    value: g.id,
    label: utilisateurMap.value[g.utilisateurId]?.nomComplet || g.id,
  }))
);
const hotelsMecque = computed(() => hotelsLocales.value.filter((h) => estMecque(h.ville)));
const hotelsMedine = computed(() => hotelsLocales.value.filter((h) => estMedine(h.ville)));

function validerChamp(valeur, libelle) {
  if (!valeur || String(valeur).trim().length === 0) {
    return `${libelle} est obligatoire.`;
  }
  return null;
}

const hotelVille = ref(null);
const hotelNom = ref('');
const hotelAdresse = ref('');
const hotelTel = ref('');
const hotelEtoiles = ref('5');
const hotelChargement = ref(false);
const erreurHotelNom = ref('');

function ouvrirAjoutHotel(ville) {
  hotelVille.value = ville;
  hotelNom.value = '';
  hotelAdresse.value = '';
  hotelTel.value = '';
  hotelEtoiles.value = '5';
  erreurHotelNom.value = '';
}

function fermerAjoutHotel() {
  hotelVille.value = null;
}

function surTouche(event) {
  if (event.key === 'Escape') fermerAjoutHotel();
}

watch(hotelVille, (ville) => {
  if (ville) window.addEventListener('keydown', surTouche);
  else window.removeEventListener('keydown', surTouche);
});

onBeforeUnmount(() => window.removeEventListener('keydown', surTouche));

async function validerHotel() {
  if (!hotelNom.value.trim()) {
    erreurHotelNom.value = "Le nom de l'hôtel est obligatoire.";
    return;
  }
  erreurHotelNom.value = '';

  hotelChargement.value = true;
  try {
    const nouvel = await createHotel({
      nom: hotelNom.value.trim(),
      ville: hotelVille.value,
      adresse: hotelAdresse.value.trim(),
      telephone: hotelTel.value.trim(),
      nombreEtoiles: hotelEtoiles.value,
    });
    hotelsLocales.value = [...hotelsLocales.value, nouvel];
    if (hotelVille.value === 'La Mecque') hotelMecqueId.value = nouvel.id;
    else hotelMedineId.value = nouvel.id;
    success('Hôtel ajouté.');
    fermerAjoutHotel();
  } catch (e) {
    error(e.message);
  } finally {
    hotelChargement.value = false;
  }
}

async function soumettre() {
  erreurNom.value = validerChamp(nom.value, 'Le nom du groupe');
  erreurGuide.value = validerChamp(guideId.value, 'Le guide');
  erreurHotelMecque.value = validerChamp(hotelMecqueId.value, "L'hôtel à la Mecque");
  erreurHotelMedine.value = validerChamp(hotelMedineId.value, "L'hôtel à Médine");
  erreurDateDepart.value = validerChamp(dateDepart.value, 'La date de départ');
  erreurDateRetour.value = validerChamp(dateRetour.value, 'La date de retour');

  if (
    erreurNom.value ||
    erreurGuide.value ||
    erreurHotelMecque.value ||
    erreurHotelMedine.value ||
    erreurDateDepart.value ||
    erreurDateRetour.value
  ) {
    return;
  }

  chargement.value = true;
  try {
    const payload = {
      nom: nom.value.trim(),
      guideId: guideId.value,
      hotelMecqueId: hotelMecqueId.value,
      hotelMedineId: hotelMedineId.value,
      dateDepart: dateDepart.value,
      dateRetour: dateRetour.value,
    };
    if (props.groupe) {
      await updateGroupe(props.groupe.id, payload);
      success('Groupe modifié avec succès.');
    } else {
      await createGroupe(payload);
      success('Groupe créé avec succès.');
    }
    emit('success');
    emit('close');
  } catch (e) {
    error(e.message);
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="soumettre" class="grid gap-4">
    <AppInput v-model="nom" label="Nom du Groupe *" placeholder="Ex: Groupe A1" :error="erreurNom" />

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Guide responsable *</label>
      <select
        v-model="guideId"
        class="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
        :class="erreurGuide ? 'border-rose-500' : 'border-slate-200'"
      >
        <option value="">Choisir un guide</option>
        <option v-for="g in guideOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
      </select>
      <p v-if="erreurGuide" class="mt-1 text-xs text-rose-600">{{ erreurGuide }}</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Hôtel Mecque *</label>
        <div class="flex items-center gap-2">
          <select
            v-model="hotelMecqueId"
            class="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
            :class="erreurHotelMecque ? 'border-rose-500' : 'border-slate-200'"
          >
            <option value="" disabled hidden>Ex: Fairmont Clock Tower</option>
            <option v-for="h in hotelsMecque" :key="h.id" :value="h.id">{{ h.nom }}</option>
          </select>
          <button
            type="button"
            title="Ajouter un hôtel à la Mecque"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#333D2A] text-white transition hover:opacity-90"
            @click="ouvrirAjoutHotel('La Mecque')"
          >
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        <p v-if="erreurHotelMecque" class="mt-1 text-xs text-rose-600">{{ erreurHotelMecque }}</p>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Hôtel Médine *</label>
        <div class="flex items-center gap-2">
          <select
            v-model="hotelMedineId"
            class="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
            :class="erreurHotelMedine ? 'border-rose-500' : 'border-slate-200'"
          >
            <option value="" disabled hidden>Ex: Anwar Al Madina Hotel</option>
            <option v-for="h in hotelsMedine" :key="h.id" :value="h.id">{{ h.nom }}</option>
          </select>
          <button
            type="button"
            title="Ajouter un hôtel à Médine"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#333D2A] text-white transition hover:opacity-90"
            @click="ouvrirAjoutHotel('Médine')"
          >
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        <p v-if="erreurHotelMedine" class="mt-1 text-xs text-rose-600">{{ erreurHotelMedine }}</p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="hotelVille"
        role="dialog"
        aria-modal="true"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        @click.self="fermerAjoutHotel"
      >
        <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2F2DE] text-[#333D2A]">
                <i class="fa-solid fa-hotel"></i>
              </div>
              <h2 class="text-xl font-black tracking-tight text-slate-950">Ajouter un hôtel à {{ hotelVille }}</h2>
            </div>
            <button
              type="button"
              aria-label="Fermer"
              class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              @click="fermerAjoutHotel"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form class="grid gap-4" @submit.prevent="validerHotel">
            <div>
              <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="hotelNom">Nom de l'hôtel *</label>
              <input
                v-model="hotelNom"
                id="hotelNom"
                type="text"
                placeholder="Ex: Fairmont Clock Tower"
                class="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                :class="erreurHotelNom ? 'border-rose-500' : 'border-slate-200'"
              />
              <p v-if="erreurHotelNom" class="mt-1 text-xs text-rose-600">{{ erreurHotelNom }}</p>
            </div>
            <div>
              <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="hotelVille">Ville</label>
              <input
                :value="hotelVille"
                id="hotelVille"
                type="text"
                readonly
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              />
            </div>
            <div>
              <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="hotelAdresse">Adresse</label>
              <input
                v-model="hotelAdresse"
                id="hotelAdresse"
                type="text"
                placeholder="Ex: Abraj Al Bait"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="hotelTel">Téléphone</label>
                <input
                  v-model="hotelTel"
                  id="hotelTel"
                  type="text"
                  placeholder="+966 ..."
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="hotelEtoiles">Étoiles</label>
                <select v-model="hotelEtoiles" id="hotelEtoiles" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option value="5">5 étoiles</option>
                  <option value="4">4 étoiles</option>
                  <option value="3">3 étoiles</option>
                  <option value="2">2 étoiles</option>
                  <option value="1">1 étoile</option>
                </select>
              </div>
            </div>
            <div class="mt-2 flex justify-end gap-3">
              <button
                type="button"
                class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                @click="fermerAjoutHotel"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="hotelChargement"
                class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#333D2A]/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i class="fa-solid fa-plus"></i>
                <span>Ajouter l'hôtel</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput v-model="dateDepart" type="date" label="Date de Départ *" :error="erreurDateDepart" />
      <AppInput v-model="dateRetour" type="date" label="Date de Retour *" :error="erreurDateRetour" />
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" @click="$emit('close')" type="button">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">
        {{ props.groupe ? 'Mettre à jour' : 'Enregistrer' }}
      </AppButton>
    </div>
  </form>
</template>
