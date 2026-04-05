class SoundEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.drawOsc = null;
        this.drawGain = null;
        this.chargeOsc = null;
        this.chargeGain = null;
        this.lastSwipe = 0;
    }

    resume() { if (this.ctx.state === 'suspended') this.ctx.resume(); }

    triggerUI() {
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    }

    triggerColorSwitch() {
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    }

    triggerStartDraw() {
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    }

    startDrawLoop() {
        if (this.drawOsc) return;
        this.resume();
        const now = this.ctx.currentTime;
        this.drawOsc = this.ctx.createOscillator();
        this.drawGain = this.ctx.createGain();
        this.drawOsc.connect(this.drawGain); this.drawGain.connect(this.ctx.destination);
        this.drawOsc.type = 'sine';
        this.drawOsc.frequency.setValueAtTime(150, now);
        
        this.drawGain.gain.setValueAtTime(0, now);
        this.drawGain.gain.linearRampToValueAtTime(0.03, now + 0.2);
        this.drawOsc.start(now);
    }

    setDrawLoopFrequency(velocity) {
        if (this.drawOsc) {
            const freq = 150 + Math.min(velocity * 5, 200);
            this.drawOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        }
    }

    stopDrawLoop() {
        if (!this.drawOsc) return;
        const now = this.ctx.currentTime;
        this.drawGain.gain.cancelScheduledValues(now);
        this.drawGain.gain.setValueAtTime(this.drawGain.gain.value, now);
        this.drawGain.gain.linearRampToValueAtTime(0, now + 0.1);
        this.drawOsc.stop(now + 0.1);
        this.drawOsc = null;
        this.drawGain = null;
    }

    triggerEraseSwipe() {
        this.resume();
        const now = this.ctx.currentTime;
        if (now - this.lastSwipe < 0.2) return;
        this.lastSwipe = now;

        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
        
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        noise.start(now);
    }

    startCharge() {
        if (this.chargeOsc) return;
        this.resume();
        const now = this.ctx.currentTime;
        this.chargeOsc = this.ctx.createOscillator();
        this.chargeGain = this.ctx.createGain();
        this.chargeOsc.type = 'sawtooth';
        this.chargeOsc.connect(this.chargeGain); this.chargeGain.connect(this.ctx.destination);
        
        this.chargeOsc.frequency.setValueAtTime(200, now);
        this.chargeOsc.frequency.linearRampToValueAtTime(800, now + 3.0);
        
        this.chargeGain.gain.setValueAtTime(0, now);
        this.chargeGain.gain.linearRampToValueAtTime(0.03, now + 0.5);
        this.chargeOsc.start(now);
    }

    stopCharge() {
        if (!this.chargeOsc) return;
        const now = this.ctx.currentTime;
        this.chargeGain.gain.cancelScheduledValues(now);
        this.chargeGain.gain.setValueAtTime(this.chargeGain.gain.value, now);
        this.chargeGain.gain.linearRampToValueAtTime(0, now + 0.1);
        this.chargeOsc.stop(now + 0.1);
        this.chargeOsc = null;
        this.chargeGain = null;
    }

    triggerWaterfall() {
        this.resume();
        const now = this.ctx.currentTime;
        
        const bufferSize = this.ctx.sampleRate * 1.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + 0.6);
        filter.frequency.exponentialRampToValueAtTime(200, now + 1.2);
        
        noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.5);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);
        
        noise.start(now);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const elements = {
        helpOverlay: document.getElementById('help-overlay'),
        helpToggle: document.getElementById('help-btn'),
        debugPanel: document.getElementById('debug-panel'),
        colorIndicator: document.getElementById('color-indicator'),
        modeIndicator: document.getElementById('mode-indicator'),
        webcam: document.getElementById('webcam'),
        drawCanvas: document.getElementById('draw-canvas'),
        cursorCanvas: document.getElementById('cursor-canvas'),
        loadingOverlay: document.getElementById('loading-overlay'),
        drawSizeSlider: document.getElementById('draw-size'),
        drawSizeVal: document.getElementById('draw-size-val'),
        eraseSizeSlider: document.getElementById('erase-size'),
        eraseSizeVal: document.getElementById('erase-size-val'),
        debugState: document.getElementById('debug-state'),
        debugDrawSize: document.getElementById('debug-draw-size'),
        debugEraseSize: document.getElementById('debug-erase-size'),
        debugStability: document.getElementById('debug-stability'),
        debugCountdown: document.getElementById('debug-countdown')
    };

    const palette = ['#00f2ff', '#44ccff', '#ccff00', '#ff9900', '#ff00ff', '#ffffff'];
    let colorIdx = 0;

    let config = {
        brushColor: palette[colorIdx],
        drawSize: parseInt(elements.drawSizeSlider.value, 10),
        eraseSize: parseInt(elements.eraseSizeSlider.value, 10)
    };

    let tracker, gestureDetector, drawingEngine, animationEngine;
    const sounds = new SoundEngine();
    let currentMode = "INIT";
    let helpActive = false;

    elements.drawSizeSlider.addEventListener('input', (e) => {
        config.drawSize = parseInt(e.target.value, 10);
        elements.drawSizeVal.textContent = config.drawSize;
        if (drawingEngine) drawingEngine.updateConfig(config);
    });

    elements.eraseSizeSlider.addEventListener('input', (e) => {
        config.eraseSize = parseInt(e.target.value, 10);
        elements.eraseSizeVal.textContent = config.eraseSize;
        if (drawingEngine) drawingEngine.updateConfig(config);
        if (animationEngine) animationEngine.update(config);
    });

    function toggleHelp() {
        helpActive = !helpActive;
        elements.helpOverlay.classList.toggle('hidden', !helpActive);
        if (helpActive) elements.helpOverlay.classList.add('active');
        else elements.helpOverlay.classList.remove('active');
        sounds.triggerUI();
    }

    elements.helpToggle.addEventListener('click', toggleHelp);
    elements.helpOverlay.addEventListener('click', () => { if (helpActive) toggleHelp(); });

    function handleResults(results) {
        if (!gestureDetector || !drawingEngine) return;

        const snapshot = gestureDetector.process(results);

        if (snapshot.colorSwitchEvent !== 0 && snapshot.hand) {
            colorIdx = (colorIdx + 1) % palette.length;
            config.brushColor = palette[colorIdx];
            if (drawingEngine) drawingEngine.updateConfig(config);
            
            // Trigger color switch at index tip position (landmark 8)
            const indexTip = snapshot.hand[8];
            if (animationEngine) animationEngine.triggerColorSwitch(config.brushColor, indexTip);
            sounds.triggerColorSwitch();
        }

        if (currentMode !== snapshot.mode) {
            if (snapshot.mode === "DRAW") sounds.triggerStartDraw();
            if (snapshot.mode === "FULL_ERASE_HOLD") sounds.startCharge();
            if (currentMode === "FULL_ERASE_HOLD" && snapshot.mode !== "FULL_ERASE_TRIGGER" && snapshot.mode !== "FULL_ERASE_HOLD") sounds.stopCharge();
            if (snapshot.mode === "FULL_ERASE_TRIGGER") {
                sounds.stopCharge();
                sounds.triggerWaterfall();
                drawingEngine.triggerWaterfall();
            }
            if (currentMode === "DRAW" && snapshot.mode !== "DRAW") sounds.stopDrawLoop();

            currentMode = snapshot.mode;
            elements.modeIndicator.textContent = currentMode;
            elements.modeIndicator.className = `mode-pill mode-${currentMode.toLowerCase()}`;
        }

        if (currentMode === "DRAW") {
            sounds.startDrawLoop();
            sounds.setDrawLoopFrequency(snapshot.velocity);
        } else if (currentMode === "ERASE" && snapshot.velocity > 5) {
            sounds.triggerEraseSwipe();
        }

        drawingEngine.render(snapshot);
        animationEngine.render(snapshot);

        if (!elements.debugPanel.classList.contains('hidden')) {
            elements.debugState.textContent = currentMode;
            elements.debugDrawSize.textContent = config.drawSize;
            elements.debugEraseSize.textContent = config.eraseSize;
            const metrics = gestureDetector.metrics;
            elements.debugStability.textContent = `${metrics.stabilityTimer}ms`;
            elements.debugCountdown.textContent = `${Math.round(metrics.eraseCountdown)}%`;
        }
    }

    try {
        gestureDetector = new AirDraw.GestureDetector();
        drawingEngine = new AirDraw.DrawingEngine(elements.drawCanvas, elements.cursorCanvas, config);
        animationEngine = new AirDraw.AnimationEngine(elements.cursorCanvas, config);
        tracker = new AirDraw.Tracker(elements.webcam, handleResults, () => {});
        
        await tracker.init();
        elements.loadingOverlay.classList.add('fade-out');
    } catch (err) { console.error("Init Error:", err); }

    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'd') elements.debugPanel.classList.toggle('hidden');
        if (k === '?') toggleHelp();
        if (k === 'c') {
            drawingEngine.triggerWaterfall();
            sounds.triggerWaterfall();
        }
    });
});
