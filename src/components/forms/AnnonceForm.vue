<script setup>
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast.js';
import { createAnnonce, updateAnnonce, STATUT_ANNONCE } from '@/services/annonceService.js';

const props = defineProps({
  annonce: { type: Object, default: null },
  user: { type: Object, required: true },
  role: { type: String, required: true },
  groupes: { type: Array, default: () => [] },
  monGroupeId: { type: String, default: null },
});
const emit = defineEmits(['success', 'close']);

const { success, error } = useToast();
const chargement = ref(false);

const isAdmin = computed(() => props.role === 'ADMIN');
const isEdit = !!props.annonce;

const titre = ref(props.annonce?.titre || '');
const contenu = ref(props.annonce?.contenu || '');
const urgence = ref(props.annonce?.urgence || false);
const cible = ref(isAdmin.value ? (props.annonce?.groupeId || '') : '');
const titreError = ref('');
const contenuError = ref('');

const porteeUrgence = computed(() => (isAdmin.value ? 'les pèlerins concernés' : 'les pèlerins de ton groupe'));

async function soumettre() {
  let hasError = false;
  titreError.value = !titre.value.trim() ? 'Le titre est obligatoire.' : '';
  contenuError.value = !contenu.value.trim() ? 'Le contenu est obligatoire.' : '';
  if (titreError.value || contenuError.value) hasError = true;
  if (hasError) return;

  const cibleGroupeId = isAdmin.value ? (cible.value || null) : props.monGroupeId;
  chargement.value = true;
  try {
    if (isEdit) {
      const payload = { titre: titre.value.trim(), contenu: contenu.value.trim(), urgence: urgence.value, groupeId: cibleGroupeId };
      if (props.role === 'GUIDE') {
        payload.statut = STATUT_ANNONCE.EN_ATTENTE;
        payload.motifRejet = '';
      }
      await updateAnnonce(props.annonce.id, payload);
      success(props.role === 'GUIDE' ? 'Communiqué renvoyé pour validation.' : 'Communiqué modifié.');
    } else {
      const statut = props.role === 'GUIDE' ? STATUT_ANNONCE.EN_ATTENTE : STATUT_ANNONCE.APPROUVE;
      await createAnnonce({ titre: titre.value.trim(), contenu: contenu.value.trim(), urgence: urgence.value, auteurId: props.user.id, groupeId: cibleGroupeId, statut });
      success(props.role === 'GUIDE' ? 'Communiqué envoyé pour validation.' : 'Communiqué publié.');
    }
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
    <div v-if="isAdmin">
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="annonceGroupe">Destinataires du communiqué *</label>
      <select id="annonceGroupe" v-model="cible" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <option value="">Tous les pèlerins (communiqué général)</option>
        <option v-for="g in groupes" :key="g.id" :value="g.id">Groupe : {{ g.nom }}</option>
      </select>
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
      <i class="fa-solid fa-circle-info text-[#333D2A]"></i>
      Ce communiqué sera adressé aux <span class="font-black text-[#333D2A]">pèlerins de ton groupe</span>, après validation par l'administrateur.
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="annonceTitre">Titre du communiqué *</label>
      <input id="annonceTitre" v-model="titre" type="text" placeholder="Ex: Modification de la ligne de Bus de la Mecque" class="w-full rounded-2xl border bg-white px-4 py-3 text-sm" :class="titreError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200'" />
      <p v-if="titreError" class="mt-1 text-xs text-rose-600">{{ titreError }}</p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="annonceContenu">Contenu du message *</label>
      <textarea id="annonceContenu" v-model="contenu" rows="4" placeholder="Décrivez clairement et précisément les détails ..." class="w-full rounded-2xl border bg-white px-4 py-3 text-sm" :class="contenuError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200'"></textarea>
      <p v-if="contenuError" class="mt-1 text-xs text-rose-600">{{ contenuError }}</p>
    </div>

    <label class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-slate-700">
      <input type="checkbox" v-model="urgence" class="h-5 w-5 accent-rose-600" />
      <span>Marquer comme urgent (affiche un bandeau rouge chez {{ porteeUrgence }})</span>
    </label>

    <div class="mt-2 flex justify-end gap-3">
      <button type="button" @click="$emit('close')" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Annuler</button>
      <button type="submit" :disabled="chargement" class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#333D2A]/20 transition hover:opacity-90 disabled:opacity-60">
        <i class="fa-solid" :class="isEdit ? 'fa-floppy-disk' : 'fa-paper-plane'"></i>
        <span>{{ isEdit ? 'Enregistrer' : "Publier l'annonce" }}</span>
      </button>
    </div>
  </form>
</template>
