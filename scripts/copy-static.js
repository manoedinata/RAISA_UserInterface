const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const staticEntries = [
    "assets",
    "config",
    "roslib.min.js",
    "tangan.html",
    "voice.html",
    "voice2.html",
    "anime.min.js",
];

fs.mkdirSync(output, { recursive: true });

for (const entry of staticEntries) {
    const source = path.join(root, entry);
    if (!fs.existsSync(source)) {
        console.warn(`Static entry not found: ${entry}`);
        continue;
    }

    fs.cpSync(source, path.join(output, entry), { recursive: true, force: true });
}
