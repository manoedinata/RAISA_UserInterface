<script setup>
import { computed, ref, watch } from "vue";
import {
  BatteryCharging,
  CircleStop,
  MapPinned,
  Play,
  RefreshCw,
  Volume2,
  Wifi,
} from "lucide-vue-next";

import AppChrome from "@/components/AppChrome.vue";
import BaseModal from "@/components/BaseModal.vue";
import MediaViewer from "@/components/MediaViewer.vue";
import MinistryDetail from "@/components/MinistryDetail.vue";
import VirtualKeyboard from "@/components/VirtualKeyboard.vue";
import { useMusic } from "@/composables/useMusic";
import { useNavigation } from "@/composables/useNavigation";
import { useRobot } from "@/composables/useRobot";
import { useSystemControls } from "@/composables/useSystemControls";
import { ministryIds } from "@/data/content";
import { getCameraUrl, getRobotHost, getRosUrl, setRobotHost } from "@/services/robotConfig";
import { platform } from "@/services/platform";
import { setRosUrl } from "@/services/ros";
import AboutView from "@/views/AboutView.vue";
import HomeView from "@/views/HomeView.vue";
import InteractView from "@/views/InteractView.vue";

const activeView = ref("home");
const modal = ref(null);
const viewerItem = ref(null);
const ministrySpecs = ref([]);
const selectedMinistry = ref(null);
const robotHostInput = ref(getRobotHost().replace(/^https?:\/\//, ""));
const wifiPassword = ref("");
const selectedNetwork = ref(null);
const message = ref("");
const homeTapCount = ref(0);
let homeTapTimer = null;
const VOICE_ASSISTANT_URL = "https://voice-chat-raisa.nabbit.id/";

const robot = useRobot();
const music = useMusic();
const system = useSystemControls();
const navigation = useNavigation();

const dockingMessage = computed(() => {
  if (robot.status.docking === 1) return "Docking charge berhasil.";
  if (robot.status.docking === -1) return "Docking gagal. Silakan coba lagi.";
  return "Robot sedang menuju charging pile.";
});
const navigationMessage = computed(() =>
  robot.status.navigation === 1
    ? "Robot telah sampai di lokasi tujuan."
    : navigation.progressMessage.value,
);

watch(
  () => robot.status.navigation,
  (value) => {
    if (value === 1) robot.navigateTo("cancel");
  },
);

async function loadMinistries() {
  if (ministrySpecs.value.length) return;
  const response = await fetch("config/food_specs.json");
  const specs = await response.json();
  ministrySpecs.value = specs.filter((item) => ministryIds.includes(item.id));
}

async function openMinistry(id) {
  try {
    await loadMinistries();
    selectedMinistry.value = ministrySpecs.value.find((item) => item.id === id) || null;
    modal.value = "ministry";
  } catch (error) {
    message.value = error.message;
  }
}

function openViewer(item) {
  viewerItem.value = item;
  robot.setMuted(true);
}

function closeViewer() {
  viewerItem.value = null;
  robot.setMuted(false);
}

async function openVoiceAssistant() {
  try {
    await platform.launchChrome(VOICE_ASSISTANT_URL);
  } catch (error) {
    message.value = error.message;
  }
}

function navigate(view) {
  activeView.value = view;
  if (view !== "home") return;
  homeTapCount.value += 1;
  if (!homeTapTimer) {
    homeTapTimer = window.setTimeout(() => {
      homeTapCount.value = 0;
      homeTapTimer = null;
    }, 3000);
  }
  if (homeTapCount.value >= 10) {
    window.clearTimeout(homeTapTimer);
    homeTapTimer = null;
    homeTapCount.value = 0;
    modal.value = "developer";
  }
}

function handleInteraction(action) {
  const actions = {
    voice: openVoiceAssistant,
    camera: () => openViewer({ title: "Robot Camera", type: "image", source: getCameraUrl() }),
    hand: () => openViewer({ title: "Hand Tracking", type: "web", source: "tangan.html" }),
    promo: () =>
      openViewer({ title: "Promotional Video", type: "video", source: "assets/profile_rs.mp4" }),
    face: () => openViewer({ title: "Face Interaction", type: "web", source: "voice.html" }),
    navigation: () => {
      modal.value = "navigation";
      navigation.loadWaypoints();
    },
    docking: () => {
      robot.setDocking(true);
      modal.value = "docking";
    },
  };
  actions[action]?.();
}

function reloadInterface() {
  window.location.reload();
}

function clearLocalCache() {
  localStorage.clear();
  message.value = "Local cache cleared";
}

async function openSettings() {
  modal.value = "settings";
  try {
    await system.loadVolume();
  } catch {
    // The inline error state reports unavailable system controls.
  }
}

async function saveRobotHost() {
  try {
    setRobotHost(robotHostInput.value);
    setRosUrl(getRosUrl());
    await platform.saveIp(robotHostInput.value);
    message.value = "Robot host updated.";
  } catch (error) {
    message.value = error.message;
  }
}

async function openWifi() {
  modal.value = "wifi";
  try {
    await system.scanWifi();
  } catch {
    // The inline error state reports scan failures.
  }
}

function chooseNetwork(network) {
  selectedNetwork.value = network;
  wifiPassword.value = "";
}

async function connectNetwork() {
  await system.connectWifi(selectedNetwork.value.ssid, wifiPassword.value);
  selectedNetwork.value = null;
  await system.scanWifi();
}

function startNavigation(name) {
  navigation.start(name);
  modal.value = "navigation-progress";
}

function closeDocking() {
  if (robot.status.docking !== 1 && robot.status.docking !== -1) robot.setDocking(false);
  modal.value = null;
}
</script>

<template>
  <div class="app-shell">
    <AppChrome
      :active-view="activeView"
      :battery="robot.batteryLabel.value"
      :connected="robot.rosState.connected"
      @navigate="navigate"
      @open-music="modal = 'music'"
      @open-settings="openSettings"
    />

    <main>
      <Transition name="page" mode="out-in">
        <HomeView
          v-if="activeView === 'home'"
          key="home"
          @open-content="openViewer"
          @open-ministry="openMinistry"
        />
        <InteractView
          v-else-if="activeView === 'interact'"
          key="interact"
          @action="handleInteraction"
        />
        <AboutView v-else key="about" />
      </Transition>
    </main>

    <MediaViewer :open="Boolean(viewerItem)" :item="viewerItem" @close="closeViewer" />

    <BaseModal
      :open="modal === 'ministry'"
      title="Kementerian"
      width="min(94vw, 880px)"
      @close="modal = null"
    >
      <MinistryDetail :item="selectedMinistry" />
    </BaseModal>

    <BaseModal :open="modal === 'music'" title="Music" @close="modal = null">
      <div class="music-now-playing">
        <div>
          <small>Selected track</small><strong>{{ music.selectedTitle.value }}</strong>
        </div>
        <button
          class="icon-button"
          type="button"
          :title="music.playing.value ? 'Pause' : 'Play'"
          @click="music.toggle"
        >
          <CircleStop v-if="music.playing.value" />
          <Play v-else />
        </button>
      </div>
      <div class="selection-list music-list">
        <button
          v-for="track in music.tracks"
          :key="track.id"
          :class="{ selected: track.source === music.selectedSource.value }"
          type="button"
          @click="music.select(track.source)"
        >
          {{ track.title }}
        </button>
      </div>
    </BaseModal>

    <BaseModal :open="modal === 'settings'" title="Settings" @close="modal = null">
      <div class="settings-list">
        <label class="setting-row">
          <span> <Volume2 /> System volume </span>
          <output>{{ system.volume.value }}%</output>
          <input
            :value="system.volume.value"
            type="range"
            min="0"
            max="100"
            @change="system.setVolume($event.target.value)"
          />
        </label>
        <button class="setting-row command" type="button" @click="openWifi">
          <span> <Wifi /> Wi-Fi network </span><span>Manage</span>
        </button>
        <label class="field-label" for="robot-host">Robot host</label>
        <div class="inline-field">
          <input id="robot-host" v-model="robotHostInput" type="text" inputmode="url" />
          <button class="primary-button compact" type="button" @click="saveRobotHost">Save</button>
        </div>
        <p v-if="system.error.value || message" class="status-message">
          {{ system.error.value || message }}
        </p>
      </div>
    </BaseModal>

    <BaseModal :open="modal === 'wifi'" title="Wi-Fi" @close="modal = null">
      <div class="modal-toolbar">
        <span>{{
          system.busy.value ? "Scanning..." : `${system.networks.value.length} networks`
        }}</span>
        <button class="icon-button" type="button" title="Scan again" @click="system.scanWifi">
          <RefreshCw />
        </button>
      </div>
      <div class="selection-list">
        <button
          v-for="network in system.networks.value"
          :key="network.ssid"
          type="button"
          @click="chooseNetwork(network)"
        >
          <span>{{ network.ssid || "Hidden network" }}</span
          ><small>{{ network.signal_level || network.quality || "--" }}</small>
        </button>
      </div>
    </BaseModal>

    <BaseModal
      :open="Boolean(selectedNetwork)"
      :title="selectedNetwork?.ssid || 'Wi-Fi password'"
      @close="selectedNetwork = null"
    >
      <input
        v-model="wifiPassword"
        class="password-input"
        type="password"
        autocomplete="off"
        placeholder="Password"
      />
      <VirtualKeyboard v-model="wifiPassword" @submit="connectNetwork" />
      <template #footer
        ><button class="primary-button" type="button" @click="connectNetwork">
          Connect
        </button></template
      >
    </BaseModal>

    <BaseModal :open="modal === 'navigation'" title="Navigation" @close="modal = null">
      <div class="selection-list navigation-list">
        <button
          class="selected"
          type="button"
          @click="
            navigation.auto();
            modal = 'navigation-progress';
          "
        >
          Automatic mode
        </button>
        <button
          v-for="waypoint in navigation.waypoints.value"
          :key="waypoint.name"
          type="button"
          @click="startNavigation(waypoint.name)"
        >
          {{ waypoint.name }}
        </button>
      </div>
      <p v-if="navigation.loading.value">Loading waypoints...</p>
      <p v-if="navigation.error.value" class="status-message error">{{ navigation.error.value }}</p>
    </BaseModal>

    <BaseModal
      :open="modal === 'navigation-progress'"
      title="Navigation in progress"
      @close="
        navigation.cancel();
        modal = null;
      "
    >
      <div class="progress-state">
        <MapPinned :size="52" />
        <p>{{ navigationMessage }}</p>
      </div>
      <template #footer
        ><button
          class="danger-button"
          type="button"
          @click="
            navigation.cancel();
            modal = null;
          "
        >
          Cancel navigation
        </button></template
      >
    </BaseModal>

    <BaseModal :open="modal === 'docking'" title="Charge docking" @close="closeDocking">
      <div class="progress-state">
        <BatteryCharging :size="52" />
        <p>{{ dockingMessage }}</p>
      </div>
      <template #footer
        ><button class="danger-button" type="button" @click="closeDocking">
          {{ robot.status.docking === null ? "Cancel" : "Close" }}
        </button></template
      >
    </BaseModal>

    <BaseModal :open="modal === 'developer'" title="Developer tools" @close="modal = null">
      <div class="selection-list">
        <button type="button" @click="reloadInterface">Reload interface</button>
        <button type="button" @click="system.restartRos">Restart ROS bridge</button>
        <button type="button" @click="clearLocalCache">Clear local cache</button>
        <button
          type="button"
          @click="
            openViewer({ title: 'Robot camera', type: 'image', source: getCameraUrl() });
            modal = null;
          "
        >
          Open camera test
        </button>
      </div>
    </BaseModal>
  </div>
</template>
