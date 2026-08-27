<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { useToast } from '@/composables/index.js';
import { getGuideByUtilisateurId, getGroupeDuGuide } from '@/services/guideService.js';
import { getPelerinsDuGroupe } from '@/services/pelerinService.js';
import { getUtilisateurs } from '@/services/utilisateurService.js';
import { getSos } from '@/services/sosService.js';
import PageHeader from '@/components/ui/PageHeader.vue';
import SosPanel from '@/components/ui/SosPanel.vue';

const auth = useAuthStore();
const { error: toastErreur } = useToast();

const guide = ref(null);
const groupe = ref(null);
const pelerinsDuGroupe = ref([]);
const utilisateurs = ref([]);
const sosActifs = ref([]);

const pelerinMap = computed(() => Object.fromEntries(pelerinsDuGroupe.value.map((p) => [p.id, p])));
const utilisateurMap = computed(() => Object.fromEntries(utilisateurs.value.map((u) => [u.id, u])));

function nomResolver(pelerinId) {
  return utilisateurMap.value[pelerinMap.value[pelerinId]?.utilisateurId]?.nomComplet || 'Pèlerin inconnu';
}

async function charger() {
  try {
    guide.value = await getGuideByUtilisateurId(auth.user?.id);
    if (!guide.value) return;
    groupe.value = await getGroupeDuGuide(guide.value.id);
    if (!groupe.value) return;
    const [pels, sos, users] = await Promise.all([
      getPelerinsDuGroupe(groupe.value.id),
      getSos(),
      getUtilisateurs(),
    ]);
    pelerinsDuGroupe.value = pels;
    utilisateurs.value = users;
    const idsPelerins = pels.map((p) => p.id);
    sosActifs.value = sos.filter((s) => idsPelerins.includes(s.pelerinId) && s.statut === 'EN_ATTENTE');
  } catch (e) {
    toastErreur(e.message);
  }
}
onMounted(charger);
</script>

<template>
  <section>
    <PageHeader
      kicker="Sécurité"
      title="Bureau d'Urgence et Intervention Rapide"
      subtitle="Pôle d'assistance critique d'égarement pour les pèlerins de ton groupe."
    />

    <div v-if="!guide" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Aucun profil guide associé à ce compte.</div>

    <div v-else-if="!groupe" class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Aucun groupe ne t'a encore été assigné.</div>

    <article v-else class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <SosPanel :sos-actifs="sosActifs" :resolve-nom="nomResolver" @resolved="charger" />
    </article>
  </section>
</template>
