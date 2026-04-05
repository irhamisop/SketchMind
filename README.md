# SketchMind

An AI-powered gesture drawing tool capturing motion in the air directly onto the canvas in your browser.

## Features
* Pinch to Draw
* Two-finger Interpolated Eraser
* Triple/Double gesture support
* 3s Fist hold Waterwipe clear
* Double Pinch Color Palette Switching
* Adjustable Brush & Erase Sizes
* Neon Cyber Hand Skeleton Visualizer
* Realistic Web Audio integration

## Tech Stack
* HTML5 Canvas
* Vanilla ES6 JavaScript
* CSS 3 Glass-Morphism Variables
* MediaPipe Hands Tracking

## ?? How to Run the Program Locally

Because this application uses the webcam and microphone (Web Audio/MediaPipe), modern web browsers strictly require it to be served from a local server to work securely. You cannot just double-click the index.html file.

### Option 1: Using Python (Recommended)
1. Open up your terminal or command prompt.
2. Navigate to your \SketchMind\ folder on your Desktop:
   `ash
   cd "C:\Users\Irham Kapadiya\OneDrive\Desktop\SketchMind"
   `
3. Run the built-in HTTP server on port 5500:
   `ash
   python -m http.server 5500
   `
4. Open your web browser and go to: [http://localhost:5500](http://localhost:5500)

### Option 2: Using VS Code Live Server
1. Open the \SketchMind\ folder in Visual Studio Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Open \index.html\, right-click anywhere in the code, and select **"Open with Live Server"**.
4. The application will automatically open in your browser.

## Basic Usage Instructions
1. Open the link (http://localhost:5500) in your browser.
2. Allow webcam access when prompted.
3. Hold your hand up to the camera!
4. Click the '?' button for help to learn specific gestures and commands.
