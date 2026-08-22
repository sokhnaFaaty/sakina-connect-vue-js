<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { getPelerinByUtilisateurId } from '@/services/pelerinService.js'
import { getSos, createSos } from '@/services/sosService.js'
import { useConfirm, useToast } from '@/composables/index.js'

const auth = useAuthStore()
const pelerin = ref(null)
const sosActif = ref(false)
const { askConfirmation } = useConfirm()
const { success, error } = useToast()

async function charger() {
  pelerin.value = await getPelerinByUtilisateurId(auth.user.id)
  if (pelerin.value) {
    const sos = await getSos()
    sosActif.value = sos.some(s => s.pelerinId === pelerin.value.id && s.statut === 'EN_ATTENTE')
  }
}
onMounted(charger)

async function lancerSos() {
  if (!await askConfirmation('Envoyer ta position actuelle ?')) return
  try {
    // À remplacer par la vraie géolocalisation
    await createSos({ pelerinId: pelerin.value.id, guideId: null, latitude: 0, longitude: 0, statut: 'EN_ATTENTE' })
    success('Alerte envoyée.')
    charger()
  } catch (e) { error(e.message) }
}
</script>

<template>
  <section>
    <div class="mb-6 rounded-3xl bg-[#B40909] p-6 text-white">
      <h1 class="text-2xl font-black">Mon Espace SOS</h1>
    </div>
    <div class="flex justify-center">
      <button v-if="!sosActif" @click="lancerSos" class="h-32 w-32 rounded-full bg-rose-600 text-3xl font-black text-white shadow-2xl">SOS</button>
      <p v-else class="text-rose-600 font-black text-xl">Alerte en cours...</p>
    </div>
  </section>
</template>