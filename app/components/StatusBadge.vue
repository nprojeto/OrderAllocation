<template>
  <span :class="['badge', 'b-' + status]">{{ STATUS[status] || status }}</span>
</template>
<script setup lang="ts">
import { STATUS } from '~/composables/useFormat'
defineProps<{ status: string }>()
</script>
