<script setup>
import { ref, computed, onMounted } from 'vue';
import { getProches } from '@/services/procheService.js';

const props = defineProps({
  pelerin: { type: Object, required: true },
  utilisateurMap: { type: Object, default: () => ({}) },
  groupe: { type: Object, default: null },
  hotels: { type: Array, default: () => [] },
  guides: { type: Array, default: () => [] },
});

defineEmits(['close']);

const proches = ref([]);

onMounted(async () => {
  try {
    proches.value = await getProches();
  } catch {
    proches.value = [];
  }
});

const utilisateur = computed(() => props.utilisateurMap[props.pelerin.utilisateurId]);
const hotelMecque = computed(() => (props.groupe ? props.hotels.find((h) => h.id === props.groupe.hotelMecqueId)?.nom || '-' : '-'));
const hotelMedine = computed(() => (props.groupe ? props.hotels.find((h) => h.id === props.groupe.hotelMedineId)?.nom || '-' : '-'));
const guideNom = computed(() => {
  const guide = props.groupe ? props.guides.find((g) => g.id === props.groupe.guideId) : null;
  return guide ? props.utilisateurMap[guide.utilisateurId]?.nomComplet || '-' : '-';
});
const procheAssocie = computed(() => proches.value.find((pr) => pr.pelerinId === props.pelerin.id));
const procheUtilisateur = computed(() => (procheAssocie.value ? props.utilisateurMap[procheAssocie.value.utilisateurId] : null));
</script>

<template>
  <div>
    <div class="-m-6 mb-0 flex items-start gap-4 border-b border-slate-100 p-6 pb-5">
      <div class="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
        <img v-if="utilisateur?.photo" :src="utilisateur.photo" class="h-full w-full object-cover" />
        <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user text-2xl"></i></div>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-black text-slate-950">{{ utilisateur?.nomComplet || '-' }}</h2>
          <span class="rounded-full bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">{{ pelerin.id.slice(0, 5).toUpperCase() }}</span>
        </div>
        <p class="text-sm text-slate-500">Passeport : {{ pelerin.numeroPasseport }}</p>
        <p class="mt-1 flex items-center gap-2 text-sm text-slate-500">
          Statut du Visa :
          <span v-if="pelerin.statutVisa === 'APPROUVE'" class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700"><i class="fa-solid fa-check"></i> Approuvé</span>
          <span v-else class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{{ pelerin.statutVisa }}</span>
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
          <p class="mb-3 font-bold text-slate-800">{{ guideNom }}</p>
          <p class="text-slate-500">Groupe de voyage :</p>
          <p class="font-bold text-slate-800">{{ groupe?.nom || '-' }}</p>
        </div>

        <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0B6E4F]">
          <i class="fa-solid fa-hotel"></i> Hébergements d'hôtels
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-2xl bg-[#F2F2DE] p-3 text-sm">
            <p class="text-xs font-bold text-slate-500">LA MECQUE :</p>
            <p class="font-bold text-slate-800">{{ hotelMecque }}</p>
          </div>
          <div class="rounded-2xl bg-[#F2F2DE] p-3 text-sm">
            <p class="text-xs font-bold text-slate-500">MÉDINE :</p>
            <p class="font-bold text-slate-800">{{ hotelMedine }}</p>
          </div>
        </div>
      </div>

      <div>
        <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
          <i class="fa-solid fa-heart-pulse"></i> Fiche médicale &amp; pathologies
        </p>
        <div class="rounded-2xl bg-rose-50 p-4 text-sm">
          <p class="text-xs font-bold text-rose-700">PATHOLOGIES SIGNALÉES :</p>
          <p class="mt-1 text-slate-700">{{ pelerin.informationsMedicales || 'Aucune pathologie signalée.' }}</p>
        </div>

        <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
          <i class="fa-solid fa-hand-holding-heart"></i> Proches &amp; contacts d'urgence
        </p>
        <div class="rounded-2xl bg-[#F2F2DE] p-4 text-sm">
          <p class="text-slate-500">Contact d'urgence — Proche associé (Portail Famille) :</p>
          <template v-if="procheUtilisateur">
            <p class="font-bold text-slate-800">{{ procheUtilisateur.nomComplet }}{{ procheAssocie.lienParente ? ` (${procheAssocie.lienParente})` : '' }}</p>
            <p class="text-slate-600">{{ procheUtilisateur.telephone || '' }}</p>
          </template>
          <p v-else class="font-bold text-slate-800">Aucun proche associé.</p>
        </div>

        <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
          <i class="fa-solid fa-triangle-exclamation"></i> Historique d'urgence SOS récent
        </p>
        <div class="rounded-2xl bg-[#F2F2DE] p-4 text-sm text-slate-400">
          Aucune alerte SOS récente déclenchée.
        </div>
      </div>
    </div>

    <button
      type="button"
      class="mt-5 w-full rounded-2xl bg-[#333D2A] px-4 py-3 text-sm font-extrabold text-white transition hover:opacity-90"
      @click="$emit('close')"
    >
      Fermer le Profil
    </button>
  </div>
</template>
