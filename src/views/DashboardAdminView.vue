<script setup>
import { ref, onMounted } from 'vue'
import { getPelerins } from '@/services/pelerinService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getSos } from '@/services/sosService.js'
import { getAnnonces } from '@/services/annonceService.js'
import { useToast } from '@/composables/index.js'

const stats = ref({ pelerins: 0, sos: 0, groupes: 0 })
const { error } = useToast()
async function charger() {
  try {
    const [p, g, s, a] = await Promise.all([getPelerins(), getGroupes(), getSos(), getAnnonces()])
    stats.value = {
      pelerins: p.length,
      groupes: g.length,
      sos: s.filter((x) => x.statut === 'EN_ATTENTE').length,
      annonces: a.length,
    }
  } catch (e) {
    error(e.message)
  }
}
onMounted(charger)
</script>
<template>
  <section>
    <header class="mb-6 bg-[#333D2A] text-white p-6 rounded-3xl">
      <h1 class="text-2xl font-black">Console du Siège Sakina</h1>
      <p class="text-slate-300">Suivi logistique en temps réel.</p>
    </header>
    <div class="grid gap-4 sm:grid-cols-4 mb-6">
      <div class="bg-white p-5 rounded-2xl border">
        <h3 class="text-xs text-slate-400">Total pèlerins</h3>
        <p class="text-2xl font-black">{{ stats.pelerins }}</p>
      </div>
      <div class="bg-white p-5 rounded-2xl border">
        <h3 class="text-xs text-slate-400">SOS actifs</h3>
        <p class="text-2xl font-black text-rose-600">{{ stats.sos }}</p>
      </div>
      <div class="bg-white p-5 rounded-2xl border">
        <h3 class="text-xs text-slate-400">Groupes</h3>
        <p class="text-2xl font-black">{{ stats.groupes }}</p>
      </div>
    </div>
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Le composant SosPanel doit être créé pour que ça marche -->
      <SosPanel :sos-actifs="stats.sos" @resolved="charger" />
      <div class="bg-white p-6 rounded-2xl border">
        <h2 class="font-black mb-4">Dernières annonces</h2>
        <!-- ... -->
      </div>
    </div>
  </section>
</template>
