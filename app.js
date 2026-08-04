// =============================================================================
// ✅ ROS WRAPPER SETUP
// =============================================================================

const { ipcRenderer } = require("electron");
const camera_path = "http://localhost:8080/stream?topic=/vision/image_display";
const ASSETS_PATH = "assets/";
// const ROS_IP = "10.7.101.238"; // ganti sesuai kebutuhan
// const ROS_IP = "10.42.0.166"; // ganti sesuai kebutuhan
// const ROS_IP = "10.209.100.3"; // ganti sesuai kebutuhan
const ROS_IP = "192.168.0.193"; // ganti sesuai kebutuhan

import { safeSubscribe, safeTopic } from "./bridge.js";
const { shell } = require("electron");
const os = require("os");

// =============================================================================
// 🧹 SOCKET CLEANUP
// =============================================================================

let activeSocket = null;

function cleanupSocket() {
  if (activeSocket) {
    activeSocket.close();
    activeSocket = null;
  }
}

// =============================================================================
// 🧭 NAVIGATION HANDLER
// =============================================================================

const navButtons = document.querySelectorAll(".nav-btn[data-page]");
const pages = document.querySelectorAll(".page");
let currentPage = "konten";

function showPage(targetId) {
  pages.forEach((page) =>
    page.classList.toggle("active", page.id === targetId)
  );
  navButtons.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.page === targetId)
  );
  currentPage = targetId;
}

navButtons.forEach((btn) =>
  btn.addEventListener("click", () => showPage(btn.dataset.page))
);

// =============================================================================
// ➕ ADD BUTTON HANDLER
// =============================================================================

const addBtn = document.getElementById("add-btn");
const contentGrid = document.getElementById("content-grid");
const foodGrid = document.getElementById("food-grid");

let contentCount = 1;
let foodCount = 1;

if (addBtn) {
  addBtn.addEventListener("click", () => {
    currentPage === "konten" ? addContent() : addFood();
  });
}

// Smooth card appear animation
function animateCard(card) {
  card.style.opacity = "0";
  card.style.transform = "scale(0.9)";
  requestAnimationFrame(() => {
    card.style.transition = "all .25s ease";
    card.style.opacity = "1";
    card.style.transform = "scale(1)";
  });
}

// Create content card (4x6)
function addContent() {
  contentCount++;
  const card = document.createElement("div");
  card.className = "card konten";
  card.dataset.type = "image";
  card.dataset.src = "assets/poster.jpg";
  card.innerHTML = `
    <img src="assets/content.jpeg" alt="Content ${contentCount}" />
    <div class="card-info">
      <h3>Content Title ${contentCount}</h3>
      <p>Dari JS handler</p>
    </div>
  `;
  contentGrid.appendChild(card);
  animateCard(card);
}

// Create food card (1x1)
function addFood() {
  foodCount++;
  const card = document.createElement("div");
  card.className = "card makanan";
  card.dataset.type = "image";
  card.dataset.src = "assets/food.jpeg";
  card.innerHTML = `
    <img src="assets/food.jpeg" alt="Makanan ${foodCount}" />
    <div class="overlay">Makanan ${foodCount}</div>
  `;
  foodGrid.appendChild(card);
  animateCard(card);
}

// =============================================================================
// 📄 LOAD FOOD DESCRIPTIONS FROM FILE
// =============================================================================

let foodDescriptions = [];
let foodSpecs = [];

async function loadFoodDescriptions() {
  try {
    const response = await fetch("assets/food_description.txt");
    const text = await response.text();

    // Split by separator "||||"
    foodDescriptions = text
      .split("||||")
      .map((desc) => desc.trim())
      .filter((desc) => desc.length > 0);

    console.log(`✅ Loaded ${foodDescriptions.length} food descriptions`);
  } catch (error) {
    console.error("❌ Failed to load food descriptions:", error);
    foodDescriptions = [];
  }
}

async function loadFoodSpecs() {
  try {
    const response = await fetch("config/food_specs.json");
    foodSpecs = await response.json();
    console.log(`✅ Loaded ${foodSpecs.length} food specifications`);
  } catch (error) {
    console.error("❌ Failed to load food specs:", error);
    foodSpecs = [];
  }
}

// Load descriptions and specs on page load
loadFoodDescriptions();
loadFoodSpecs();

// =============================================================================
// 👁️ VIEWER OVERLAY HANDLER
// =============================================================================

const viewerOverlay = document.getElementById("viewer-overlay");
const viewerContent = document.getElementById("viewer-content");
const viewerClose = document.getElementById("viewer-close");

// saat viewer dibuka -> mute
if (viewerOverlay) {
  const observer = new MutationObserver(() => {
    const isVisible = !viewerOverlay.classList.contains("hidden");
    const isInfoView = viewerOverlay.classList.contains("food-detail");
    if (isVisible && !isInfoView) muteBGM();
    else restoreBGM();
  });

  observer.observe(viewerOverlay, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

// --- promo video overlay juga
const promoOverlay = document.getElementById("promo-overlay");
if (promoOverlay) {
  const promoObserver = new MutationObserver(() => {
    const isVisible = !promoOverlay.classList.contains("hidden");
    if (isVisible) muteBGM();
    else restoreBGM();
  });

  promoObserver.observe(promoOverlay, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

function openViewer(type, src, cardData = null) {
  // Clean up any previous viewer state first
  viewerOverlay.classList.remove("hidden", "food-detail", "promo");
  viewerContent.innerHTML = "";

  let el;

  switch (type) {
    case "food-detail":
      viewerOverlay.classList.add("food-detail");
      el = createFoodDetailView(cardData);
      break;

    case "youtube":
    case "web":
    case "voice":
    case "html":
      el = document.createElement("webview");
      el.src = src;
      if (type === "voice") {
        //enable mic access and autoplay for voice page
        el.setAttribute(
          "allow",
          "microphone; autoplay; speech-recognition; clipboard-read; clipboard-write"
        );
      }
      Object.assign(el.style, { width: "100%", height: "100%" });

      // ✅ INJECT KEYBOARD LISTENER KE WEBSITE
      el.addEventListener("dom-ready", () => {
        el.executeJavaScript(`
      document.addEventListener("focusin", (e) => {
        if (
          e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA"
        ) {
          window.postMessage("OPEN_KEYBOARD");
        }
      });
    `);
      });
      break;

    case "pdf":
      el = document.createElement("iframe");
      el.src = src;
      el.style.width = "100%";
      el.style.height = "100%";
      break;

    case "video":
      el = document.createElement("video");
      el.src = src;
      el.controls = true;
      el.autoplay = true;
      el.muted = true;
      el.playsInline = true;
      Object.assign(el.style, { width: "100%", height: "100%" });
      el.oncanplay = () => {
        el.play().catch(() => { });
        el.muted = false;
      };
      break;

    case "mjpeg":
      el = document.createElement("img");
      el.src = src;
      Object.assign(el.style, {
        width: "100%",
        height: "100%",
        objectFit: "contain",
      });
      break;

    default:
      el = document.createElement("img");
      el.src = src;
      el.style.width = "100%";
      el.style.height = "100%";
  }

  viewerContent.appendChild(el);
  viewerOverlay.classList.remove("hidden");
}

function createFoodDetailView(data) {
  const container = document.createElement("div");
  container.className = "food-detail-container";

  // Get description from data or use default
  const description = data.description || "Deskripsi tidak tersedia.";

  // Get ingredients (already an array from JSON)
  const ingredients = Array.isArray(data.ingredients)
    ? data.ingredients
    : data.ingredients
      ? data.ingredients.split(",").map((item) => item.trim())
      : [];

  const wakil = Array.isArray(data.wakil)
    ? data.wakil
    : data.wakil
      ? data.wakil.split(",").map((item) => item.trim())
      : [];

  container.innerHTML = `
    <div class="food-detail-grid">
      <div class="food-image-container">
        <img src="${data.image}" alt="${data.name}">
      </div>
      <div class="food-specs-container">
        <h1>${data.name}</h1>
        <div class="food-spec-item">
          <span class="food-spec-label">Menteri</span>
          <span class="food-spec-value">${data.price}</span>
        </div>


        <div class="food-ingredients-card">
          <h3>Wakil</h3>
          <ul class="ingredients-list">
            ${wakil.map((wakil) => `<li>${wakil}</li>`).join("")}
          </ul>
        </div>
      
        <div class="food-ingredients-card">
          <h3>Pejabat Kementerian</h3>
          <ul class="ingredients-list">
            ${ingredients
      .map((ingredient) => `<li>${ingredient}</li>`)
      .join("")}
          </ul>
        </div>
      </div>
    </div>
    <div class="food-description-container">
      <h2>📝 Deskripsi</h2>
      <p>${description}</p>
    </div>
  `;

  return container;
}

// Single event listener for all cards
document.addEventListener("click", (e) => {
  const card = e.target.closest(".card.konten, .card.makanan");
  if (!card) return;

  if (
    card.classList.contains("makanan") &&
    card.dataset.type === "food-detail"
  ) {
    // Get the food index (0-based)
    const foodIndex = Array.from(card.parentElement.children).indexOf(card);

    // Get specs from JSON if available
    const specs = foodSpecs[foodIndex];

    if (!specs) {
      console.error(`❌ No food specs found for index ${foodIndex}`);
      return;
    }

    const foodData = {
      ...specs,
      // Use loaded description if available
      description: foodDescriptions[foodIndex] || "Deskripsi tidak tersedia.",
    };

    console.log("📦 Opening food detail:", foodData);
    openViewer("food-detail", null, foodData);
  } else {
    openViewer(card.dataset.type, card.dataset.src);
  }
});

function closeViewer() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => { });
  }

  const topic = safeTopic("/ui/mute_audio", "std_msgs/Int8");
  if (topic) {
    topic.publish({ data: 0 }); // mute audio/BGM
  } else {
    alert("ROS belum terkoneksi ⚠️");
  }

  // Add hidden class first
  viewerOverlay.classList.add("hidden");

  // Remove all viewer type classes
  viewerOverlay.classList.remove("food-detail", "promo");

  // Clear content
  viewerContent.innerHTML = "";

  console.log("✅ Viewer closed");
}

viewerClose.addEventListener("click", (e) => {
  e.stopPropagation();
  closeViewer();
});

viewerOverlay.addEventListener("click", (e) => {
  if (e.target === viewerOverlay) {
    closeViewer();
  }
});

// =============================================================================
// 📷 CAMERA VIEWER
// =============================================================================

document.getElementById("camera-btn").addEventListener("click", () => {
  // const host = window.location.hostname;
  if (!safeTopic("/ui/check_connection", "std_msgs/Empty")) {
    alert("ROS belum terkoneksi ⚠️");
    return;
  }
  const url = camera_path;
  openViewer("mjpeg", url);
});

// =============================================================================
// 🎥 PROMO VIDEO MODE
// =============================================================================

const promoPlaylist = [
  "assets/profile_rs.mp4",
  // "assets/RAISA_1.mp4",
  // "assets/ROBOT AI_1.mp4",
  // "assets/TEASER 1 RAISA 2.0.mp4",
  // "assets/ROBOT robot anjing berkaki 4.mp4",
];
// const promoPlaylist = [
//   "assets/toyota_1.mp4",
//   "assets/toyota_2.mp4",
//   "assets/iris.mp4",
//   "assets/TEASER 1 RAISA 2.0.mp4",
// ];
const promoBtn = document.getElementById("promo-btn");

promoBtn.addEventListener("click", () => openPromoVideo(promoPlaylist));

function openPromoVideo(playlist, index = 0) {
  const viewer = viewerOverlay;
  const videoPath = playlist[index];

  viewer.classList.remove("hidden");
  viewer.classList.add("promo");

  const viewerHeader = document.querySelector(".viewer-header");
  if (viewerHeader) viewerHeader.style.display = "none";

  viewerContent.innerHTML = `
    <video id="promo-video" autoplay playsinline muted>
      <source src="${videoPath}" type="video/mp4">
    </video>
    <button id="promo-close">✕</button>
  `;

  const video = document.getElementById("promo-video");
  const closeBtn = document.getElementById("promo-close");
  closeBtn.classList.add("visible");
  let hideTimeout = null;

  video.play().catch(() => { });
  video.muted = false;

  video.onended = () => {
    const next = (index + 1) % playlist.length;
    openPromoVideo(playlist, next);
  };

  viewer.addEventListener("click", () => {
    closeBtn.classList.add("visible");
    clearTimeout(hideTimeout);
    // hideTimeout = setTimeout(() => {
    //   closeBtn.classList.remove("visible");
    // }, 3000);
  });

  closeBtn.addEventListener("click", closePromo);
}

function closePromo() {
  viewerOverlay.classList.add("hidden");
  viewerOverlay.classList.remove("promo");
  viewerContent.innerHTML = "";

  const viewerHeader = document.querySelector(".viewer-header");
  if (viewerHeader) viewerHeader.style.display = "block";
}

// =============================================================================
// 🗣 ABOUT ME BUTTON
// =============================================================================

const aboutBtn = document.getElementById("about-btn");
const aboutOverlay = document.getElementById("about-overlay");
const aboutClose = document.getElementById("about-close");

function sendAboutMe(data_send = 1) {
  const topic = safeTopic("/ui/about_me", "std_msgs/Int8");
  if (topic) topic.publish({ data: data_send });
  else alert("ROS belum terkoneksi ⚠️");
}

aboutBtn.addEventListener("click", () => {
  aboutOverlay.classList.remove("hidden");
  sendAboutMe(1);
});

aboutClose.addEventListener("click", () => {
  aboutOverlay.classList.add("hidden");
  sendAboutMe(0);
});

// =============================================================================
// Charge Docking BUTTON
// =============================================================================

// ====== ELEMENT ======
const dockingBtn = document.getElementById("docking-btn");
const dockingOverlay = document.getElementById("docking-overlay");
const dockingMessage = document.getElementById("docking-message");
const dockingCancel = document.getElementById("docking-cancel");
const dockingClose = document.getElementById("docking-close");

// ====== BUTTON EVENT ======
dockingBtn.addEventListener("click", () => {
  sendGotoDocking();
});

// ====== FUNCTION ======
function sendGotoDocking() {
  const topic = safeTopic("/ui/goto_docking", "std_msgs/Int8");
  if (!topic) {
    alert("ROS belum terkoneksi ⚠️");
    return;
  }

  // tampilkan overlay
  dockingOverlay.classList.remove("hidden");
  dockingMessage.textContent = "Sedang menuju charging pile!";
  dockingCancel.classList.remove("hidden");
  dockingClose.classList.add("hidden");

  // kirim command
  topic.publish({ data: 1 });
  console.log("🚀 Docking command sent via safeTopic()");
}

// ====== CANCEL BUTTON ======
dockingCancel.addEventListener("click", () => {
  const cancelTopic = safeTopic("/ui/goto_docking", "std_msgs/Int8");
  if (cancelTopic) cancelTopic.publish({ data: 0 });
  console.log("🛑 Docking canceled via safeTopic()");
  dockingOverlay.classList.add("hidden");
});

// ====== CLOSE BUTTON ======
dockingClose.addEventListener("click", () => {
  dockingOverlay.classList.add("hidden");
});

// ====== ROS SUBSCRIBE (docking status) ======'

// subscribe docking status — dijamin aktif saat connect, dan auto re-subscribe saat reconnect
safeSubscribe("/communication/docking_status", "std_msgs/Int8", (msg) => {
  console.log("Docking status:", msg.data);
  if (msg.data === 1) {
    dockingMessage.textContent = "✅ DOCKING CHARGE SUKSES!";
    dockingCancel.classList.add("hidden");
    dockingClose.classList.remove("hidden");
  } else if (msg.data === -1) {
    dockingMessage.textContent = "❌ Docking Gagal. Silakan coba lagi.";
    dockingCancel.classList.add("hidden");
    dockingClose.classList.remove("hidden");
  }
});

// =============================================================================
// 🔋 BATTERY STATUS DISPLAY
// =============================================================================

const batteryPercentText = document.getElementById("battery-percent");
const batteryLevel = document.getElementById("battery-level");
const batteryStatus = document.getElementById("battery-status");

// Default visual
updateBatteryUI(0);

safeSubscribe(
  "/communication/robot_battery_status",
  "std_msgs/Float32",
  (msg) => {
    const percent = Math.max(0, Math.min(100, msg.data)); // clamp 0–100
    updateBatteryUI(percent);
  }
);

function updateBatteryUI(percent) {
  batteryLevel.style.width = `${percent}%`;
  batteryPercentText.textContent = `${percent.toFixed(0)}%`;

  batteryStatus.classList.remove(
    "battery-low",
    "battery-medium",
    "battery-high"
  );

  if (percent < 25) {
    batteryStatus.classList.add("battery-low");
  } else if (percent < 75) {
    batteryStatus.classList.add("battery-medium");
  } else {
    batteryStatus.classList.add("battery-high");
  }
}
// =============================================================================
// 🎵 BACKGROUND MUSIC PLAYER
// =============================================================================

const fs = require("fs");
const path = require("path");

// Lokasi buffer file
const bufferPath = path.join(__dirname, "music_last.txt");

// ==== FUNGSI BUFFER ====
function ensureFile() {
  if (!fs.existsSync(bufferPath)) {
    fs.writeFileSync(bufferPath, "");
  }
}

function saveLastMusicPath(filePath) {
  ensureFile();
  fs.writeFileSync(bufferPath, filePath.trim());
  console.log("💾 Last music saved:", filePath);
}

function getLastMusicPath() {
  ensureFile();
  const data = fs.readFileSync(bufferPath, "utf-8").trim();
  return data.length > 0 ? data : null;
}

// ==== DAFTAR MUSIK ====
const MUSIC_LIST = [
  //  src/electron_ui/assets/music/music-rek-ayo-rek.mp3
  "- - Stop Music - -",
  "assets/music/rek-ayo-rek.mp3",
  "assets/music/Foreplay-Fourplay-Cultura-Jazz.mp3",
  "assets/music/Hymne-ITS.mp3",
  "assets/music/IBU-PERTIWI.mp3",
  "assets/music/Jazz-Music.mp3",
  "assets/music/Liebesleid-(Love's-Sorrow)-Kreisler-Rousseau.mp3",
  "assets/music/Max-O-Man-Fourplay-Cultura-Jazz.mp3",
  "assets/music/Ampar Ampar pisang.mp3",
  "assets/music/Sinners-Finale.mp3",
  "assets/music/Yamko Rambe Yamko.mp3",
  "assets/music/Buruh-Tani.mp3",
  "assets/music/Nod Krai.mp3",
  "assets/music/mbg.mp3",
  // Tambahkan musik lain di sini
];

// ==== ELEMENT DOM ====
const musicOverlay = document.getElementById("music-overlay");
const musicList = document.getElementById("music-list");
const musicClose = document.getElementById("music-close");
const musicBtn = document.getElementById("music-btn");
const bgmPlayer = document.getElementById("bgm-player");

// =============================================================================
//  BGM
// =============================================================================
let bgmPrevVolume = bgmPlayer.volume; // simpan volume sebelumnya

function muteBGM() {
  if (!bgmPlayer.paused) {
    bgmPrevVolume = bgmPlayer.volume;
    bgmPlayer.volume = 0;
    console.log("🔇 BGM muted");
  }
}

function restoreBGM() {
  if (bgmPlayer.src && bgmPlayer.volume === 0) {
    bgmPlayer.volume = bgmPrevVolume;
    console.log("🔊 BGM restored");
  }
}

// ==== EVENT: buka overlay saat tombol ditekan ====
musicBtn.addEventListener("click", () => {
  musicOverlay.classList.remove("hidden");
  renderMusicList();
});

// ==== EVENT: tutup overlay ====
musicClose.addEventListener("click", () => {
  musicOverlay.classList.add("hidden");
});

// ==== RENDER LIST LAGU ====
function renderMusicList() {
  musicList.innerHTML = "";
  MUSIC_LIST.forEach((path) => {
    const name = path
      .split("/")
      .pop()
      .replace(/\.[^/.]+$/, "");
    const li = document.createElement("li");
    li.textContent = name;
    li.classList.add("music-item");

    li.addEventListener("click", () => playMusic(path, li));
    musicList.appendChild(li);
  });

  // tandai lagu terakhir dari buffer
  const last = getLastMusicPath();
  if (last) {
    const lastLi = [...musicList.children].find(
      (li) =>
        li.textContent ===
        last
          .split("/")
          .pop()
          .replace(/\.[^/.]+$/, "")
    );
    if (lastLi) lastLi.classList.add("active");
  }
}

// ==== PLAY FUNCTION ====
function playMusic(filePath, li) {
  bgmPlayer.src = filePath;
  bgmPlayer.loop = true;
  bgmPlayer.volume = 0.7;

  bgmPlayer.play().catch((err) => {
    console.warn("⚠️ Autoplay blocked:", err);
  });

  // update UI
  document
    .querySelectorAll(".music-item")
    .forEach((el) => el.classList.remove("active"));
  if (li) li.classList.add("active");

  // simpan ke file buffer
  saveLastMusicPath(filePath);
  console.log(`🎧 Playing ${filePath}`);
}

// ==== AUTOPLAY SAAT UI DIBUKA ====
window.addEventListener("DOMContentLoaded", () => {
  const last = getLastMusicPath();
  if (
    last &&
    fs.existsSync(path.join(__dirname, last)) &&
    MUSIC_LIST.includes(last)
  ) {
    playMusic(last, null);
  }
});

// =============================================================================
// 🌐 CONNECTION IP OVERLAY + ROS PUBLISH STRING
// =============================================================================

const connectBtn = document.getElementById("connect-btn");
const connectOverlay = document.getElementById("connect-overlay");
const connectClose = document.getElementById("connect-close");
const connectSubmit = document.getElementById("connect-submit");
const ipInput = document.getElementById("ip-input");

if (connectBtn) {//
  connectBtn.addEventListener("click", () => {
    connectOverlay.classList.remove("hidden");
    ipInput.value = "";
    ipInput.focus();
  });
}

if (connectClose) {
  connectClose.addEventListener("click", () => {
    connectOverlay.classList.add("hidden");
  });
}

connectSubmit?.addEventListener("click", async () => {
  const ip = ipInput.value.trim();

  if (!ip) {
    alert("IP tidak boleh kosong!");
    return;
  }

  try {
    const result = await ipcRenderer.invoke("save-ip", ip);

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log("IP tersimpan:", ip);
    connectOverlay.classList.add("hidden");
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan IP");
  }
});
// ================= SYSTEM VOLUME CONTROL =================
const { exec } = require("child_process");

const volumeBtn = document.getElementById("volume-btn");
const volumeOverlay = document.getElementById("volume-overlay");
const volumeSlider = document.getElementById("volume-slider");
const volumeLabel = document.getElementById("volume-label");
const volumeClose = document.getElementById("volume-close");

volumeBtn.addEventListener("click", () => {
  volumeOverlay.classList.remove("hidden");
  loadSystemVolume();
});

// Tutup
volumeClose.addEventListener("click", () => {
  volumeOverlay.classList.add("hidden");
});

// Set volume realtime
volumeSlider.addEventListener("input", () => {
  const vol = volumeSlider.value;
  volumeLabel.textContent = `${vol}%`;
  setSystemVolume(vol);
});

// ================= LINUX AUDIO ENGINE =================
function setSystemVolume(percent) {
  exec(`pactl set-sink-volume @DEFAULT_SINK@ ${percent}%`);
}

function loadSystemVolume() {
  exec(`pactl get-sink-volume @DEFAULT_SINK@`, (err, stdout) => {
    if (err) return;

    const match = stdout.match(/(\d+)%/);
    if (match) {
      const vol = match[1];
      volumeSlider.value = vol;
      volumeLabel.textContent = `${vol}%`;
    }
  });
}

// ================= VIRTUAL KEYBOARD ENGINE =================
let activeInput = null;

const vk = document.getElementById("vk-overlay");
const vkClose = document.getElementById("vk-close");

// Tampilkan keyboard saat input disentuh
document.addEventListener("focusin", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
    activeInput = e.target;
    vk.classList.remove("hidden");
  }
});

// Klik tombol keyboard
document.querySelectorAll(".vk-row button").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!activeInput) return;

    const key = btn.dataset.key;

    if (key === "Backspace") {
      activeInput.value = activeInput.value.slice(0, -1);
    } else if (key === "Enter") {
      activeInput.blur();
      vk.classList.add("hidden");
    } else {
      activeInput.value += key;
    }

    activeInput.dispatchEvent(new Event("input"));
  });
});

// Tutup manual
vkClose.addEventListener("click", () => {
  vk.classList.add("hidden");
  if (activeInput) activeInput.blur();
});

// ================= DEV SECRET MODE =================

const kontenBtn = document.querySelector('.nav-btn[data-page="konten"]');
const devOverlay = document.getElementById("dev-config-overlay");
const devClose = document.getElementById("dev-config-close");

let tapCount = 0;
let tapTimer = null;

// 10 TAP DALAM 3 DETIK
kontenBtn.addEventListener("click", () => {
  tapCount++;

  if (!tapTimer) {
    tapTimer = setTimeout(() => {
      tapCount = 0;
      tapTimer = null;
    }, 3000);
  }

  if (tapCount >= 10) {
    console.log("🛠 DEV CONFIG UNLOCKED");
    devOverlay.classList.remove("hidden");

    tapCount = 0;
    clearTimeout(tapTimer);
    tapTimer = null;
  }
});

devClose.addEventListener("click", () => {
  devOverlay.classList.add("hidden");
});

document.getElementById("dev-restart-ui")?.addEventListener("click", () => {
  location.reload();
});

document.getElementById("dev-reconnect-ros")?.addEventListener("click", () => {
  // location.reload(); // paling aman untuk re-init rosbridge
  // panggil systemctl dari terminal
  const { exec } = require("child_process");
  exec(
    "systemctl --user restart run_ros_riman.service",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error restarting rosbridge: ${error.message}`);
        alert("Gagal merestart rosbridge. Cek console untuk detail.");
        return;
      }
      console.log(`✅ rosbridge restarted: ${stdout}`);
      alert("rosbridge berhasil direstart.");
    }
  );
});

document.getElementById("dev-clear-cache")?.addEventListener("click", () => {
  localStorage.clear();
  alert("Cache cleared");
});

document
  .getElementById("dev-open-camera-test")
  ?.addEventListener("click", () => {
    openViewer("mjpeg", camera_path);
    devOverlay.classList.add("hidden");
  });

// =============================================================================
// 🛠 DEV MODE WEBVIEW INPUT
// =============================================================================

const devWebOverlay = document.getElementById("dev-web-overlay");
const devWebInput = document.getElementById("dev-web-input");
const devWebOpen = document.getElementById("dev-web-open");
const devWebClose = document.getElementById("dev-web-close");
const devWebBtn = document.getElementById("dev-open-browser");

devWebBtn.addEventListener("click", () => {
  openDevWebOverlay();
});

// 👉 panggil ini dari tombol dev kamu
function openDevWebOverlay() {
  devOverlay.classList.add("hidden");
  devWebOverlay.classList.remove("hidden");
  devWebInput.value = ROS_IP;
  devWebInput.focus();
}

devWebClose.addEventListener("click", () => {
  devWebOverlay.classList.add("hidden");
});

devWebOpen.addEventListener("click", () => {
  let url = devWebInput.value.trim();

  if (!url.startsWith("http")) {
    url = "http://" + url; // auto-fix
  }

  devWebOverlay.classList.add("hidden");

  // buka ke viewer internal (webview)
  openViewer("web", url);

  console.log("🧪 DEV WEBVIEW OPEN:", url);
});

// ================= CUSTOM KEYBOARD OVERLAY =================

const keyboardOverlay = document.getElementById("keyboard-overlay");
const keyboardInput = document.getElementById("keyboard-input");
const webview = document.querySelector("webview");

// buka keyboard
function showKeyboard() {
  keyboardOverlay.classList.remove("hidden");
  keyboardInput.value = "";
}

// tombol karakter
document.querySelectorAll(".keys button[data-key]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.key;
    if (key === "backspace") {
      keyboardInput.value = keyboardInput.value.slice(0, -1);
    } else {
      keyboardInput.value += key;
    }
  });
});

// tekan ENTER → kirim ke website
document.getElementById("keyboard-enter").addEventListener("click", () => {
  const text = keyboardInput.value;

  webview.executeJavaScript(`
    const el = document.activeElement;
    if (el && el.tagName === "INPUT") {
      el.value += ${JSON.stringify(text)};
      el.dispatchEvent(new Event('input'));
    }
  `);

  keyboardOverlay.classList.add("hidden");
});

window.addEventListener("message", (e) => {
  if (e.data === "OPEN_KEYBOARD") {
    showKeyboard(); // ini fungsi overlay keyboard virtual kamu
  }
});

// =============================================================================
// 🧭 NAVIGASI WAYPOINT
// =============================================================================

const navBtn = document.getElementById("nav-btn");
const navOverlay = document.getElementById("nav-overlay");
const navList = document.getElementById("nav-list");
const navClose = document.getElementById("nav-close");

const navProgressOverlay = document.getElementById("nav-progress-overlay");
const navProgressTitle = document.getElementById("nav-progress-title");
const navProgressCancel = document.getElementById("nav-progress-cancel");

navProgressCancel.addEventListener("click", () => {
  sendWaypointToROS("cancel");
  navProgressOverlay.classList.add("hidden");
  console.log("🛑 Waypoint canceled");
});

// TOMBOL NAVIGASI DITEKAN
navBtn.addEventListener("click", async () => {
  navOverlay.classList.remove("hidden");
  await loadWaypoints();
});

// TUTUP
navClose.addEventListener("click", () => {
  navOverlay.classList.add("hidden");
});

// AMBIL WAYPOINT DARI ROBOT (HTTP GET)
async function loadWaypoints() {
  navList.innerHTML = "Loading...";

  try {
    const host = ROS_IP;
    const res = await fetch(`http://${host}/reeman/position`);
    const data = await res.json();

    navList.innerHTML = "";

    data.waypoints.forEach((wp) => {
      if (wp.type === "charge") return; // hanya waypoint
      const btn = document.createElement("button");
      btn.className = "nav-waypoint-btn";
      btn.textContent = wp.name;

      btn.addEventListener("click", () => {
        sendWaypointToROS(wp.name);
        navOverlay.classList.add("hidden");

        // buka overlay progress
        navProgressTitle.textContent = `Robot sedang menuju lokasi ...`;
        navProgressOverlay.classList.remove("hidden");
      });

      navList.appendChild(btn);
    });
  } catch (err) {
    console.error("❌ Gagal ambil waypoint:", err);
    navList.innerHTML = "Gagal memuat waypoint";
  }
}

// KIRIM NAMA WAYPOINT KE ROS2 (STRING)
function sendWaypointToROS(name) {
  const topic = safeTopic("/ui/goto_waypoint", "std_msgs/String");
  if (!topic) {
    alert("ROS belum terkoneksi ⚠️");
    return false;
  }

  topic.publish({ data: name });
  console.log("📤 Waypoint dikirim ke ROS:", name);
  return true;
}

// Tombol AUTO & CANCEL
const navAuto = document.getElementById("nav-auto");
const navCancel = document.getElementById("nav-cancel");

// AUTO MODE
navAuto.addEventListener("click", () => {
  sendWaypointToROS("auto");
  navOverlay.classList.add("hidden");
  console.log("🤖 AUTO mode dikirim");
});

// CANCEL MODE
navCancel.addEventListener("click", () => {
  sendWaypointToROS("cancel");
  navOverlay.classList.add("hidden");
  console.log("🛑 CANCEL dikirim");
});

safeSubscribe("/communication/nav_status", "std_msgs/Int8", (msg) => {
  if (msg.data === 1) {
    // navProgressOverlay.classList.add("hidden");
    sendWaypointToROS("cancel");
    navProgressTitle.textContent = `Robot telah sampai di lokasi tujuan!`;
    handleVisitorNavigationArrival();
  }
});

// =============================================================================
// 👋 SAPA PENGUNJUNG
// =============================================================================

const visitorGreetingOverlay = document.getElementById("visitor-greeting-overlay");
const visitorGreetingTitle = document.getElementById("visitor-greeting-title");
const visitorGreetingMessage = document.getElementById("visitor-greeting-message");
const visitorInitialActions = document.getElementById("visitor-initial-actions");
const visitorArrivalActions = document.getElementById("visitor-arrival-actions");
const visitorNavigationActions = document.getElementById("visitor-navigation-actions");
const visitorGuideBtn = document.getElementById("visitor-guide-btn");
const visitorDeclineBtn = document.getElementById("visitor-decline-btn");
const visitorReturnPickupBtn = document.getElementById("visitor-return-pickup-btn");
const visitorArrivalHomeBtn = document.getElementById("visitor-arrival-home-btn");
const visitorNavigationHomeBtn = document.getElementById("visitor-navigation-home-btn");
const interactionBtn = document.querySelector('.nav-btn[data-page="lain"]');

const VISITOR_INITIAL_MESSAGE =
  "Halo! Saya Robot asisten RAISA siap membantu. Apakah Anda ingin saya antar ke lokasi PT Optima Group?";
const VISITOR_TAP_TARGET = 10;
const VISITOR_TAP_WINDOW_MS = 3000;
const VISITOR_ARRIVAL_GUARD_MS = 1000;

let visitorJourneyStage = "idle";
let visitorNavigationStartedAt = 0;
let visitorTapCount = 0;
let visitorTapTimer = null;

function setVisitorActionGroup(activeGroup) {
  [visitorInitialActions, visitorArrivalActions, visitorNavigationActions].forEach(
    (group) => group.classList.toggle("hidden", group !== activeGroup)
  );
}

function resetVisitorGreeting() {
  visitorJourneyStage = "idle";
  visitorNavigationStartedAt = 0;
  visitorGreetingTitle.textContent = "Selamat datang";
  visitorGreetingMessage.textContent = VISITOR_INITIAL_MESSAGE;
  setVisitorActionGroup(visitorInitialActions);
}

function openVisitorGreeting() {
  if (!visitorGreetingOverlay.classList.contains("hidden")) return;

  resetVisitorGreeting();
  visitorGreetingOverlay.classList.remove("hidden");
}

function closeVisitorGreeting() {
  visitorGreetingOverlay.classList.add("hidden");
  resetVisitorGreeting();
  showPage("konten");
}

function startVisitorNavigation(waypoint, stage, title, message) {
  if (!sendWaypointToROS(waypoint)) return;

  visitorJourneyStage = stage;
  visitorNavigationStartedAt = Date.now();
  visitorGreetingTitle.textContent = title;
  visitorGreetingMessage.textContent = message;
  setVisitorActionGroup(visitorNavigationActions);
}

function handleVisitorNavigationArrival() {
  if (
    visitorJourneyStage === "idle" ||
    Date.now() - visitorNavigationStartedAt < VISITOR_ARRIVAL_GUARD_MS
  ) {
    return;
  }

  if (visitorJourneyStage === "to-dropoff") {
    visitorJourneyStage = "at-dropoff";
    visitorGreetingTitle.textContent = "Tujuan tercapai";
    visitorGreetingMessage.textContent = "Robot sudah sampai di titik antar.";
    setVisitorActionGroup(visitorArrivalActions);
    return;
  }

  if (visitorJourneyStage === "to-pickup") {
    closeVisitorGreeting();
  }
}

visitorGuideBtn.addEventListener("click", () => {
  startVisitorNavigation(
    "titikantar",
    "to-dropoff",
    "Menuju PT Optima Group",
    "Robot sedang menuju titik antar. Silakan ikuti Robot RAISA."
  );
});

visitorReturnPickupBtn.addEventListener("click", () => {
  startVisitorNavigation(
    "titikjemput",
    "to-pickup",
    "Kembali ke Titik Jemput",
    "Robot sedang kembali menuju titik jemput."
  );
});

[visitorDeclineBtn, visitorArrivalHomeBtn, visitorNavigationHomeBtn].forEach(
  (button) => button.addEventListener("click", closeVisitorGreeting)
);

// 10 tap pada tombol Interaksi dalam 3 detik.
interactionBtn.addEventListener("click", () => {
  visitorTapCount++;

  if (!visitorTapTimer) {
    visitorTapTimer = setTimeout(() => {
      visitorTapCount = 0;
      visitorTapTimer = null;
    }, VISITOR_TAP_WINDOW_MS);
  }

  if (visitorTapCount >= VISITOR_TAP_TARGET) {
    openVisitorGreeting();
    visitorTapCount = 0;
    clearTimeout(visitorTapTimer);
    visitorTapTimer = null;
  }
});

safeSubscribe("/vision/face_detected", "std_msgs/Int8", (msg) => {
  const faceDetected = Number(msg.data) === 1;

  if (faceDetected) {
    openVisitorGreeting();
  } else if (!visitorGreetingOverlay.classList.contains("hidden")) {
    closeVisitorGreeting();
  }
});

//// ================= WI-FI MENU =================

// Node-wifi integration
const wifi = require("node-wifi");
wifi.init({ iface: null });

const wifiBtn = document.getElementById("wifi-btn");
const wifiOverlay = document.getElementById("wifi-overlay");
const wifiListEl = document.getElementById("wifi-list");
const wifiClose = document.getElementById("wifi-close");

wifiBtn.addEventListener("click", () => {
  wifiOverlay.classList.remove("hidden");
  loadWifiNetworks();
});

wifiClose.addEventListener("click", () => {
  wifiOverlay.classList.add("hidden");
});

function loadWifiNetworks() {
  if (!wifiListEl) return;
  wifiListEl.innerHTML = "Mencari jaringan...";

  wifi.scan((err, networks) => {
    if (err) {
      console.error("❌ Wi-Fi scan failed:", err);
      wifiListEl.innerHTML = "Gagal memindai jaringan";
      return;
    }

    renderWifiList(networks || []);
  });
}

function renderWifiList(networks) {
  wifiListEl.innerHTML = "";

  // sort by signal strength (desc)
  networks.sort((a, b) => (b.signal_level || 0) - (a.signal_level || 0));

  // get current connections to mark connected SSID
  wifi.getCurrentConnections((err, conns) => {
    const connectedSsids = Array.isArray(conns) ? conns.map((c) => c.ssid) : [];

    networks.forEach((net) => {
      const name = net.ssid || "<hidden>";
      const strength = net.signal_level || net.quality || 0;
      const security = net.security || net.security_flags || "unknown";

      let btn = document.createElement("button");
      btn.className = "nav-waypoint-btn";
      btn.className += " mg-4";
      // btn.textContent = `${name} (${strength} dBm, ${security})`;
      btn.textContent = `${name}`;
      btn.addEventListener("click", () => onWifiClicked(net));

      if (connectedSsids.includes(name)) btn.classList.add("connected");

      wifiListEl.appendChild(btn);
    });

    if (networks.length === 0) {
      wifiListEl.innerHTML = "Tidak ada jaringan ditemukan";
    }
  });
}

function onWifiClicked(net) {
  const ssid = net.ssid;
  const security = (net.security || net.security_flags || "").toLowerCase();
  if (!ssid) return;

  if (security && !/none|open/.test(security)) {
    promptWifiPassword(ssid, (password) => {
      if (password === null) return; // cancelled
      connectToWifi(ssid, password);
    });
  } else {
    connectToWifi(ssid, null);
  }
}

function connectToWifi(ssid, password) {
  const statusEl = showTempStatus(`Menghubungkan ke ${ssid}...`);

  wifi.connect({ ssid, password }, (err) => {
    if (err) {
      console.error("❌ Wi-Fi connect error", err);
      showTempStatus(`Gagal terhubung: ${err.message || err}`, 4000);
      return;
    }

    showTempStatus(`Berhasil terhubung ke ${ssid}`, 3000);
    // refresh list and status
    setTimeout(() => {
      loadWifiNetworks();
      updateWifiStatusUI();
    }, 1200);
  });
}

function showTempStatus(msg, timeout = 2000) {
  let el = document.getElementById("wifi-status-temp");
  if (!el) {
    el = document.createElement("div");
    el.id = "wifi-status-temp";
    el.style.cssText =
      "position: absolute; left: 50%; transform: translateX(-50%); bottom: 16px; background: rgba(0,0,0,0.7); color: #fff; padding: 8px 12px; border-radius: 8px; z-index: 999;";
    wifiOverlay.appendChild(el);
  }
  el.textContent = msg;
  if (timeout > 0) setTimeout(() => el.remove(), timeout);
  return el;
}

function promptWifiPassword(ssid, cb) {
  const modal = document.createElement("div");
  modal.className = "wifi-pass-modal";
  modal.style.cssText = [
    "position: fixed",
    "inset: 0",
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "background: rgba(0, 0, 0, 0.85)",
    "z-index: 10000",
    "padding: 24px",
  ].join(";");

  modal.innerHTML = `
    <div style="
      background: rgba(29, 27, 92, 0.98);
      border: 3px solid var(--cyan);
      border-radius: 20px;
      padding: 34px;
      width: 520px;
      max-width: 92vw;
      color: var(--white);
      box-shadow: 0 0 30px rgba(19, 201, 231, 0.45);
      position: relative;
    ">
      <button id="wifi-pass-cancel" style="
        position: absolute;
        top: 12px;
        right: 14px;
        font-size: 28px;
        line-height: 1;
        color: var(--yellow);
        background: rgba(0,0,0,0.3);
        border: 2px solid var(--cyan);
        border-radius: 8px;
        padding: 4px 10px;
        cursor: pointer;
      ">✕</button>
      <h3 style="margin: 0 0 8px 0; font-size: 30px; color: var(--yellow); text-shadow: 0 0 10px rgba(251, 226, 0, 0.45);">Masukkan kata sandi</h3>
      <div style="font-weight:700;margin-bottom:18px;color:var(--cyan);font-size:18px;word-break:break-word">${escapeHtml(
    ssid
  )}</div>
      <input
        type="password"
        id="wifi-pass-input"
        placeholder="Password Wi‑Fi"
        style="
          width: 100%;
          padding: 16px 18px;
          margin-bottom: 18px;
          border: 3px solid var(--cyan);
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          color: var(--white);
          font-size: 22px;
          outline: none;
          box-sizing: border-box;
          box-shadow: 0 0 18px rgba(19, 201, 231, 0.25);
        "
      />
      <div style="display:flex;gap:12px;justify-content:flex-end;align-items:center">
        <button id="wifi-pass-connect" style="
          background: linear-gradient(135deg, var(--cyan), var(--yellow));
          color: #000;
          border: none;
          padding: 14px 22px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 0 18px rgba(19, 201, 231, 0.35);
        ">CONNECT</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const input = modal.querySelector("#wifi-pass-input");
  input.focus();

  modal.querySelector("#wifi-pass-cancel").addEventListener("click", () => {
    cb(null);
    modal.remove();
  });

  modal.querySelector("#wifi-pass-connect").addEventListener("click", () => {
    cb(input.value);
    modal.remove();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      cb(input.value);
      modal.remove();
    } else if (event.key === "Escape") {
      cb(null);
      modal.remove();
    }
  });
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c])
  );
}

// ================= Wi‑Fi CONNECTION STATUS =================
const wifiStatusEl = document.getElementById("wifi-connection");

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

function updateWifiStatusUI() {
  if (!wifiStatusEl) return;

  wifi.getCurrentConnections((err, conns) => {
    if (err) {
      console.error("❌ getCurrentConnections error", err);
      wifiStatusEl.textContent = `Wi‑Fi: -- • IP: ${getLocalIP() || "--"}`;
      return;
    }

    const conn = Array.isArray(conns) && conns.length > 0 ? conns[0] : null;
    const ssid = conn && conn.ssid ? conn.ssid : null;
    const ip = getLocalIP();

    if (ssid) {
      wifiStatusEl.textContent = `Wi‑Fi: ${ssid} • IP: ${ip || "--"}`;
      wifiStatusEl.classList.add("connected");
    } else {
      wifiStatusEl.textContent = `Wi‑Fi: (disconnected) • IP: ${ip || "--"}`;
      wifiStatusEl.classList.remove("connected");
    }
  });
}

// =============================================================================
// DEMO TANGAN
// const tanganBtn = document.getElementById("tangan-btn");
// // When clicked, redirect to /tangan.html
// tanganBtn.addEventListener("click", () => {
//   window.location.href = "tangan.html";
// });

// DEMO TANGAN PLAYLIST ======================================================
const handPlaylist = [
  "assets/profile_rs.mp4",
  // "assets/RAISA_1.mp4",
  // "assets/ROBOT AI_1.mp4",
  // "assets/TEASER 1 RAISA 2.0.mp4",
];

const videoTanganBtn = document.getElementById("video-tangan-btn");
videoTanganBtn.addEventListener("click", () => {
  openHandVideoPlaylist();
});

// =========================================================
// HAND VIDEO PLAYLIST
// =========================================================
let handVideoIndex = 0;
function openHandVideoPlaylist() {
  handVideoIndex = 0;

  viewerOverlay.classList.remove("hidden");
  viewerOverlay.classList.add("promo");

  const viewerHeader = document.querySelector(".viewer-header");
  if (viewerHeader) viewerHeader.style.display = "none";

  playCurrentHandVideo();

  // sentuh layar sekali saja
  viewerOverlay.addEventListener("pointerdown", enterHandInteraction, {
    once: true,
  });
}

function playCurrentHandVideo() {
  viewerContent.innerHTML = `
        <video
            id="hand-video"
            autoplay
            playsinline
            muted
            preload="auto">
            <source src="${handPlaylist[handVideoIndex]}" type="video/mp4">
        </video>
    `;
  const video = document.getElementById("hand-video");
  video.play().catch(console.error);

  // aktifkan suara setelah autoplay
  video.oncanplay = () => {
    video.muted = false;
    video.play().catch(() => { });
  };

  // video selesai → berikutnya
  video.onended = () => {
    handVideoIndex++;
    if (handVideoIndex >= handPlaylist.length) handVideoIndex = 0;

    playCurrentHandVideo();
  };
}

function enterHandInteraction() {
  // stop video
  window.location.href = "tangan.html";
}

document.addEventListener("pointerdown", (e) => {
  const ripple = document.createElement("div");

  ripple.className = "touch-ripple";
  ripple.style.left = e.clientX + "px";
  ripple.style.top = e.clientY + "px";

  document.getElementById("touch-ripple-container").appendChild(ripple);

  ripple.addEventListener("animationend", () => {
    ripple.remove();
  });
});

// =============================================================================
// 🗣 VOICE CHAT BUTTON
// =============================================================================

const voiceBtn = document.getElementById("voice-btn");

voiceBtn.addEventListener("click", () => {
  const topic = safeTopic("/ui/mute_audio", "std_msgs/Int8");
  if (topic) {
    topic.publish({ data: 1 }); // mute audio/BGM
  } else {
    alert("ROS belum terkoneksi ⚠️");
  }
  // openViewer("web", "https://voice-chat-raisa.nabbit.id");

  // karena ini pakai SpeechRecognition di voicechat nya, harus dibuka pakai Chrome

  // const chromeCmd = `DISPLAY=:0 google-chrome --kiosk --password-store=basic --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0 --disk-cache-dir=/dev/null --window-position=1920,1200 "https://voice-chat-raisa.nabbit.id"`;
  const chromeCmd = `DISPLAY=:0 google-chrome --kiosk --password-store=basic --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0 --disk-cache-dir=/dev/null --disable-translate --disable-features=Translate --window-position=1920,1200 "https://voice-chat-raisa.nabbit.id"`;

  exec(chromeCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Failed to launch Chrome: ${error.message}`);
    }
  });

});

const voice2Btn = document.getElementById("voice2-btn");

voice2Btn.addEventListener("click", () => {
  const topic = safeTopic("/ui/mute_audio", "std_msgs/Int8");
  if (topic) {
    topic.publish({ data: 1 }); // mute audio/BGM
  } else {
    alert("ROS belum terkoneksi ⚠️");
  }
  // window.location.href = "voice2.html";
  // openViewer("web", "http://localhost:2222");

  console.log("🚀 Launching Chrome for Voice Chat...");

  // 2. Launch Google Chrome in Kiosk Mode
  // Note: We use --app to hide tabs, and pass all the media flags
  // const chromeCmd = `DISPLAY=:0 google-chrome --kiosk --app="http://localhost:2222" --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required`;
  const chromeCmd = `DISPLAY=:0 google-chrome --kiosk --password-store=basic --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0 --disk-cache-dir=/dev/null --window-position=1920,1200 "http://localhost:2222"`;

  exec(chromeCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Failed to launch Chrome: ${error.message}`);
    }
  });
});

// voiceBtn.addEventListener("click", () => {
//   const topic = safeTopic("/ui/mute_audio", "std_msgs/Int8");
//   if (topic) {
//     topic.publish({ data: 1 }); // mute audio/BGM
//   } else {
//     alert("ROS belum terkoneksi ⚠️");
//   }

//   if (typeof muteBGM === "function") {
//     muteBGM();
//   }

//   setTimeout(() => {
//     window.location.href = "voice.html";
//   }, 100);
// });

const sapapengunjungBtn = document.getElementById("sapapengunjung-btn");

// update periodically
setTimeout(updateWifiStatusUI, 800);
setInterval(updateWifiStatusUI, 10000);
// =============================================================================
// ✅ STATUS LOG
// =============================================================================
console.log("✅ Futuristic Robot UI Initialized");
