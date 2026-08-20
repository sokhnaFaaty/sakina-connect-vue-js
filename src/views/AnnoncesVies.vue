<script setup>
import { ref, onMounted } from 'vue';
import { useToast, useConfirm, useModal } from '@/composables/index.js';
import { getAnnoncesVisibles, deleteAnnonce } from '@/services/annonceService.js';
import AnnonceForm from '@/components/forms/AnnonceForm.vue';
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore(); const annonces = ref([]); const search = ref('');
const { ouvrir } = useModal(); const { demanderConfirmation } = useConfirm(); const { erreur, succes } = useToast();

async function charger() {
  try { annonces.value = await getAnnoncesVisibles(auth.utilisateur, auth.role); } catch (e) { erreur(e.message); }
}
onMounted(charger);

async function supprimer(a) {
  if (!await demanderConfirmation(`Supprimer l'annonce ?`)) return;
  try { await deleteAnnonce(a.id); succes('Annonce supprimée.'); charger(); } catch (e) { erreur(e.message); }
}
</script>
<template>
  <section>
    <PageHeader kicker="Communication" title="Tableau d'affichage" subtitle="Alertes en temps réel.">
      <template #actions><AppButton v-if="auth.role !== 'PELERIN'" @click="ouvrir(AnnonceForm, { props: { onSucces: charger } })">Publier</AppButton></template>
    </PageHeader>
    <div class="mb-4"><AppInput v-model="search" placeholder="Rechercher un communiqué..." /></div>
    <div class="grid gap-4">
      <CarteAnnonce v-for="a in annonces.filter(p => p.titre.includes(search))" :key="a.id" :annonce="a" @supprimer="supprimer(a)" @modifier="ouvrir(AnnonceForm, { props: { annonce: a, onSucces: charger } })" />
    </div>
  </section>
</template>