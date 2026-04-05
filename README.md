# Air Interface

A highly optimized gesture-controlled holographic drawing application in the browser.

## Features

- **Pinch Draw**: Bring thumb and index finger together to draw seamlessly.
- **Index + Middle Erase**: Touching index and middle fingers together triggers an interpolated precision eraser.
- **3s Fist Waterfall Wipe**: Hold a closed fist for 3 seconds to clear the entire canvas with a beautiful waterfall physics animation.
- **Double Pinch Color Switch**: Briefly pinch twice within 400ms to cycle through the color palette.
- **Adjustable Brush Sizes**: Easily tweak draw sizes (1–25) and erase sizes (10–80) via modern glass-morphism UI.
- **Neon Hand Skeleton**: Futuristic cyan and green node-based skeleton mapping your hand live.
- **Sound Effects**: Dynamic Web Audio API integration with swipe and waterfall sweeps.

## Controls
- **? (Help)**: Open floating UI configuration to view all gestures.
- **D**: Toggle gesture debug panel.
- **C**: Force trigger a full canvas wipe using keyboard.

## Tech Stack
- **Frontend**: HTML5 Canvas, Vanilla ES6 JavaScript, CSS Custom Properties.
- **Tracking**: MediaPipe Hands.
- **Backend / Deployment**: Java Spring Boot (static files served directly currently).

## How to Run Locally
1. Open terminal inside the `src/main/resources/static` directory.
2. Run any standard static file server, for example python:
   ```bash
   python -m http.server 5500
   ```
3. Navigate to `http://localhost:5500` in your web browser.
