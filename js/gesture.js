window.AirDraw = window.AirDraw || {};

AirDraw.GestureDetector = class {
    constructor() {
        this.timers = { eraseStart: 0, fistStart: 0, firstPinchStart: 0, colorSwitchCooldown: 0 };
        this.smoothedPos = { x: 0.5, y: 0.5 };
        this.smoothedVelocity = 0;
        this.initialized = false;
        this.wasPinching = false;
        
        this.metrics = { mode: "IDLE", stabilityTimer: 0, eraseCountdown: 0, colorSwitchEvent: 0, pinchState: 0 };
        this.fullEraseDuration = 3000;
    }

    process(results) {
        const hands = results.multiHandLandmarks || [];
        const now = Date.now();
        
        this.metrics.stabilityTimer = 0;
        this.metrics.eraseCountdown = 0;
        this.metrics.colorSwitchEvent = 0;
        
        if (hands.length === 0) {
            this._resetTimers();
            this.metrics.mode = "IDLE";
            return this._getSnapshot(null, "IDLE", 0);
        }

        const hand = hands[0];

        const isFist = this._checkFist(hand);
        const isEraseRaw = !isFist && this._checkErase(hand);
        const isDrawPinch = !isFist && !isEraseRaw && this._checkDraw(hand);

        let rawX, rawY;
        if (isDrawPinch || this.metrics.mode === "DRAW") {
            rawX = (hand[4].x + hand[8].x) / 2;
            rawY = (hand[4].y + hand[8].y) / 2;
        } else if (isEraseRaw || this.metrics.mode === "ERASE") {
            rawX = (hand[8].x + hand[12].x) / 2;
            rawY = (hand[8].y + hand[12].y) / 2;
        } else {
            rawX = hand[9].x;
            rawY = hand[9].y;
        }

        if (!this.initialized) {
            this.smoothedPos = { x: rawX, y: rawY };
            this.initialized = true;
        } else {
            const prevX = this.smoothedPos.x;
            const prevY = this.smoothedPos.y;
            this.smoothedPos.x = 0.40 * rawX + 0.60 * this.smoothedPos.x;
            this.smoothedPos.y = 0.40 * rawY + 0.60 * this.smoothedPos.y;
            const dx = this.smoothedPos.x - prevX;
            const dy = this.smoothedPos.y - prevY;
            this.smoothedVelocity = 0.4 * (Math.sqrt(dx*dx + dy*dy) * 100) + 0.6 * this.smoothedVelocity;
        }

        let newMode = "IDLE";
        let countdown = 0;

        if (isFist) {
            this.timers.eraseStart = 0;
            this.wasPinching = false;
            this.metrics.pinchState = 0;
            
            if (this.timers.fistStart === 0) this.timers.fistStart = now;
            const elapsed = now - this.timers.fistStart;
            this.metrics.stabilityTimer = elapsed;
            countdown = Math.min(100, (elapsed / this.fullEraseDuration) * 100);
            this.metrics.eraseCountdown = countdown;
            
            if (elapsed >= this.fullEraseDuration) {
                newMode = "FULL_ERASE_TRIGGER";
                this._resetTimers();
            } else {
                newMode = "FULL_ERASE_HOLD";
            }
        } else if (isEraseRaw) {
            this.timers.fistStart = 0;
            this.wasPinching = false;
            this.metrics.pinchState = 0;
            
            if (this.timers.eraseStart === 0) this.timers.eraseStart = now;
            const elapsed = now - this.timers.eraseStart;
            this.metrics.stabilityTimer = elapsed;
            if (elapsed > 150) newMode = "ERASE";
        } else if (isDrawPinch) {
            this.timers.fistStart = 0;
            this.timers.eraseStart = 0;
            
            if (!this.wasPinching) {
                this.wasPinching = true;
                if (now - this.timers.colorSwitchCooldown < 500) {
                    newMode = "IDLE";
                } else if (this.metrics.pinchState === 1 && (now - this.timers.firstPinchStart < 400)) {
                    this.metrics.colorSwitchEvent = 1;
                    this.metrics.pinchState = 0;
                    this.timers.colorSwitchCooldown = now;
                    newMode = "IDLE";
                } else {
                    this.metrics.pinchState = 1;
                    this.timers.firstPinchStart = now;
                    newMode = "IDLE";
                }
            } else {
                if (this.metrics.pinchState === 1) {
                    if (now - this.timers.firstPinchStart >= 150) {
                        newMode = "DRAW";
                        this.metrics.pinchState = 2; 
                    } else {
                        newMode = "IDLE";
                    }
                } else if (this.metrics.pinchState === 2) {
                    newMode = "DRAW";
                }
            }
        } else {
            this.timers.fistStart = 0;
            this.timers.eraseStart = 0;
            this.wasPinching = false;

            if (this.metrics.pinchState === 2) {
                this.metrics.pinchState = 0;
            } else if (this.metrics.pinchState === 1 && (now - this.timers.firstPinchStart > 400)) {
                this.metrics.pinchState = 0;
            }
        }

        this.metrics.mode = (newMode === "FULL_ERASE_TRIGGER") ? "IDLE" : newMode;
        return this._getSnapshot(hand, newMode, countdown);
    }

    _resetTimers() {
        this.timers.eraseStart = 0;
        this.timers.fistStart = 0;
        this.timers.firstPinchStart = 0;
        this.initialized = false;
        this.smoothedVelocity = 0;
        this.wasPinching = false;
        this.metrics.pinchState = 0;
    }

    _checkFist(hand) {
        return [8, 12, 16, 20].every(i => hand[i].y > hand[i - 2].y);
    }

    _checkDraw(hand) {
        return this._dist(hand[4], hand[8]) < 0.055;
    }

    _checkErase(hand) {
        const thumbRelaxed = this._dist(hand[4], hand[8]) > 0.08;
        const pointersClose = this._dist(hand[8], hand[12]) < 0.055;
        return pointersClose && thumbRelaxed;
    }

    _dist(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    _getSnapshot(hand, mode, countdown) {
        return {
            mode, countdown,
            position: { x: this.smoothedPos.x, y: this.smoothedPos.y },
            velocity: this.smoothedVelocity,
            colorSwitchEvent: this.metrics.colorSwitchEvent,
            hand 
        };
    }
};
