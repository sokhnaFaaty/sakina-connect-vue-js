<script setup>
defineProps({
  colonnes: { type: Array, required: true }, // [{ label: 'Nom', key: 'nom' }, { label: 'Actions', render: (row) => ... }]
  lignes: { type: Array, required: true }
});
defineEmits(['modifier', 'supprimer']);
</script>

<template>
  <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs font-black uppercase text-slate-500">
          <tr>
            <th v-for="col in colonnes" :key="col.key" class="px-5 py-4">{{ col.label }}</th>
            <th class="px-5 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="ligne in lignes" :key="ligne.id" class="transition hover:bg-slate-50">
            <td v-for="col in colonnes" :key="col.key" class="px-5 py-4 text-slate-700">
              <!-- Si une fonction 'render' est passée, on l'utilise -->
              <template v-if="col.render">{{ col.render(ligne) }}</template>
              <!-- Sinon on affiche simplement la propriété de l'objet -->
              <template v-else>{{ ligne[col.key] }}</template>
            </td>
            <td class="px-5 py-4 text-center whitespace-nowrap">
              <button @click="$emit('modifier', ligne)" class="text-indigo-500 hover:text-indigo-700 mr-3">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button @click="$emit('supprimer', ligne)" class="text-rose-500 hover:text-rose-700">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="lignes.length === 0">
            <td :colspan="colonnes.length + 1" class="px-5 py-8 text-center text-slate-400">Aucune donnée disponible.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>