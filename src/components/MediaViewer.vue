<script setup>
import { computed } from "vue";

const props = defineProps({
  open: Boolean,
  item: { type: Object, default: null },
});

defineEmits(["close"]);

const kind = computed(() => {
  const source = props.item?.source || "";
  if (props.item?.type) return props.item.type;
  if (/\.mp4(?:$|\?)/i.test(source)) return "video";
  if (/\.pdf(?:$|\?)/i.test(source)) return "pdf";
  return "image";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="viewer">
      <section
        v-if="open && item"
        class="media-viewer"
        role="dialog"
        aria-modal="true"
        :aria-label="item.title"
      >
        <button
          class="viewer-close"
          type="button"
          aria-label="Close viewer"
          @click="$emit('close')"
        >
          Close
        </button>
        <video v-if="kind === 'video'" :src="item.source" controls autoplay playsinline />
        <iframe
          v-else-if="kind === 'web' || kind === 'voice' || kind === 'pdf'"
          :src="item.source"
          :allow="
            kind === 'voice' ? 'microphone; autoplay; clipboard-read; clipboard-write' : 'autoplay'
          "
          :title="item.title"
        />
        <img v-else :src="item.source" :alt="item.title" />
      </section>
    </Transition>
  </Teleport>
</template>
