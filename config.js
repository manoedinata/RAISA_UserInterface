const DEFAULT_ROBOT_HOST = "10.209.100.3";
const STORAGE_KEY = "raisa.robotHost";

function normalizeHost(value) {
    if (!value) return "";
    let candidate = String(value).trim();
    if (!candidate) return "";
    if (!/^https?:\/\//i.test(candidate)) candidate = `http://${candidate}`;
    try {
        const url = new URL(candidate);
        return url.origin;
    } catch {
        return "";
    }
}

function initialRobotHost() {
    const queryHost = new URLSearchParams(window.location.search).get("robot");
    const selected = normalizeHost(queryHost) || normalizeHost(localStorage.getItem(STORAGE_KEY));
    return selected || `http://${DEFAULT_ROBOT_HOST}`;
}

export let robotHost = initialRobotHost();

export function setRobotHost(value) {
    const normalized = normalizeHost(value);
    if (!normalized) throw new Error("Robot host tidak valid");
    robotHost = normalized;
    localStorage.setItem(STORAGE_KEY, normalized);
    return robotHost;
}

export function getRobotHttpUrl(pathname) {
    return new URL(pathname.replace(/^\//, ""), `${robotHost}/`).toString();
}

export function getRosUrl() {
    const url = new URL(robotHost);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}:9090`;
}

export function getCameraUrl() {
    const url = new URL(robotHost);
    return `${url.protocol}//${url.hostname}:8080/stream?topic=/vision/image_display`;
}

export function getRobotHost() {
    return robotHost;
}
