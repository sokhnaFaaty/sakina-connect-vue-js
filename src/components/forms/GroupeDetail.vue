<script setup>
import { computed } from 'vue';

const props = defineProps({
  groupe: { type: Object, required: true },
  guides: { type: Array, default: () => [] },
  hotels: { type: Array, default: () => [] },
  pelerins: { type: Array, default: () => [] },

  
  utilisateurs: { type: Array, default: () => [] },
});

const utilisateurMap = computed(() => Object.fromEntries(props.utilisateurs.map((u) => [u.id, u])));
const guideNom = computed(() => {
  const guide = props.guides.find((g) => g.id === props.groupe.guideId);
  return utilisateurMap.value[guide?.utilisateurId]?.nomComplet || '-';
});
const hotelMecque = computed(() => props.hotels.find((h) => h.id === props.groupe.hotelMecqueId)?.nom || '-');
const hotelMedine = computed(() => props.hotels.find((h) => h.id === props.groupe.hotelMedineId)?.nom || '-');
const membres = computed(() => props.pelerins.filter((p) => p.groupeId === props.groupe.id));
</script>

<template>
  <div class="grid gap-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-2xl bg-[#F2F2DE] p-5 dark:bg-slate-700/50">
        <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">
          <i class="fa-solid fa-user text-[#07744E]"></i> Informations générales
        </p>
        <dl class="grid gap-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500 dark:text-slate-400">ID du groupe :</dt><dd class="font-semibold">{{ groupe.id.slice(0, 6).toUpperCase() }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500 dark:text-slate-400">Nom :</dt><dd class="font-semibold">{{ groupe.nom }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500 dark:text-slate-400">Guide responsable :</dt><dd class="font-semibold">{{ guideNom }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500 dark:text-slate-400">Pèlerins inscrits :</dt><dd class="font-semibold">{{ membres.length }}</dd></div>
        </dl>
      </div>
      <div class="rounded-2xl bg-[#F2F2DE] p-4 dark:bg-slate-700/50">
        <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">
          <i class="fa-solid fa-location-dot text-[#07744E]"></i> Informations de voyage
        </p>
        <dl class="grid gap-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500 dark:text-slate-400">Hôtel Mecque :</dt><dd class="font-semibold">{{ hotelMecque }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500 dark:text-slate-400">Hôtel Médine :</dt><dd class="font-semibold">{{ hotelMedine }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500 dark:text-slate-400">Jour de départ :</dt><dd class="font-semibold">{{ groupe.dateDepart || '-' }}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500 dark:text-slate-400">Jour de retour :</dt><dd class="font-semibold">{{ groupe.dateRetour || '-' }}</dd></div>
        </dl>
      </div>
    </div>

    <div>
      <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">
        <i class="fa-solid fa-users text-[#07744E]"></i> Membres du groupe ({{ membres.length }})
      </p>
      <div class="rounded-2xl border border-slate-200 p-4 dark:border-slate-600">
        <template v-if="membres.length">
          <div
            v-for="p in membres"
            :key="p.id"
            class="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-700"
          >
            <span class="font-bold text-slate-800 dark:text-slate-100">{{ utilisateurMap[p.utilisateurId]?.nomComplet || '-' }}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">Passeport : {{ p.numeroPasseport }} &nbsp; ID : {{ p.id.slice(0, 6).toUpperCase() }}</span>
          </div>
        </template>
        <p v-else class="text-sm text-slate-400 dark:text-slate-500">Aucun pèlerin dans ce groupe pour l'instant.</p>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        type="button"
        class="rounded-2xl bg-[#333D2A] px-5 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90"
        @click="$emit('close')"
      >
        Fermer
      </button>
    </div>
  </div>
</template>
