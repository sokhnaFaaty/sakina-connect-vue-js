<script setup>
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { STATUT_ANNONCE } from '@/config/constantes.js';
import { createAnnonce, updateAnnonce } from '@/services/annonceService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  annonce: { type: Object, default: null },
  user: { type: Object, required: true },
  role: { type: String, required: true },
  groupes: { type: Array, default: () => [] },
});
const emit = defineEmits(['success', 'close']);

const { succes, erreur } = useToast();
const chargement = ref(false);

const titre = ref(props.annonce?.titre || '');
const contenu = ref(props.annonce?.contenu || '');
const urgence = ref(props.annonce?.urgence || false);
// Admin a le choix du groupe, le guide voit son groupe forcé
const groupeId = ref(props.annonce?.groupeId || null);

const isAdmin = props.role === 'ADMIN';

async function soumettre() {
  if (!titre.value || !contenu.value) {
    erreur("Titre et contenu sont obligatoires.");
    return;
  }

  chargement.value = true;
  try {
    if (props.annonce) {
      // En modification, le guide re-soumet à validation
      const payload = { titre: titre.value, contenu: contenu.value, urgence: urgence.value, groupeId: groupeId.value };
      if (!isAdmin) payload.statut = STATUT_ANNONCE.EN_ATTENTE;
      await updateAnnonce(props.annonce.id, payload);
      succes(isAdmin ? "Annonce modifiée." : "Annonce renvoyée pour validation.");
    } else {
      const statut = isAdmin ? STATUT_ANNONCE.APPROUVE : STATUT_ANNONCE.EN_ATTENTE;
      await createAnnonce({
        titre: titre.value,
        contenu: contenu.value,
        urgence: urgence.value,
        auteurId: props.user.id,
        groupeId: groupeId.value,
        statut,
      });
      succes(isAdmin ? "Annonce publiée." : "Annonce soumise pour validation.");
    }
    emit('success');
    emit('close');
  } catch (e) {
    erreur(e.message);
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="soumettre" class="grid gap-4">
    <div v-if="isAdmin">
      <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Destinataires *</label>
      <select v-model="groupeId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <option :value="null">Tous les pèlerins (Général)</option>
        <option v-for="g in groupes" :key="g.id" :value="g.id">Groupe : {{ g.nom }}</option>
      </select>
    </div>

    <AppInput v-model="titre" label="Titre du communiqué *" />
    
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Contenu du message *</label>
      <textarea v-model="contenu" rows="4" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Décrivez clairement les détails..."></textarea>
    </div>

    <label class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm">
      <input type="checkbox" v-model="urgence" class="h-5 w-5 accent-rose-600" />
      <span>Marquer comme urgent</span>
    </label>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" @click="$emit('close')" type="button">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">Publier</AppButton>
    </div>
  </form>
</template>