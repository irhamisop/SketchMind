/* ================================================================
   tracker.js — Hand Tracking Module (MediaPipe Hands)
   ================================================================ */

window.AirDraw = window.AirDraw || {};

AirDraw.Tracker = class {
    /**
     * @param {HTMLVideoElement} videoElement
     * @param {Function} onResults - callback(results)
     * @param {Function} onStatusUpdate - callback(statusText, progress)
     */
    constructor(videoElement, onResults, onStatusUpdate) {
        this.video = videoElement;
        this.onResults = onResults;
        this.onStatusUpdate = onStatusUpdate || (() => {});
        this.hands = null;
        this.camera = null;
    }

    async init() {
        console.log("Tracker: Initializing MediaPipe Hands...");
        this.onStatusUpdate('Loading hand tracking model…', 30);

        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => {
            if (this.onResults) this.onResults(results);
        });

        console.log("Tracker: Requesting camera access...");
        this.onStatusUpdate('Accessing camera…', 60);

        try {
            // Check if camera utility is available
            if (typeof Camera === 'undefined') {
                throw new Error("MediaPipe Camera utility not found. Check script imports.");
            }

            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    await this.hands.send({ image: this.video });
                },
                width: 1280,
                height: 720
            });

            console.log("Tracker: Starting camera stream...");
            this.onStatusUpdate('Starting camera stream…', 80);
            await this.camera.start();
            
            console.log("Tracker: Camera started successfully.");
            this.onStatusUpdate('Ready!', 100);
        } catch (err) {
            console.error("Tracker: Error initializing camera", err);
            throw new Error('CAMERA_ACCESS_DENIED');
        }
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
        }
    }
};
