<script setup>
import { X } from "lucide-vue-next";

defineProps({
  open: Boolean,
  title: { type: String, required: true },
  width: { type: String, default: "min(92vw, 720px)" },
});

defineEmits(["close"]);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" role="presentation" @click.self="$emit('close')">
        <section
          class="modal-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :style="{ width }"
        >
          <header>
            <h2>{{ title }}</h2>
            <button
              class="icon-button"
              type="button"
              :aria-label="`Close ${title}`"
              @click="$emit('close')"
            >
              <X />
            </button>
          </header>
          <div class="modal-content"><slot /></div>
          <footer v-if="$slots.footer"><slot name="footer" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
