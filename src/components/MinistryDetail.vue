<script setup>
import { computed } from "vue";

const props = defineProps({ item: { type: Object, default: null } });
const leaders = computed(() => (Array.isArray(props.item?.wakil) ? props.item.wakil : []));
const officials = computed(() =>
  Array.isArray(props.item?.ingredients) ? props.item.ingredients : [],
);
</script>

<template>
  <article v-if="item" class="ministry-detail">
    <div class="ministry-summary">
      <img :src="item.image" :alt="item.name" />
      <div>
        <p class="eyebrow">Kementerian Republik Indonesia</p>
        <h2>{{ item.name }}</h2>
        <dl>
          <dt>Menteri</dt>
          <dd>{{ item.price }}</dd>
        </dl>
      </div>
    </div>
    <section v-if="leaders.length">
      <h3>Wakil Menteri</h3>
      <ul>
        <li v-for="person in leaders" :key="person">{{ person }}</li>
      </ul>
    </section>
    <section v-if="officials.length">
      <h3>Pejabat Kementerian</h3>
      <ul>
        <li v-for="person in officials" :key="person">{{ person }}</li>
      </ul>
    </section>
  </article>
</template>
