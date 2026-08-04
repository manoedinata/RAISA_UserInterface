<script setup>
defineProps({ item: { type: Object, required: true } });
defineEmits(["open"]);
</script>

<template>
  <button class="content-card" type="button" @click="$emit('open', item)">
    <div class="content-card-image"><img :src="item.image" :alt="item.title" /></div>
    <span>{{ item.title }}</span>
  </button>
</template>
