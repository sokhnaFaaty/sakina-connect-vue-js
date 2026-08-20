<script setup>
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { createGuide, updateGuide } from '@/services/guideService.js';
import { uploadUserPhoto } from '@/services/cloudinaryService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  guide: { type: Object, default: null },
});
const emit = defineEmits(['success', 'close']);

const { succes, erreur } = useToast();
const chargement = ref(false);

const nomComplet = ref(props.guide ? props.guide.nomComplet : '');
const email = ref(props.guide ? props.guide.email : '');
const telephone = ref(props.guide ? props.guide.telephone : '');
const disponibilite = ref(props.guide ? props.guide.disponibilite : true);
const photoFile = ref(null);

async function soumettre() {
  if (!nomComplet.value || !email.value || !telephone.value) {
    erreur("Nom, email et téléphone sont obligatoires.");
    return;
  }

  chargement.value = true;
  try {
    let photoUrl = props.guide?.photo || '';
    if (photoFile.value) {
      const result = await uploadUserPhoto(photoFile.value);
      photoUrl = result.photoUrl;
    }

    if (props.guide) {
      await updateGuide(props.guide.id, {
        utilisateurId: props.guide.utilisateurId,
        nomComplet: nomComplet.value,
        email: email.value,
        telephone: telephone.value,
        disponibilite: disponibilite.value,
        photo: photoUrl,
      });
      succes("Guide modifié.");
    } else {
      const { motDePasseGenere } = await createGuide({
        nomComplet: nomComplet.value,
        email: email.value,
        telephone: telephone.value,
        disponibilite: disponibilite.value,
        photo: photoUrl,
      });
      succes(`Guide créé ! Mot de passe temporaire : ${motDePasseGenere}`);
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
    <AppInput v-model="nomComplet" label="Nom complet de l'Oustadh *" />
    <AppInput v-model="email" type="email" label="Email *" />
    <AppInput v-model="telephone" type="text" label="Téléphone de contact *" />

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase text-slate-500">Photo de profil (facultatif)</label>
      <input ref="photoFile" type="file" accept="image/*" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
    </div>

    <label class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <span>Actuellement en Service actif</span>
      <input type="checkbox" v-model="disponibilite" class="h-5 w-5 accent-[#333D2A]" />
    </label>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" @click="$emit('close')" type="button">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">Enregistrer</AppButton>
    </div>
  </form>
</template>