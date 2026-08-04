# Agent Notes

## Architecture

This repository is a Vue 3 and Vite kiosk supporting Electron and browser execution.

- Vue entry: `index.html`, `src/main.js`, and `src/App.vue`.
- UI modules: `src/views/`, `src/components/`, `src/composables/`, and `src/data/`.
- Browser-safe boundaries: `src/services/robotConfig.js`, `src/services/ros.js`, and `src/services/platform.js`.
- Browser companion: `backend/server.js` serves `dist/` and fixed `/api/*` routes.
- Electron boundary: `preload.js`, `main.js`, and `electron/`.
- Build-time static copy: `scripts/copy-static.js` preserves root asset URLs in `dist/`.

Legacy root frontend modules remain for reference/standalone pages but are not loaded by the main Vue entry.

## Commands

- `npm run dev:browser`: Vite plus API-only browser backend.
- `npm run dev:electron`: Vite plus Electron.
- `npm run build`: Vite build and static media/config copy.
- `npm run browser`: production build served at port `9999`.
- `npm start`: production build in Electron.
- `npm run lint`, `npm test`, `npm run format:check`: validation.

## Implementation Rules

- Use Vue Composition API with JavaScript SFCs. Do not add Router or Pinia without a demonstrated need.
- Keep browser-loaded code free from Node and Electron imports.
- Put privileged operations behind `src/services/platform.js`, then implement them in both `electron/ipc.js` and `backend/server.js`.
- Use fixed allowlisted commands with validated inputs. Never expose arbitrary shell execution.
- Derive ROS, camera, and waypoint endpoints from `src/services/robotConfig.js`; do not add independent hardcoded robot hosts.
- Preserve existing ROS topic names and message types unless the task explicitly changes the robot contract.
- Use relative static asset URLs so production Electron `file://` loading remains valid.
- Add media/config entries to `scripts/copy-static.js` when a new root static dependency is introduced.
- Keep README and this file synchronized with major architecture, workflow, or settings changes.

## Validation

Run diagnostics, lint, tests, formatting checks, and a production build after changes. Browser mode requires HTTP serving. Use browser inspection for responsive/UI checks and verify Electron startup separately. Robot, Wi-Fi, microphone, camera, docking, and system-audio behavior requires corresponding hardware and services and remains an interactive validation step.
