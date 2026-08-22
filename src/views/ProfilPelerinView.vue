<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { saveSession } from '@/utils/auth.js'
import { getPelerinByUtilisateurId, updatePelerin } from '@/services/pelerinService.js'
import { updateUtilisateur } from '@/services/utilisateurService.js'
import { useToast } from '@/composables/index.js'
import { AppInput, AppButton, PageHeader } from '@/components/ui/index.js'

const auth = useAuthStore()
const { success, error } = useToast()
const pelerin = ref(null)
const form = ref({ nomComplet: '', email: '', telephone: '', photo: '' })

async function charger() {
  pelerin.value = await getPelerinByUtilisateurId(auth.user.id)
  form.value = {
    nomComplet: auth.user.nomComplet,
    email: auth.user.email,
    telephone: auth.user.telephone,
    photo: auth.user.photo || ''
  }
}
onMounted(charger)

async function sauvegarder() {
  try {
    await updateUtilisateur(auth.user.id, form.value)
    await updatePelerin(pelerin.value.id, { informationsMedicales: form.value.informationsMedicales })
    auth.user = { ...auth.user, ...form.value }
    saveSession(auth.user, auth.token)
    success('Profil mis à jour.')
  } catch (e) { error(e.message) }
}
</script>

<template>
  <section>
    <PageHeader title="Mon Profil Spirituel" />
    <div class="max-w-2xl bg-white p-6 rounded-2xl border grid gap-4">
      <AppInput v-model="form.nomComplet" label="Nom complet" />
      <AppInput v-model="form.telephone" label="Téléphone" />
      <AppInput v-model="form.email" label="Email" />
      <div>
        <label class="block text-xs font-bold mb-1">Informations médicales</label>
        <textarea v-model="form.informationsMedicales" rows="3" class="w-full border rounded-xl p-2"></textarea>
      </div>
      <AppButton @click="sauvegarder">Enregistrer</AppButton>
    </div>
  </section>
</template>