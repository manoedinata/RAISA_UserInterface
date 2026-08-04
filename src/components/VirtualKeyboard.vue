<script setup>
const rows = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

defineProps({ modelValue: { type: String, default: "" } });
const emit = defineEmits(["update:modelValue", "submit"]);

function append(value, key) {
  emit("update:modelValue", `${value}${key}`);
}
</script>

<template>
  <div class="virtual-keyboard">
    <div v-for="(row, index) in rows" :key="index" class="key-row">
      <button v-for="key in row" :key="key" type="button" @click="append(modelValue, key)">
        {{ key }}
      </button>
    </div>
    <div class="key-row actions">
      <button type="button" class="wide" @click="append(modelValue, ' ')">Space</button>
      <button type="button" @click="$emit('update:modelValue', modelValue.slice(0, -1))">
        Backspace
      </button>
      <button type="button" class="primary" @click="$emit('submit')">Enter</button>
    </div>
  </div>
</template>
