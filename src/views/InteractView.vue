<script setup>
import { primaryActions } from "@/data/interactions";

defineEmits(["action"]);
</script>

<template>
  <section class="view interact-view">
    <div class="view-title">
      <p class="eyebrow">Robot controls</p>
      <h1>Interact with RAISA</h1>
    </div>
    <div class="action-grid">
      <button
        v-for="item in primaryActions"
        :key="item.id"
        type="button"
        @click="$emit('action', item.action)"
      >
        <component :is="item.icon" :size="36" stroke-width="1.7" />
        <span>{{ item.title }}</span>
      </button>
    </div>
  </section>
</template>
