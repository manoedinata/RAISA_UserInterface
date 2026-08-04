# Agent Notes

## Architecture

This repository supports both Electron and browser execution.

- Browser frontend modules: `config.js`, `platform.js`, `bridge.js`, and `app.js`.
- Browser companion backend: `backend/server.js`.
- Electron boundary: `preload.js` and `main.js`.
- Static UI entry point: `index.html`.

## Development Commands

- `npm start`: launch Electron.
- `npm run browser`: serve the frontend and companion backend at port `9999`.
- `npm run backend`: alias for the browser backend server.

## Implementation Rules

- Keep browser-loaded frontend files free from top-level Node/Electron imports.
- Add privileged features to the platform adapter and implement them in both the backend and Electron IPC where applicable.
- Use the configured robot host from `config.js`; do not introduce separate hardcoded ROS, camera, or waypoint hosts.
- Preserve existing ROS topic names and message types unless the task explicitly changes the robot contract.
- Use fixed allowlisted backend commands with validated inputs. Never expose arbitrary shell execution through an API route.
- Browser mode requires HTTP serving; do not validate it by opening `index.html` through `file://`.

## Validation

Run editor diagnostics after changes. For runtime checks, start `npm run browser` and inspect the browser console, then run `npm start` and inspect the Electron console. Interactive robot, Wi-Fi, microphone, and system-audio checks require the corresponding hardware and services.
