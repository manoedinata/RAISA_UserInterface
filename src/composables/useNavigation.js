import { computed, onMounted, ref } from "vue";

import { TOPICS } from "@/data/robot";
import { getRobotHttpUrl } from "@/services/robotConfig";
import { publish } from "@/services/ros";

export function useNavigation() {
    const waypoints = ref([]);
    const loading = ref(false);
    const error = ref("");
    const destination = ref("");
    const progressOpen = ref(false);
    const progressMessage = ref("");

    function navigateTo(value) {
        return publish(TOPICS.navigationCommand.name, TOPICS.navigationCommand.type, { data: value });
    }

    const availableWaypoints = computed(() =>
        waypoints.value.filter((item) => item.type !== "charge"),
    );

    async function loadWaypoints() {
        loading.value = true;
        error.value = "";
        try {
            const response = await fetch(getRobotHttpUrl("/reeman/position"));
            if (!response.ok) throw new Error(`Waypoint request failed: ${response.status}`);
            const data = await response.json();
            waypoints.value = Array.isArray(data.waypoints) ? data.waypoints : [];
        } catch (loadError) {
            error.value = loadError.message;
        } finally {
            loading.value = false;
        }
    }

    function start(destinationName) {
        destination.value = destinationName;
        navigateTo(destinationName);
        progressMessage.value = "Robot sedang menuju lokasi ...";
        progressOpen.value = true;
    }

    function cancel() {
        navigateTo("cancel");
        progressOpen.value = false;
    }

    function auto() {
        navigateTo("auto");
        progressOpen.value = true;
        progressMessage.value = "Robot menjalankan mode otomatis ...";
    }

    onMounted(loadWaypoints);

    return {
        waypoints: availableWaypoints,
        loading,
        error,
        destination,
        progressOpen,
        progressMessage,
        loadWaypoints,
        start,
        cancel,
        auto,
    };
}
