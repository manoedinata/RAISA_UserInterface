const isElectron = Boolean(window.raisaPlatform?.isElectron);
const backendBase = window.location.protocol === "file:" ? "http://127.0.0.1:9999" : window.location.origin;

async function backendRequest(path, options = {}) {
    const response = await fetch(`${backendBase}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
        throw new Error(payload.error || `Backend request failed: ${response.status}`);
    }
    return payload;
}

async function electronInvoke(channel, value) {
    if (!window.raisaPlatform?.invoke) throw new Error("Electron bridge unavailable");
    const response = await window.raisaPlatform.invoke(channel, value);
    if (response?.success === false) throw new Error(response.error || "Electron operation failed");
    return response?.value ?? response;
}

export const platform = {
    isElectron,
    async saveIp(ip) {
        return isElectron ? electronInvoke("save-ip", ip) : backendRequest("/api/ip", {
            method: "POST",
            body: JSON.stringify({ ip }),
        });
    },
    async getLastMusic() {
        if (isElectron) return electronInvoke("music-last-get");
        return localStorage.getItem("raisa.lastMusic") || null;
    },
    async saveLastMusic(filePath) {
        if (isElectron) return electronInvoke("music-last-save", filePath);
        localStorage.setItem("raisa.lastMusic", filePath);
        return true;
    },
    async getVolume() {
        if (isElectron) return electronInvoke("volume-get");
        return backendRequest("/api/volume");
    },
    async setVolume(percent) {
        if (isElectron) return electronInvoke("volume-set", Number(percent));
        return backendRequest("/api/volume", {
            method: "POST",
            body: JSON.stringify({ percent: Number(percent) }),
        });
    },
    async wifiScan() {
        if (isElectron) return { networks: await electronInvoke("wifi-scan") };
        return backendRequest("/api/wifi/scan");
    },
    async wifiConnections() {
        if (isElectron) return electronInvoke("wifi-connections");
        return backendRequest("/api/wifi/connections");
    },
    async wifiConnect(ssid, password) {
        const value = { ssid, password: password || null };
        if (isElectron) return electronInvoke("wifi-connect", value);
        return backendRequest("/api/wifi/connect", {
            method: "POST",
            body: JSON.stringify(value),
        });
    },
    async restartRos() {
        if (isElectron) return electronInvoke("restart-ros");
        return backendRequest("/api/ros/restart", { method: "POST" });
    },
    async launchChrome(url) {
        if (isElectron) return electronInvoke("launch-chrome", url);
        return backendRequest("/api/chrome/launch", {
            method: "POST",
            body: JSON.stringify({ url }),
        });
    },
    async killChrome() {
        if (isElectron) return electronInvoke("kill-chrome");
        return backendRequest("/api/chrome/kill", { method: "POST" });
    },
};
