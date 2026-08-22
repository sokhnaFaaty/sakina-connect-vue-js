<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { getGuideByUtilisateurId } from '@/services/guideService.js'
import { getGroupes } from '@/services/groupeService.js'
import { getPelerins } from '@/services/pelerinService.js'
import { getUtilisateurs } from '@/services/utilisateurService.js'
import { getSos } from '@/services/sosService.js'
import SosPanel from '@/components/ui/SosPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

const auth = useAuthStore()
const sosActifs = ref([])
const pelerins = ref([])
const utilisateurs = ref([])
const groupe = ref(null)

async function charger() {
  const guide = await getGuideByUtilisateurId(auth.user.id)
  if (!guide) return
  const groupes = await getGroupes()
  groupe.value = groupes.find(g => g.guideId === guide.id)
  if (groupe.value) {
    const [pels, users, sos] = await Promise.all([
      getPelerins(),
      getUtilisateurs(),
      getSos()
    ])
    pelerins.value = pels.filter(p => p.groupeId === groupe.value.id)
    utilisateurs.value = users
    const ids = new Set(pelerins.value.map(p => p.id))
    sosActifs.value = sos.filter(s => s.statut === 'EN_ATTENTE' && ids.has(s.pelerinId))
  }
}

function nomResolver(id) {
  const p = pelerins.value.find(p => p.id === id)
  return p ? utilisateurs.value.find(u => u.id === p.utilisateurId)?.nomComplet : 'Inconnu'
}

onMounted(charger)
</script>

<template>
  <section>
    <PageHeader kicker="Sécurité" title="Urgence de mon groupe" />
    <SosPanel :sos-actifs="sosActifs" :nom-resolver="nomResolver" @resolved="charger" />
  </section>
</template>