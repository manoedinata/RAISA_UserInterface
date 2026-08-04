import { computed, onBeforeUnmount, onMounted, reactive } from "vue";

import { TOPICS } from "@/data/robot";
import { publish, rosState, subscribe } from "@/services/ros";

const status = reactive({
  battery: null,
  docking: null,
  navigation: null,
});

function readNumber(message) {
  const value = Number(message?.data);
  return Number.isFinite(value) ? value : null;
}

export function useRobot() {
  const cleanups = [];

  onMounted(() => {
    cleanups.push(
      subscribe(TOPICS.battery.name, TOPICS.battery.type, (message) => {
        status.battery = readNumber(message);
      }),
      subscribe(TOPICS.dockingStatus.name, TOPICS.dockingStatus.type, (message) => {
        status.docking = readNumber(message);
      }),
      subscribe(TOPICS.navigationStatus.name, TOPICS.navigationStatus.type, (message) => {
        status.navigation = readNumber(message);
      }),
    );
  });

  onBeforeUnmount(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

  function send(topic, data = undefined) {
    return publish(topic.name, topic.type, data === undefined ? {} : { data });
  }

  return {
    rosState,
    status,
    batteryLabel: computed(() =>
      status.battery === null ? "--%" : `${Math.round(status.battery)}%`,
    ),
    requestConnectionCheck: () => send(TOPICS.checkConnection),
    setDocking: (enabled) => send(TOPICS.dockingCommand, enabled ? 1 : 0),
    navigateTo: (waypoint) => send(TOPICS.navigationCommand, waypoint),
    setMuted: (muted) => send(TOPICS.muteAudio, muted ? 1 : 0),
  };
}
