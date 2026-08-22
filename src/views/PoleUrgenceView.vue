<script setup>
import { ref, onMounted } from 'vue'
import { getSos, getPelerins, getUtilisateurs } from '@/services/index.js'
import SosPanel from '@/components/ui/SosPanel.vue'
import { PageHeader } from '@/components/ui/index.js'

const sosActifs = ref([])
const utilisateurs = ref([])
const pelerins = ref([])

async function charger() {
  const [sos, pels, users] = await Promise.all([getSos(), getPelerins(), getUtilisateurs()])
  utilisateurs.value = users
  pelerins.value = pels
  sosActifs.value = sos.filter(s => s.statut === 'EN_ATTENTE')
}

function nomResolver(id) {
  const p = pelerins.value.find(p => p.id === id)
  return p ? utilisateurs.value.find(u => u.id === p.utilisateurId)?.nomComplet : 'Inconnu'
}

onMounted(charger)
</script>

<template>
  <section>
    <PageHeader kicker="Sécurité" title="Bureau d'Urgence Général" />
    <SosPanel :sos-actifs="sosActifs" :nom-resolver="nomResolver" @resolved="charger" />
  </section>
</template>