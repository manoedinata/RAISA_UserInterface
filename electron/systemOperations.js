const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile, spawn } = require("child_process");

const IP_FILE = process.env.RAISA_IP_FILE || "/home/raisa/ip_controller.txt";
const MUSIC_FILE = path.resolve(__dirname, "..", "music_last.txt");

let wifi;
try {
    wifi = require("node-wifi");
    wifi.init({ iface: null });
} catch {
    wifi = null;
}

function result(success, value, error) {
    return success ? { success: true, value } : { success: false, error };
}

function run(command, args) {
    return new Promise((resolve, reject) => {
        execFile(command, args, { timeout: 15000 }, (error, stdout, stderr) => {
            if (error) reject(new Error(stderr.trim() || error.message));
            else resolve(stdout);
        });
    });
}

function wifiRequest(operation) {
    return new Promise((resolve, reject) => {
        if (!wifi) return reject(new Error("node-wifi unavailable"));
        operation((error, value) => (error ? reject(error) : resolve(value)));
    });
}

function getLocalIp() {
    return (
        Object.values(os.networkInterfaces())
            .flat()
            .find((entry) => entry.family === "IPv4" && !entry.internal)?.address || null
    );
}

const operations = {
    saveIp(ip) {
        const value = String(ip || "").trim();
        if (!value || !/^[a-zA-Z0-9.:-]+$/.test(value)) throw new Error("Invalid IP or host");
        fs.mkdirSync(path.dirname(IP_FILE), { recursive: true });
        fs.writeFileSync(IP_FILE, value, "utf8");
        return value;
    },
    getLastMusic() {
        if (!fs.existsSync(MUSIC_FILE)) return null;
        return fs.readFileSync(MUSIC_FILE, "utf8").trim() || null;
    },
    saveLastMusic(value) {
        fs.writeFileSync(MUSIC_FILE, String(value || "").trim(), "utf8");
        return true;
    },
    async getVolume() {
        const output = await run("pactl", ["get-sink-volume", "@DEFAULT_SINK@"]).catch((error) => {
            throw error;
        });
        const match = output.match(/(\d+)%/);
        if (!match) throw new Error("Unable to read system volume");
        return Number(match[1]);
    },
    async setVolume(percent) {
        const value = Math.max(0, Math.min(100, Number(percent)));
        if (!Number.isFinite(value)) throw new Error("Invalid volume");
        await run("pactl", ["set-sink-volume", "@DEFAULT_SINK@", `${value}%`]);
        return value;
    },
    scanWifi() {
        return wifiRequest((callback) => wifi.scan(callback));
    },
    async getWifiConnections() {
        const connections = await wifiRequest((callback) => wifi.getCurrentConnections(callback));
        return { connections: connections || [], ip: getLocalIp() };
    },
    connectWifi(value) {
        const ssid = String(value?.ssid || "").trim();
        if (!ssid || ssid.length > 128) throw new Error("Invalid SSID");
        return wifiRequest((callback) =>
            wifi.connect({ ssid, password: value?.password ? String(value.password) : null }, callback),
        );
    },
    async restartRos() {
        await run("systemctl", ["--user", "restart", "run_ros_riman.service"]);
        return true;
    },
    launchChrome(url) {
        const value = String(url || "");
        if (!/^https?:\/\//i.test(value)) throw new Error("Only HTTP(S) URLs are allowed");
        const child = spawn(
            "google-chrome",
            [
                "--kiosk",
                "--password-store=basic",
                "--use-fake-ui-for-media-stream",
                "--autoplay-policy=no-user-gesture-required",
                "--disable-pinch",
                "--overscroll-history-navigation=0",
                "--disk-cache-dir=/dev/null",
                value,
            ],
            { detached: true, stdio: "ignore" },
        );
        child.unref();
        return true;
    },
    async killChrome() {
        await run("pkill", ["chrome"]).catch(() => undefined);
        return true;
    },
};

async function asResult(operation) {
    try {
        return result(true, await operation());
    } catch (error) {
        return result(false, null, error.message || String(error));
    }
}

module.exports = { asResult, operations };
