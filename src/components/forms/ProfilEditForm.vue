<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { useToast } from '@/composables/useToast.js';
import { updateUtilisateur } from '@/services/utilisateurService.js';
import { emailExiste, telephoneExiste } from '@/services/validationService.js';
import { uploadUserPhoto } from '@/services/cloudinaryService.js';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps({
  user: { type: Object, required: true },
});
const emit = defineEmits(['success', 'close']);

const auth = useAuthStore();
const { success, error } = useToast();

// Champs modifiables : photo, email, téléphone, mot de passe (le nom reste en lecture seule)
const email = ref(props.user.email || '');
const telephone = ref(props.user.telephone || '');
const motDePasse = ref('');
const motDePasseConfirm = ref('');
const fichierPhoto = ref(null);
const chargement = ref(false);

function surFichier(e) {
  fichierPhoto.value = e.target.files?.[0] || null;
}

async function soumettre() {
  if (!email.value.includes('@')) return error('Adresse email invalide.');
  if (telephone.value.trim().length < 7) return error('Numéro de téléphone invalide.');
  if (motDePasse.value || motDePasseConfirm.value) {
    if (!motDePasse.value) return error('Saisissez le nouveau mot de passe.');
    if (motDePasse.value !== motDePasseConfirm.value) return error('Les mots de passe ne correspondent pas.');
  }

  chargement.value = true;
  try {
    // Unicité (en excluant son propre compte)
    if (await emailExiste(email.value.trim(), props.user.id)) return error('Cet email est déjà utilisé.');
    if (await telephoneExiste(telephone.value.trim(), props.user.id)) return error('Ce téléphone est déjà utilisé.');

    // Nouvelle photo éventuelle (sinon on garde l'actuelle)
    let photo = props.user.photo || '';
    if (fichierPhoto.value) {
      const result = await uploadUserPhoto(fichierPhoto.value);
      photo = result.photoUrl;
    }

    const maj = { email: email.value.trim(), telephone: telephone.value.trim(), photo };
    if (motDePasse.value) maj.motDePasse = motDePasse.value;
    await updateUtilisateur(props.user.id, maj);

    // Rafraîchit le store + localStorage (l'avatar de la navbar se met à jour seul)
    const nouvelUser = { ...props.user, email: maj.email, telephone: maj.telephone, photo };
    auth.user = nouvelUser;
    localStorage.setItem('currentUser', JSON.stringify(nouvelUser));

    success('Profil mis à jour avec succès.');
    emit('success');
    emit('close');
  } catch (e) {
    error(e.message);
  } finally {
    chargement.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="soumettre" class="grid gap-4">
    <div class="flex items-center gap-4">
      <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-xl font-black text-white">
        <img v-if="user.photo" :src="user.photo" alt="" class="h-full w-full object-cover" />
        <template v-else>{{ user.nomComplet?.charAt(0).toUpperCase() || '?' }}</template>
      </div>
      <div class="flex-1">
        <p class="font-bold text-slate-900 dark:text-slate-100">{{ user.nomComplet || '-' }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">Choisissez une image pour remplacer votre photo actuelle.</p>
      </div>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Photo (facultatif)</label>
      <input
        type="file"
        accept="image/*"
        class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        @change="surFichier"
      />
    </div>

    <AppInput v-model="email" type="email" label="Adresse email *" placeholder="email@exemple.com" />
    <AppInput v-model="telephone" label="Numéro de téléphone *" placeholder="77 123 45 67" />

    <div class="grid gap-4 sm:grid-cols-2">
      <AppInput v-model="motDePasse" type="password" label="Nouveau mot de passe" placeholder="Laisser vide pour ne pas changer" />
      <AppInput v-model="motDePasseConfirm" type="password" label="Confirmer le mot de passe" placeholder="Retapez le mot de passe" />
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" type="button" @click="$emit('close')">Annuler</AppButton>
      <AppButton type="submit" :disabled="chargement">
        <i v-if="chargement" class="fa-solid fa-spinner animate-spin"></i>
        Enregistrer
      </AppButton>
    </div>
  </form>
</template>
