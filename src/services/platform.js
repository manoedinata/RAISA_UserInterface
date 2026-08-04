const isElectron = Boolean(window.raisaPlatform?.isElectron);
const backendBase =
    window.location.protocol === "file:" ? "http://127.0.0.1:9999" : window.location.origin;

async function backendRequest(path, options = {}) {
    const response = await fetch(`${backendBase}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.success === false) {
        throw new Error(payload.error || `Backend request failed: ${response.status}`);
    }

    return payload.value ?? payload;
}

async function electronInvoke(channel, value) {
    if (!window.raisaPlatform?.invoke) throw new Error("Electron bridge unavailable");

    const response = await window.raisaPlatform.invoke(channel, value);
    if (response?.success === false) {
        throw new Error(response.error || "Electron operation failed");
    }
    return response?.value ?? response;
}

function invoke(channel, path, options, value) {
    return isElectron ? electronInvoke(channel, value) : backendRequest(path, options);
}

export const platform = {
    isElectron,
    saveIp(ip) {
        return invoke("save-ip", "/api/ip", { method: "POST", body: JSON.stringify({ ip }) }, ip);
    },
    getLastMusic() {
        if (isElectron) return electronInvoke("music-last-get");
        return Promise.resolve(localStorage.getItem("raisa.lastMusic"));
    },
    saveLastMusic(filePath) {
        if (isElectron) return electronInvoke("music-last-save", filePath);
        if (filePath) localStorage.setItem("raisa.lastMusic", filePath);
        else localStorage.removeItem("raisa.lastMusic");
        return Promise.resolve(true);
    },
    getVolume() {
        return invoke("volume-get", "/api/volume", {}, undefined);
    },
    setVolume(percent) {
        const value = Number(percent);
        return invoke(
            "volume-set",
            "/api/volume",
            { method: "POST", body: JSON.stringify({ percent: value }) },
            value,
        );
    },
    wifiScan() {
        return invoke("wifi-scan", "/api/wifi/scan", {}, undefined).then(
            (value) => value?.networks ?? value ?? [],
        );
    },
    wifiConnections() {
        return invoke("wifi-connections", "/api/wifi/connections", {}, undefined).then(
            (value) => value?.connections ?? value ?? [],
        );
    },
    wifiConnect(ssid, password) {
        const value = { ssid, password: password || null };
        return invoke(
            "wifi-connect",
            "/api/wifi/connect",
            { method: "POST", body: JSON.stringify(value) },
            value,
        );
    },
    restartRos() {
        return invoke("restart-ros", "/api/ros/restart", { method: "POST" }, undefined);
    },
    launchChrome(url) {
        return invoke(
            "launch-chrome",
            "/api/chrome/launch",
            { method: "POST", body: JSON.stringify({ url }) },
            url,
        );
    },
    killChrome() {
        return invoke("kill-chrome", "/api/chrome/kill", { method: "POST" }, undefined);
    },
};
