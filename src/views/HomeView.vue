<script setup>
import ContentCard from "@/components/ContentCard.vue";
import { contentItems, ministryCards } from "@/data/content";

defineEmits(["open-content", "open-ministry"]);
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
</script>

<template>
  <section class="view home-view">
    <div class="section-heading">
      <div>
        <p class="eyebrow">RAISA Humanoid ITS</p>
        <h1>Explore RAISA</h1>
      </div>
      <img :src="assetUrl('assets/raisa-thumb.png')" alt="RAISA humanoid robot" />
    </div>

    <section class="content-section">
      <h2>Featured</h2>
      <div class="content-grid">
        <ContentCard
          v-for="item in contentItems"
          :key="item.id"
          :item="item"
          @open="$emit('open-content', $event)"
        />
      </div>
    </section>

    <section class="content-section ministry-section">
      <h2>Kementerian</h2>
      <div class="ministry-grid">
        <button
          v-for="item in ministryCards"
          :key="item.id"
          type="button"
          @click="$emit('open-ministry', item.id)"
        >
          <img :src="item.image" :alt="item.title" />
          <span>{{ item.title }}</span>
        </button>
      </div>
    </section>
  </section>
</template>
