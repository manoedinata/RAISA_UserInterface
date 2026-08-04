# Repository Guide

## Architecture

- Electron entry point: `main.js`.
- Renderer markup and styles: `index.html`, `style.css`.
- Renderer behavior and ROS integration: `app.js`.
- Shared ROS connection wrapper: `bridge.js`.

## ROS conventions

- Use `safeSubscribe(name, type, callback)` for subscriptions so reconnects are handled.
- Use `safeTopic(name, type)` or existing helper functions for publishing.
- Visitor greeting topics and values:
  - `/vision/face_detected`, `std_msgs/Int8`: `1` opens and `0` closes the greeting.
  - `/ui/goto_waypoint`, `std_msgs/String`: `titikantar` and `titikjemput` destinations.
  - `/communication/nav_status`, `std_msgs/Int8`: `1` means the active destination was reached.

## Visitor greeting behavior

- Ten taps on the **INTERAKSI** footer button within three seconds opens the greeting.
- Opening the greeting plays `assets/sayaraisa.mp3` from the beginning; closing it stops and resets the audio.
- The journey state is maintained in `app.js`; only arrival events for an active visitor journey change its UI.
- Returning Home closes the greeting but does not publish a navigation cancellation.
- Keep `README.md` and this file synchronized when behavior or topics change.

## Validation

- Run JavaScript syntax checks for changed renderer scripts.
- Verify Electron can start after UI changes; interactive robot and ROS validation is performed on the target system.