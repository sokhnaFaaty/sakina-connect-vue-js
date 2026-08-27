<script setup>
import { ref, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { updateUtilisateur } from '@/services/utilisateurService.js';
import { emailExiste, telephoneExiste } from '@/services/validationService.js';
import { validateEmailFormat, validateTelephone } from '@/utils/validators.js';
import { useToast } from '@/composables/index.js';
import PageHeader from '@/components/ui/PageHeader.vue';

const auth = useAuthStore();
const { success, error } = useToast();

const nom = ref(auth.user?.nomComplet || '');
const telephone = ref(auth.user?.telephone ? String(auth.user.telephone) : '');
const email = ref(auth.user?.email || '');
const photo = ref(auth.user?.photo || '');
const motDePasse = ref('');
const motDePasseConfirm = ref('');

const erreurs = ref({
  nom: '',
  telephone: '',
  email: '',
  motDePasse: '',
  motDePasseConfirm: '',
});

const montrerPhotoInput = ref(false);
const champPhoto = ref(null);

function togglePhotoInput() {
  montrerPhotoInput.value = !montrerPhotoInput.value;
  if (montrerPhotoInput.value) {
    nextTick(() => champPhoto.value?.focus());
  }
}

async function save() {
  const nomComplet = nom.value.trim();
  const tel = telephone.value.trim();
  const mail = email.value.trim();
  const urlPhoto = photo.value.trim();

  erreurs.value = { nom: '', telephone: '', email: '', motDePasse: '', motDePasseConfirm: '' };
  let hasError = false;

  if (!nomComplet) {
    erreurs.value.nom = 'Le nom complet est obligatoire.';
    hasError = true;
  }

  const emailError = validateEmailFormat(mail);
  if (emailError) {
    erreurs.value.email = emailError;
    hasError = true;
  }

  const telError = validateTelephone(tel);
  if (telError) {
    erreurs.value.telephone = telError;
    hasError = true;
  }

  if (motDePasse.value || motDePasseConfirm.value) {
    if (!motDePasse.value) {
      erreurs.value.motDePasse = 'Saisissez le nouveau mot de passe.';
      hasError = true;
    }
    if (motDePasse.value !== motDePasseConfirm.value) {
      erreurs.value.motDePasseConfirm = 'Les mots de passe ne correspondent pas.';
      hasError = true;
    }
  }

  if (hasError) return;

  try {
    if (await emailExiste(mail, auth.user.id)) {
      erreurs.value.email = 'Cet email est déjà utilisé.';
      return;
    }
    if (await telephoneExiste(tel, auth.user.id)) {
      erreurs.value.telephone = 'Ce téléphone est déjà utilisé.';
      return;
    }

    const maj = { nomComplet, telephone: tel, email: mail, photo: urlPhoto };
    if (motDePasse.value) maj.motDePasse = motDePasse.value;

    await updateUtilisateur(auth.user.id, maj);

    const nouvelUser = { ...auth.user, nomComplet, telephone: tel, email: mail, photo: urlPhoto };
    delete nouvelUser.motDePasse;
    auth.user = nouvelUser;
    localStorage.setItem('currentUser', JSON.stringify(nouvelUser));

    nom.value = nomComplet;
    telephone.value = tel;
    email.value = mail;
    photo.value = urlPhoto;
    motDePasse.value = '';
    motDePasseConfirm.value = '';
    montrerPhotoInput.value = false;

    success('Profil mis à jour avec succès.');
  } catch (e) {
    error(e.message);
  }
}
</script>

<template>
  <section>
    <PageHeader kicker="Identité" title="Mon Profil de Proche" subtitle="Gérez vos informations de contact personnelles." />

    <article class="mx-auto max-w-2xl rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
      <h2 class="mb-5 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-user text-[#333D2A]"></i> Mes informations de contact</h2>

      <div class="mb-5 flex items-start gap-4">
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
          <img v-if="photo" :src="photo" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user text-2xl"></i></div>
        </div>
        <div class="flex-1">
          <p class="font-bold text-slate-900">Photo de Profil</p>
          <p class="text-xs text-slate-500">Choisissez une photo représentative pour faciliter votre identification par l'agence sur place.</p>
          <button type="button" @click="togglePhotoInput" class="mt-1 text-xs font-bold text-[#333D2A] underline">Choisissez un avatar ou entrer une URL.</button>
          <input
            v-show="montrerPhotoInput"
            ref="champPhoto"
            v-model="photo"
            class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            type="text"
            placeholder="https://…"
          />
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheNom">Nom complet</label>
        <input
          id="procheNom"
          v-model="nom"
          class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          :class="{ 'border-rose-500': !!erreurs.nom }"
          type="text"
        />
        <p v-if="erreurs.nom" class="mt-1 text-xs text-rose-600">{{ erreurs.nom }}</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheTel">Numéro de téléphone</label>
          <input
            id="procheTel"
            v-model="telephone"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            :class="{ 'border-rose-500': !!erreurs.telephone }"
            type="text"
            placeholder="77 123 45 67"
          />
          <p v-if="erreurs.telephone" class="mt-1 text-xs text-rose-600">{{ erreurs.telephone }}</p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheEmail">Adresse email</label>
          <input
            id="procheEmail"
            v-model="email"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            :class="{ 'border-rose-500': !!erreurs.email }"
            type="email"
            placeholder="email@exemple.com"
          />
          <p v-if="erreurs.email" class="mt-1 text-xs text-rose-600">{{ erreurs.email }}</p>
        </div>
      </div>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheMotDePasse">Mot de passe de connexion</label>
          <input
            id="procheMotDePasse"
            v-model="motDePasse"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            :class="{ 'border-rose-500': !!erreurs.motDePasse }"
            type="password"
            placeholder="Laisser vide pour ne pas changer"
          />
          <p v-if="erreurs.motDePasse" class="mt-1 text-xs text-rose-600">{{ erreurs.motDePasse }}</p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheMotDePasseConfirm">Confirmer le mot de passe</label>
          <input
            id="procheMotDePasseConfirm"
            v-model="motDePasseConfirm"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            :class="{ 'border-rose-500': !!erreurs.motDePasseConfirm }"
            type="password"
            placeholder="Retapez le nouveau mot de passe"
          />
          <p v-if="erreurs.motDePasseConfirm" class="mt-1 text-xs text-rose-600">{{ erreurs.motDePasseConfirm }}</p>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button type="button" @click="save" class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-5 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90">
          <i class="fa-solid fa-circle-check"></i> Enregistrer les modifications
        </button>
      </div>
    </article>
  </section>
</template>
