# RAISA User Interface

Vue 3 kiosk interface for the RAISA humanoid robot. The same Vite build runs in a browser with a local companion backend or in Electron with a restricted preload bridge.

## Setup

```bash
npm install
```

Development commands:

- `npm run dev:browser`: Vite on port `5173` plus the API-only backend on port `9999`.
- `npm run dev:electron`: Vite plus Electron with hot reload.
- `npm run dev`: frontend only; privileged APIs are proxied to an independently running backend.

Production commands:

- `npm run build`: generate `dist/` and copy static robot media/configuration.
- `npm run browser`: build, then serve `dist/` and `/api/*` at `http://localhost:9999`.
- `npm start`: build, then launch the fullscreen Electron kiosk.

Quality commands:

- `npm run lint`
- `npm test`
- `npm run format:check`

Do not open `index.html` directly with `file://` for browser validation. Use the HTTP development or production commands.

## Architecture

- `src/App.vue`: application workflow and overlay coordination.
- `src/views/`: Home, Interact, and About screens.
- `src/components/`: reusable chrome, cards, media viewer, modals, and virtual keyboard.
- `src/composables/`: robot, navigation, media, and Linux system-control state.
- `src/services/robotConfig.js`: robot host and derived ROS/camera/waypoint endpoints.
- `src/services/ros.js`: reconnecting ROS bridge, publishers, and managed subscriptions.
- `src/services/platform.js`: browser API/Electron IPC adapter.
- `src/data/`: content, interaction, music, and ROS topic declarations.
- `electron/`: Electron window, fixed IPC handlers, and privileged system operations.
- `backend/server.js`: browser companion API and production `dist/` server.
- `preload.js`: allowlisted Electron IPC bridge.
- `scripts/copy-static.js`: copies runtime static files after Vite builds.

The legacy root `app.js`, `style.css`, `config.js`, `platform.js`, and `bridge.js` remain temporarily for reference and standalone-page compatibility. The main kiosk entry no longer loads them.

## Robot Configuration

The default robot host is `10.209.100.3`. Override it in Settings or with a query parameter:

`http://localhost:9999/?robot=http://10.209.100.3`

The selected host is persisted in local storage. All robot endpoints derive from it:

- ROS bridge: `ws://robot-host:9090`
- Camera: `http://robot-host:8080/stream?topic=/vision/image_display`
- Waypoints: `http://robot-host/reeman/position`

Preserved ROS contracts include `/ui/goto_docking`, `/ui/goto_waypoint`, `/ui/mute_audio`, `/communication/robot_battery_status`, `/communication/docking_status`, and `/communication/nav_status`.

## Backend Configuration

Environment variables:

- `HOST`: bind address, default `0.0.0.0`.
- `PORT`: backend port, default `9999`.
- `RAISA_IP_FILE`: controller host persistence file, default `/home/raisa/ip_controller.txt`.

Linux features require `pactl`, NetworkManager/node-wifi prerequisites, the user service `run_ros_riman.service`, and optionally `google-chrome`. The API exposes fixed operations only and validates host, SSID, URL, and volume inputs. Keep it on a trusted network.

## Runtime Limits

Browser microphone behavior depends on browser and embedded-origin permissions. Cross-origin sites can refuse iframe embedding through CSP or `X-Frame-Options`. Robot, camera, waypoint, Wi-Fi, microphone, docking, and system-volume behavior requires the corresponding hardware and services for end-to-end verification.
