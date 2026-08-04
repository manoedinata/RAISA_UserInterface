const DEFAULT_ROBOT_HOST = "10.209.100.3";
const STORAGE_KEY = "raisa.robotHost";

export function normalizeRobotHost(value) {
    if (!value) return "";

    let candidate = String(value).trim();
    if (!candidate) return "";
    if (!/^https?:\/\//i.test(candidate)) candidate = `http://${candidate}`;

    try {
        return new URL(candidate).origin;
    } catch {
        return "";
    }
}

function getInitialHost() {
    const queryHost = new URLSearchParams(window.location.search).get("robot");
    const storedHost = localStorage.getItem(STORAGE_KEY);
    return (
        normalizeRobotHost(queryHost) ||
        normalizeRobotHost(storedHost) ||
        `http://${DEFAULT_ROBOT_HOST}`
    );
}

let robotHost = getInitialHost();

export function getRobotHost() {
    return robotHost;
}

export function setRobotHost(value) {
    const normalized = normalizeRobotHost(value);
    if (!normalized) throw new Error("Host robot tidak valid");

    robotHost = normalized;
    localStorage.setItem(STORAGE_KEY, normalized);
    return normalized;
}

export function getRobotHttpUrl(pathname) {
    return new URL(String(pathname).replace(/^\//, ""), `${robotHost}/`).toString();
}

export function getRosUrl() {
    const url = new URL(robotHost);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.hostname}:9090`;
}

export function getCameraUrl() {
    const url = new URL(robotHost);
    return `${url.protocol}//${url.hostname}:8080/stream?topic=/vision/image_display`;
}
