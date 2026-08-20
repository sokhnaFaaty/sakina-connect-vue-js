<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { getSos } from '@/services/sosService.js';
import { getGuideByUtilisateurId, getGroupeDuGuide } from '@/services/guideService.js';
import { getPelerinsDuGroupe } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';

const auth = useAuthStore();
const sosActifs = ref([]);
const pelerinMap = ref({});
const utilisateurMap = ref({});

async function charger() {
  // 1. Récupérer le groupe du guide
  const guide = await getGuideByUtilisateurId(auth.utilisateur.id);
  const groupe = await getGroupeDuGuide(guide.id);
  if (!groupe) return;

  // 2. Récupérer les pèlerins de ce groupe
  const [pelerins, utilisateurs, sos] = await Promise.all([
    getPelerinsDuGroupe(groupe.id),
    getUtilisateurs(),
    getSos()
  ]);

  // 3. Préparer les maps
  pelerinMap.value = Object.fromEntries(pelerins.map(p => [p.id, p]));
  utilisateurMap.value = Object.fromEntries(utilisateurs.map(u => [u.id, u]));
  const idsPelerinsGroupe = new Set(pelerins.map(p => p.id));

  // 4. Filtrer les SOS uniquement pour les pèlerins de ce groupe
  sosActifs.value = sos.filter(s => s.statut === 'EN_ATTENTE' && idsPelerinsGroupe.has(s.pelerinId));
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
    <PageHeader title="Intervention Rapide de mon Groupe" kicker="Sécurité" subtitle="Pôle d'assistance critique pour les pèlerins de ton groupe." />
    <SosPanel :sos-actifs="sosActifs" :nom-resolver="nomResolver" @resolved="charger" />
  </section>
</template>