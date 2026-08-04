<script setup>
import { BatteryMedium, CircleHelp, House, Music2, Settings, Wifi, Info } from "lucide-vue-next";

const props = defineProps({
  activeView: { type: String, required: true },
  battery: { type: String, default: "--%" },
  connected: Boolean,
});

const emit = defineEmits(["navigate", "open-music", "open-settings"]);
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
</script>

<template>
  <header class="app-header">
    <button class="brand" type="button" @click="emit('navigate', 'home')">
      <img :src="assetUrl('assets/logo.png')" alt="RAISA" />
    </button>
    <div class="connection-pill" :class="{ online: connected }">
      <Wifi :size="17" />
      <span>{{ connected ? "ROS online" : "ROS offline" }}</span>
    </div>
    <div class="battery-indicator" :title="`Battery ${battery}`">
      <BatteryMedium :size="20" />
      <span>{{ battery }}</span>
    </div>
  </header>

  <nav class="bottom-navigation" aria-label="Main navigation">
    <button :class="{ active: props.activeView === 'home' }" @click="emit('navigate', 'home')">
      <House />
      <span>Home</span>
    </button>
    <button
      :class="{ active: props.activeView === 'interact' }"
      @click="emit('navigate', 'interact')"
    >
      <CircleHelp />
      <span>Interact</span>
    </button>
    <button type="button" @click="emit('open-music')">
      <Music2 />
      <span>Music</span>
    </button>
    <button type="button" @click="emit('navigate', 'about')">
      <!-- <img :src="assetUrl('assets/icon-about.png')" alt="" /> -->
       <Info />
      <span>About</span>
    </button>
    <button type="button" @click="emit('open-settings')">
      <Settings />
      <span>Settings</span>
    </button>
  </nav>
</template>
