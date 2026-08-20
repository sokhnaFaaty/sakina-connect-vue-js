<script setup>
import { ref, onMounted } from 'vue';
import { getSos } from '@/services/sosService.js';
import { getPelerins } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';

const sosActifs = ref([]);
const pelerinMap = ref({});
const utilisateurMap = ref({});

async function charger() {
  const [sos, pelerins, utilisateurs] = await Promise.all([
    getSos(), getPelerins(), getUtilisateurs()
  ]);
  
  // On crée des maps pour retrouver le nom du pèlerin rapidement
  pelerinMap.value = Object.fromEntries(pelerins.map(p => [p.id, p]));
  utilisateurMap.value = Object.fromEntries(utilisateurs.map(u => [u.id, u]));

  // Admin : on filtre juste sur le statut "EN_ATTENTE"
  sosActifs.value = sos.filter(s => s.statut === 'EN_ATTENTE');
}

function nomResolver(pelerinId) {
  const pelerin = pelerinMap.value[pelerinId];
  if (!pelerin) return 'Pèlerin inconnu';
  return utilisateurMap.value[pelerin.utilisateurId]?.nomComplet || 'Pèlerin inconnu';
}

onMounted(charger);
</script>

<template>
  <section>
    <PageHeader title="Bureau d'Urgence Général" kicker="Sécurité" subtitle="Pôle d'assistance critique de tous les groupes." />
    <SosPanel :sos-actifs="sosActifs" :nom-resolver="nomResolver" @resolved="charger" />
  </section>
</template>