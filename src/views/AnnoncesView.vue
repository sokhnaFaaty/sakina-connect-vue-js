<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { useToast, useConfirm, useModal } from '@/composables/index.js';
import { getAnnoncesVisibles, deleteAnnonce } from '@/services/annonceService.js';
import { getGroupes } from '@/services/groupeService.js';
import AnnonceForm from '@/components/forms/AnnonceForm.vue';

const auth = useAuthStore(); const annonces = ref([]); const groupes = ref([]);
const { open: openModal } = useModal();
const { askConfirmation } = useConfirm();
const { success, error } = useToast();

async function charger() {
  try { [annonces.value, groupes.value] = await Promise.all([getAnnoncesVisibles(auth.utilisateur, auth.role), getGroupes()]); } catch (e) { error(e.message); }
}
onMounted(charger);

async function supprimer(a) {
  if (!await askConfirmation(`Supprimer l'annonce ?`)) return;
  try { await deleteAnnonce(a.id); success('Annonce supprimée.'); charger(); } catch (e) { error(e.message); }
}
</script>
<template>
  <section>
    <PageHeader kicker="Communication" title="Tableau d'affichage" subtitle="Alertes en temps réel.">
      <template #actions v-if="auth.role !== 'PELERIN'"><AppButton @click="openModal(AnnonceForm, { props: { user: auth.utilisateur, role: auth.role, groupes, onSucces: charger } })">Publier</AppButton></template>
    </PageHeader>
    <div class="grid gap-4">
      <div v-for="a in annonces" :key="a.id" class="rounded-2xl border border-l-4 bg-white p-4 shadow-sm" :class="a.urgence ? 'border-l-rose-600' : 'border-l-slate-300'">
        <h3 class="font-black">{{ a.titre }}</h3>
        <p class="text-sm text-slate-600 whitespace-pre-line">{{ a.contenu }}</p>
        <div class="mt-2 flex gap-2"><AppButton variant="secondary" size="sm" @click="openModal(AnnonceForm, { props: { annonce: a, user: auth.utilisateur, role: auth.role, groupes, onSucces: charger } })">Modifier</AppButton><AppButton variant="danger" size="sm" @click="supprimer(a)">Supprimer</AppButton></div>
      </div>
    </div>
  </section>
</template>