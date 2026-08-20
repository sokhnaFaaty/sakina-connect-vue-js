<script setup>
import { ref, onMounted } from 'vue';
import { getSos } from '@/services/sosService.js';

const sosActifs = ref([]);
async function charger() { sosActifs.value = (await getSos()).filter(s => s.statut === 'EN_ATTENTE'); }
onMounted(charger);
</script>
<template>
  <section>
    <PageHeader title="Bureau d'Urgence" kicker="Sécurité" subtitle="Pôle d'assistance critique." />
    <SosPanel :sos-actifs="sosActifs" @resolved="charger" />
  </section>
</template>