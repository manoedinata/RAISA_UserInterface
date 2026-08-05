# Repository Guide

## Architecture

- Electron entry point: `main.js`.
- Renderer markup and styles: `index.html`, `style.css`.
- Renderer behavior and ROS integration: `app.js`.
- Shared ROS connection wrapper: `bridge.js`.
- Window modes are selected in `main.js`: `--dev` or `NODE_ENV=development` uses 640×960 windowed mode; the default production mode uses 1200×1920 fullscreen.

## ROS conventions

- Use `safeSubscribe(name, type, callback)` for subscriptions so reconnects are handled.
- Use `safeTopic(name, type)` or existing helper functions for publishing.
- `/ui/goto_waypoint`, `std_msgs/String`: accepts `titikantar`, `titikjemput`, and `cancel`.
- `/communication/nav_status`, `std_msgs/Int8`: `1` means the active destination was reached.

## Promo navigation behavior

- Opening the promo video starts or resumes the automatic `titikjemput → titikantar` loop.
- The loop waits five seconds after each `/communication/nav_status = 1` arrival before publishing the opposite waypoint.
- Closing the promo publishes `cancel`, clears the active wait timer, and preserves the pending target.
- Reopening the promo republishes an interrupted target. If paused during an arrival wait, it restarts the five-second wait before continuing.
- Promo video playback continues independently when ROS is unavailable; promo loop publications fail without blocking dialogs.
- Manual waypoint selection remains available, but automatic loop controls are not exposed in the navigation menu.
- The visitor greeting UI, face-detection subscription, greeting audio behavior, and visitor journey state have been removed.
- Keep `README.md` and this file synchronized when behavior or topics change.

## Validation

- Run JavaScript syntax checks for changed renderer scripts.
- Run `npm run dev` for non-fullscreen development; `npm start` is the production configuration.
- Verify Electron can start after UI changes; interactive robot and ROS validation is performed on the target system.