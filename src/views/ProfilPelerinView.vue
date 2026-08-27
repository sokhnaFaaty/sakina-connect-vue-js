<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore, saveSession } from '@/stores/auth.js'; // Assure-toi d'exporter saveSession depuis ton store
import { getPelerinByUtilisateurId, updatePelerin } from '@/services/pelerinService.js';
import { getProcheByPelerinId } from '@/services/procheService.js';
import { updateUtilisateur, getUtilisateurs } from '@/services/utilisateurService.js';
import { getGroupes } from '@/services/groupeService.js';
import { getGuides } from '@/services/guideService.js';
import { getHotels } from '@/services/hotelService.js';
import { emailExiste, telephoneExiste } from '@/services/validationService.js';
import { validateEmailFormat, validateTelephone } from '@/utils/validators.js';
import { useToast } from '@/composables/index.js';
import PageHeader from '@/components/ui/PageHeader.vue';

const auth = useAuthStore();
const { success, error: toastErreur } = useToast();

const chargement = ref(true);
const pelerin = ref(null);
const groupe = ref(null);
const guideU = ref(null);
const procheUser = ref(null);
const lienParente = ref('');
const hotelMecque = ref('-');
const hotelMedine = ref('-');

// Champs modifiables
const telephone = ref('');
const email = ref('');
const photo = ref('');
const informationsMedicales = ref('');
const motDePasse = ref('');
const motDePasseConfirm = ref('');
const photoVisible = ref(false);

// Erreurs sous les champs
const errEmail = ref('');
const errTel = ref('');
const errMdp = ref('');
const errMdpConfirm = ref('');

async function charger() {
  try {
    pelerin.value = await getPelerinByUtilisateurId(auth.user?.id);
    if (!pelerin.value) return;

    const [groupes, guides, hotels, utilisateurs, procheAssocie] = await Promise.all([
      getGroupes(), getGuides(), getHotels(), getUtilisateurs(), getProcheByPelerinId(pelerin.value.id),
    ]);
    const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));

    // Le contact d'urgence (proche) est en lecture seule
    procheUser.value = procheAssocie ? utilisateurMap[procheAssocie.utilisateurId] : null;
    lienParente.value = procheAssocie?.lienParente || '';
    groupe.value = groupes.find((g) => g.id === pelerin.value.groupeId);
    const guide = groupe.value ? guides.find((g) => g.id === groupe.value.guideId) : null;
    guideU.value = guide ? utilisateurMap[guide.utilisateurId] : null;
    hotelMecque.value = groupe.value ? hotels.find((h) => h.id === groupe.value.hotelMecqueId)?.nom || '-' : '-';
    hotelMedine.value = groupe.value ? hotels.find((h) => h.id === groupe.value.hotelMedineId)?.nom || '-' : '-';

    telephone.value = auth.user?.telephone || '';
    email.value = auth.user?.email || '';
    photo.value = auth.user?.photo || '';
    informationsMedicales.value = pelerin.value.informationsMedicales || '';
  } catch (e) {
    toastErreur(e.message);
  } finally {
    chargement.value = false;
  }
}
onMounted(charger);

async function sauvegarder() {
  errEmail.value = ''; errTel.value = ''; errMdp.value = ''; errMdpConfirm.value = '';

  const e1 = validateEmailFormat(email.value.trim());
  if (e1) { errEmail.value = e1; return; }
  const e2 = validateTelephone(telephone.value.trim());
  if (e2) { errTel.value = e2; return; }

  // Mot de passe : uniquement si l'utilisateur en saisit un nouveau, il doit être confirmé
  if (motDePasse.value || motDePasseConfirm.value) {
    if (!motDePasse.value) { errMdp.value = 'Saisissez le nouveau mot de passe.'; return; }
    if (motDePasse.value !== motDePasseConfirm.value) { errMdpConfirm.value = 'Les mots de passe ne correspondent pas.'; return; }
  }

  try {
    // Unicité email / téléphone (en excluant son propre compte)
    if (await emailExiste(email.value.trim(), auth.user.id)) { errEmail.value = 'Cet email est déjà utilisé.'; return; }
    if (await telephoneExiste(telephone.value.trim(), auth.user.id)) { errTel.value = 'Ce téléphone est déjà utilisé.'; return; }

    const majUtilisateur = { email: email.value.trim(), telephone: telephone.value.trim(), photo: photo.value.trim() };
    if (motDePasse.value) majUtilisateur.motDePasse = motDePasse.value;
    await updateUtilisateur(auth.user.id, majUtilisateur);

    await updatePelerin(pelerin.value.id, {
      numeroPasseport: pelerin.value.numeroPasseport,
      statutVisa: pelerin.value.statutVisa,
      groupeId: pelerin.value.groupeId,
      informationsMedicales: informationsMedicales.value.trim(),
    });

    // Rafraîchit le store + la session pour que la navbar reflète les changements
    const nouvelUser = { ...auth.user, ...majUtilisateur };
    delete nouvelUser.motDePasse;
    auth.user = nouvelUser;
    localStorage.setItem('currentUser', JSON.stringify(nouvelUser));

    motDePasse.value = '';
    motDePasseConfirm.value = '';
    success('Profil mis à jour avec succès.');
    await charger();
  } catch (e) {
    toastErreur(e.message);
  }
}

function conformite(ok) {
  return ok
    ? '<span class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Valide</span>'
    : '<span class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>';
}
</script>

<template>
  <!-- Garde : aucun profil pèlerin associé -->
  <section v-if="!chargement && !pelerin" class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
    <p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p>
  </section>

  <section v-else>
    <PageHeader
      kicker="Identité"
      title="Mon Profil Spirituel & Bureau d'Identité"
      subtitle="Consultez et mettez à jour vos justificatifs."
    />

    <div class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <!-- Carte gauche : Informations Personnelles -->
      <article class="rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-user text-[#333D2A]"></i> Informations Personnelles</h2>
          <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">Modifiable par vous</span>
        </div>

        <div class="mb-5 flex items-start gap-4">
          <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
            <img v-if="auth.user?.photo" :src="auth.user.photo" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user text-2xl"></i></div>
          </div>
          <div class="flex-1">
            <p class="font-bold text-slate-900">Photo de Profil</p>
            <p class="text-xs text-slate-500">Choisissez une photo représentative pour faciliter votre identification par l'agence sur place.</p>
            <button type="button" @click="photoVisible = !photoVisible" class="mt-1 text-xs font-bold text-[#333D2A] underline">Choisissez un avatar ou entrer une URL.</button>
            <input
              v-show="photoVisible"
              v-model="photo"
              type="text"
              placeholder="https://…"
              class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div class="mb-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Numéro de téléphone</label>
            <input v-model="telephone" type="text" placeholder="77 123 45 67" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
            <p v-if="errTel" class="mt-1 text-xs text-rose-600">{{ errTel }}</p>
          </div>
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Adresse email</label>
            <input v-model="email" type="email" placeholder="email@exemple.com" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
            <p v-if="errEmail" class="mt-1 text-xs text-rose-600">{{ errEmail }}</p>
          </div>
        </div>

        <!-- Contact d'urgence : votre proche (lecture seule) -->
        <div v-if="procheUser" class="mt-5 rounded-2xl bg-rose-50 p-4">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-rose-600"><i class="fa-solid fa-hand-holding-heart"></i> Contact d'urgence — votre proche</p>
          <div class="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Nom complet</p>
              <p class="mt-0.5 font-bold text-slate-800">{{ procheUser.nomComplet || '-' }}{{ lienParente ? ` (${lienParente})` : '' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Téléphone</p>
              <p class="mt-0.5 font-bold text-slate-800">{{ procheUser.telephone || '-' }}</p>
            </div>
          </div>
        </div>

        <div class="mt-5">
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Informations médicales de sécurité</label>
          <textarea v-model="informationsMedicales" rows="2" placeholder="Ex: Hypertension, prendre régulièrement mes médicaments" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"></textarea>
          <p class="mt-1 text-[11px] italic text-slate-400">Ces données médicales sont exclusivement transmises aux guides référents et à l'admin pour assurer votre sécurité en cas d'urgence médicale.</p>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Mot de passe de connexion</label>
            <input v-model="motDePasse" type="password" placeholder="Laisser vide pour ne pas changer" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
            <p v-if="errMdp" class="mt-1 text-xs text-rose-600">{{ errMdp }}</p>
          </div>
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Confirmer le mot de passe</label>
            <input v-model="motDePasseConfirm" type="password" placeholder="Retapez le nouveau mot de passe" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
            <p v-if="errMdpConfirm" class="mt-1 text-xs text-rose-600">{{ errMdpConfirm }}</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button @click="sauvegarder" class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-5 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90">
            <i class="fa-solid fa-circle-check"></i> Enregistrer les modifications
          </button>
        </div>
      </article>

      <!-- Colonne droite : Conformité + Guide -->
      <div class="grid gap-6">
        <article class="rounded-[2rem] border border-t-4 border-slate-200 border-t-[#225BBF] bg-white p-6 shadow-sm">
          <h2 class="mb-3 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-file-shield text-[#333D2A]"></i> Conformité réglementaire</h2>
          <p class="mb-3 text-xs text-slate-500">Vérifiez la validité de vos documents officiels avant votre présentation à l'aéroport.</p>
          <div class="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm">
            <span class="text-slate-600">Passeport scanné</span><span v-html="conformite(!!pelerin?.numeroPasseport)"></span>
          </div>
          <div class="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm">
            <span class="text-slate-600">Visa Omra / Hajj</span><span v-html="conformite(pelerin?.statutVisa === 'APPROUVE')"></span>
          </div>
          <div class="flex items-center justify-between py-2.5 text-sm">
            <span class="text-slate-600">Vaccin obligatoire ACWY</span><span v-html="conformite(!!pelerin?.certificatVaccin)"></span>
          </div>
        </article>

        <article class="rounded-[2rem] bg-[#333D2A] p-6 text-white shadow-sm">
          <h2 class="mb-3 flex items-center gap-2 text-base font-black text-[#BC7B3B]"><i class="fa-solid fa-user-shield"></i> Votre guide sur place</h2>
          <p class="mb-3 text-xs text-slate-300">Pour toute question rituelle ou logistique d'urgence, votre guide reste joignable.</p>
          <p class="text-sm"><span class="text-slate-400">Nom :</span> <span class="font-bold">{{ guideU?.nomComplet || 'Non assigné' }}</span></p>
          <p class="text-sm"><span class="text-slate-400">Téléphone :</span> <span class="font-bold">{{ guideU?.telephone || '-' }}</span></p>
          <p class="text-sm"><span class="text-slate-400">Email :</span> <span class="font-bold">{{ guideU?.email || '-' }}</span></p>
        </article>
      </div>
    </div>

    <!-- Informations administratives (lecture seule) -->
    <article class="mt-6 rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
      <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-clipboard-list text-[#333D2A]"></i> Informations administratives</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="info in [
          ['Nom complet', auth.user?.nomComplet || '-'],
          ['Numéro de passeport', pelerin?.numeroPasseport || '-'],
          ['Statut visa', pelerin?.statutVisa || '-'],
          ['Groupe de voyage', groupe?.nom || '-'],
          ['Guide assigné', guideU?.nomComplet || '-'],
          ['Code de badge pèlerin', 'SKN-' + (pelerin?.id || '').slice(0, 6).toUpperCase()],
          ['Hôtel Mecque', hotelMecque],
          ['Hôtel Médine', hotelMedine],
          ['Date de départ', groupe?.dateDepart || '-'],
          ['Date de retour', groupe?.dateRetour || '-'],
        ]" :key="info[0]" class="rounded-2xl bg-[#F2F2DE]/60 px-4 py-3">
          <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{{ info[0] }}</p>
          <p class="mt-0.5 text-sm font-bold text-slate-800">{{ info[1] }}</p>
        </div>
      </div>
    </article>
  </section>
</template>
