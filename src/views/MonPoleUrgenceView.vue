<script setup>
// Même pattern que PoleUrgenceView, mais filtré par les pèlerins du groupe du guide.
</script>
<template>
  <section>
    <PageHeader title="Intervention Rapide" kicker="Sécurité" />
    <SosPanel :sos-actifs="sosActifs" @resolved="charger" />
  </section>
</template>