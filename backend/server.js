const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

let wifi;
try {
    wifi = require("node-wifi");
    wifi.init({ iface: null });
} catch (error) {
    console.warn("node-wifi is unavailable; Wi-Fi API calls will report an error.");
}

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 9999);
const HOST = process.env.HOST || "0.0.0.0";
const IP_FILE = process.env.RAISA_IP_FILE || "/home/raisa/ip_controller.txt";
const MUSIC_FILE = path.join(ROOT, "music_last.txt");
const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
};

function sendJson(res, status, body) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(body));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
            if (data.length > 1024 * 1024) reject(new Error("Request body too large"));
        });
        req.on("end", () => {
            try { resolve(data ? JSON.parse(data) : {}); }
            catch { reject(new Error("Invalid JSON")); }
        });
        req.on("error", reject);
    });
}

function run(command, args) {
    return new Promise((resolve, reject) => {
        execFile(command, args, { timeout: 15000 }, (error, stdout, stderr) => {
            if (error) reject(new Error(stderr.trim() || error.message));
            else resolve(stdout);
        });
    });
}

function requireWifi() {
    if (!wifi) throw new Error("node-wifi is not installed or Wi-Fi backend is unavailable");
    return wifi;
}

function callbackRequest(operation) {
    return new Promise((resolve, reject) => operation((error, value) => error ? reject(error) : resolve(value)));
}

async function api(req, res, pathname) {
    if (pathname === "/api/ip" && req.method === "POST") {
        const body = await readBody(req);
        const ip = String(body.ip || "").trim();
        if (!ip || !/^[a-zA-Z0-9.:-]+$/.test(ip)) return sendJson(res, 400, { success: false, error: "Invalid IP or host" });
        fs.mkdirSync(path.dirname(IP_FILE), { recursive: true });
        fs.writeFileSync(IP_FILE, ip, "utf8");
        return sendJson(res, 200, { success: true, value: ip });
    }

    if (pathname === "/api/volume" && req.method === "GET") {
        const output = await run("pactl", ["get-sink-volume", "@DEFAULT_SINK@"]).catch((error) => { throw error; });
        const match = output.match(/(\d+)%/);
        if (!match) throw new Error("Unable to read system volume");
        return sendJson(res, 200, { success: true, value: Number(match[1]) });
    }

    if (pathname === "/api/volume" && req.method === "POST") {
        const body = await readBody(req);
        const percent = Math.max(0, Math.min(100, Number(body.percent)));
        if (!Number.isFinite(percent)) return sendJson(res, 400, { success: false, error: "Invalid volume" });
        await run("pactl", ["set-sink-volume", "@DEFAULT_SINK@", `${percent}%`]);
        return sendJson(res, 200, { success: true, value: percent });
    }

    if (pathname === "/api/wifi/scan" && req.method === "GET") {
        const networks = await callbackRequest((callback) => requireWifi().scan(callback));
        return sendJson(res, 200, { success: true, networks: networks || [] });
    }

    if (pathname === "/api/wifi/connections" && req.method === "GET") {
        const connections = await callbackRequest((callback) => requireWifi().getCurrentConnections(callback));
        const interfaces = os.networkInterfaces();
        const ip = Object.values(interfaces).flat().find((entry) => entry.family === "IPv4" && !entry.internal)?.address || null;
        return sendJson(res, 200, { success: true, connections: connections || [], ip });
    }

    if (pathname === "/api/wifi/connect" && req.method === "POST") {
        const body = await readBody(req);
        const ssid = String(body.ssid || "").trim();
        if (!ssid || ssid.length > 128) return sendJson(res, 400, { success: false, error: "Invalid SSID" });
        await callbackRequest((callback) => requireWifi().connect({ ssid, password: body.password ? String(body.password) : null }, callback));
        return sendJson(res, 200, { success: true });
    }

    if (pathname === "/api/ros/restart" && req.method === "POST") {
        await run("systemctl", ["--user", "restart", "run_ros_riman.service"]);
        return sendJson(res, 200, { success: true });
    }

    if (pathname === "/api/chrome/launch" && req.method === "POST") {
        const body = await readBody(req);
        const url = String(body.url || "");
        if (!/^https?:\/\//i.test(url)) return sendJson(res, 400, { success: false, error: "Only HTTP(S) URLs are allowed" });
        const args = ["--kiosk", "--password-store=basic", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required", "--disable-pinch", "--overscroll-history-navigation=0", "--disk-cache-dir=/dev/null", url];
        const child = require("child_process").spawn("google-chrome", args, { detached: true, stdio: "ignore" });
        child.unref();
        return sendJson(res, 200, { success: true });
    }

    if (pathname === "/api/chrome/kill" && req.method === "POST") {
        await run("pkill", ["chrome"]).catch(() => { });
        return sendJson(res, 200, { success: true });
    }

    return false;
}

function serveStatic(req, res, pathname) {
    const requested = pathname === "/" ? "/index.html" : pathname;
    const blocked = ["/backend/", "/node_modules/", "/.git/", "/main.js", "/preload.js", "/buffer.js", "/package.json", "/package-lock.json", "/music_last.txt"];
    if (blocked.some((entry) => requested === entry || requested.startsWith(entry))) {
        return sendJson(res, 404, { success: false, error: "Not found" });
    }
    const filePath = path.resolve(ROOT, `.${requested}`);
    if (!filePath.startsWith(`${ROOT}${path.sep}`)) return sendJson(res, 403, { success: false, error: "Forbidden" });
    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) return sendJson(res, 404, { success: false, error: "Not found" });
        const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
        const range = req.headers.range;
        if (range) {
            const match = range.match(/bytes=(\d*)-(\d*)/);
            const start = match?.[1] ? Number(match[1]) : 0;
            const end = match?.[2] ? Number(match[2]) : stats.size - 1;
            if (!match || start > end || end >= stats.size) {
                res.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
                return res.end();
            }
            res.writeHead(206, {
                "Content-Type": contentType,
                "Content-Length": end - start + 1,
                "Content-Range": `bytes ${start}-${end}/${stats.size}`,
                "Accept-Ranges": "bytes",
                "Access-Control-Allow-Origin": "*",
            });
            return fs.createReadStream(filePath, { start, end }).pipe(res);
        }
        res.writeHead(200, { "Content-Type": contentType, "Content-Length": stats.size, "Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*" });
        fs.createReadStream(filePath).pipe(res);
    });
}

const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
    try {
        if (pathname.startsWith("/api/")) {
            const origin = req.headers.origin;
            if (origin && new URL(origin).host !== req.headers.host) {
                return sendJson(res, 403, { success: false, error: "Cross-origin API request denied" });
            }
            const handled = await api(req, res, pathname);
            if (handled !== false) return;
        }
        serveStatic(req, res, pathname);
    } catch (error) {
        console.error(error);
        sendJson(res, 500, { success: false, error: error.message });
    }
});

server.listen(PORT, HOST, () => console.log(`RAISA browser backend listening on http://${HOST}:${PORT}`));
