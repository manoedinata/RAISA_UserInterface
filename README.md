# RAISA User Interface

## Runtime Architecture

The UI has one browser-safe frontend and two runtime options:

- **Browser**: `backend/server.js` serves the static files and provides privileged Linux operations through `/api/*`.
- **Electron**: `main.js` launches the UI and exposes the same operations through a restricted preload bridge.
- **Robot endpoint**: `config.js` derives ROS bridge, camera, and waypoint URLs from one robot host.

Frontend code must remain free of direct `require`, filesystem, child-process, OS, and Wi-Fi imports. Runtime-specific operations belong in `platform.js`, the Electron preload bridge, or the companion backend.

## Run In A Browser

From this directory:

```bash
npm run browser
```

Open `http://localhost:9999`. The backend binds to `0.0.0.0:9999` by default, so another machine can access it using the UI host's IP address.

Set a different robot host with a query parameter:

`http://localhost:9999/?robot=http://10.209.100.3`

The selected host is persisted in browser local storage. The derived endpoints are:

- ROS bridge: `ws://robot-host:9090`
- Camera: `http://robot-host:8080/stream?topic=/vision/image_display`
- Waypoints: `http://robot-host/reeman/position`

The robot must expose rosbridge on port `9090`, camera streaming on port `8080`, and the waypoint endpoint with CORS enabled for browser access.

## Run In Electron

```bash
npm start
```

Electron retains fullscreen behavior, embedded webviews, media permission handling, and privileged operations through `preload.js` and `main.js`.

## Backend Configuration

Environment variables:

- `HOST`: backend bind address, default `0.0.0.0`.
- `PORT`: backend port, default `9999`.
- `RAISA_IP_FILE`: controller-IP persistence file, default `/home/raisa/ip_controller.txt`.

Linux prerequisites for full parity:

- `pactl` for system volume control.
- `node-wifi` dependencies and NetworkManager/wireless tools for Wi-Fi scanning and connection.
- `systemctl --user restart run_ros_riman.service` for the developer ROS reconnect action.
- `google-chrome` for the external voice-chat launch action.

The backend uses fixed command routes and validates URL, host, SSID, and volume inputs. It is intended for a trusted local network and should not be exposed directly to an untrusted network.

## Browser Limitations

Browser microphone permissions are controlled by the browser and the embedded voice-chat origin. Cross-origin sites may refuse iframe embedding through `X-Frame-Options` or CSP; Electron webviews have fewer restrictions because of the existing Electron configuration. Direct `file://` opening is unsupported; use `npm run browser` so ES modules, fetch, and backend APIs work correctly.

## Project Layout

- `index.html`, `style.css`, `app.js`: frontend UI.
- `config.js`: robot endpoint configuration.
- `platform.js`: browser/Electron runtime adapter.
- `bridge.js`: ROS bridge connection and topic helpers.
- `preload.js`, `main.js`: Electron runtime boundary.
- `backend/server.js`: browser companion backend and static server.
- `assets/`, `config/`: media and food data.
