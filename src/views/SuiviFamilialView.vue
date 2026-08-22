<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { getProcheByUtilisateurId } from '@/services/procheService.js'
import { getPelerins, getGroupes, getGuides, getUtilisateurs, getPlanning, getSos } from '@/services/index.js'
import { PageHeader } from '@/components/ui/index.js'

const auth = useAuthStore()
const pelerin = ref(null)
const planning = ref([])
const position = ref('Aucune position')

async function charger() {
  const proche = await getProcheByUtilisateurId(auth.user.id)
  if (!proche) return
  const [pels, groupes, guides, users, plans, sos] = await Promise.all([getPelerins(), getGroupes(), getGuides(), getUtilisateurs(), getPlanning(), getSos()])
  pelerin.value = pels.find(p => p.id === proche.pelerinId)
  if (pelerin.value) {
    planning.value = plans.filter(p => p.groupeId === pelerin.value.groupeId)
    const s = sos.find(x => x.pelerinId === pelerin.value.id)
    if (s) position.value = `${s.latitude}, ${s.longitude}`
  }
}
onMounted(charger)
</script>

<template>
  <section>
    <header class="mb-6 rounded-3xl bg-gradient-to-r from-[#8a5a1f] to-[#BC7B3B] p-6 text-white">
      <h1 class="text-2xl font-black">Suivi Familial</h1>
    </header>
    <div v-if="pelerin" class="bg-white p-6 rounded-2xl border mb-6">
      <p class="font-black text-lg">{{ pelerin.nomComplet }}</p>
      <p class="text-sm text-slate-500">Position : {{ position }}</p>
    </div>
    <div class="grid gap-4">
      <div v-for="p in planning" :key="p.id" class="border bg-white p-4 rounded-xl">
        <p class="font-bold">{{ p.titre }}</p>
        <p class="text-xs text-slate-500">{{ p.date }} - {{ p.lieu }}</p>
      </div>
    </div>
  </section>
</template>