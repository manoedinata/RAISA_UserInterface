import { ref } from "vue";

import { platform } from "@/services/platform";

export function useSystemControls() {
    const volume = ref(50);
    const networks = ref([]);
    const connections = ref([]);
    const busy = ref(false);
    const error = ref("");

    async function run(operation) {
        busy.value = true;
        error.value = "";
        try {
            return await operation();
        } catch (operationError) {
            error.value = operationError.message;
            throw operationError;
        } finally {
            busy.value = false;
        }
    }

    async function loadVolume() {
        const value = await run(() => platform.getVolume());
        volume.value = Number(value?.percent ?? value ?? 50);
    }

    async function setVolume(value) {
        volume.value = Number(value);
        await run(() => platform.setVolume(volume.value));
    }

    async function scanWifi() {
        const [scannedNetworks, activeConnections] = await run(() =>
            Promise.all([platform.wifiScan(), platform.wifiConnections()]),
        );
        networks.value = Array.isArray(scannedNetworks) ? scannedNetworks : [];
        connections.value = Array.isArray(activeConnections) ? activeConnections : [];
    }

    function connectWifi(ssid, password) {
        return run(() => platform.wifiConnect(ssid, password));
    }

    return {
        volume,
        networks,
        connections,
        busy,
        error,
        loadVolume,
        setVolume,
        scanWifi,
        connectWifi,
        restartRos: () => run(() => platform.restartRos()),
    };
}
