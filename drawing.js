window.AirDraw = window.AirDraw || {};

AirDraw.DrawingEngine = class {
    constructor(drawCanvas, cursorCanvas, config) {
        this.drawCanvas = drawCanvas;
        this.cursorCanvas = cursorCanvas;
        this.drawCtx = drawCanvas.getContext('2d');
        this.config = config;
        this.points = [];
        this.lastMidPoint = null;
        this.wipeState = { active: false, start: 0, duration: 1000 };
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const temp = document.createElement('canvas');
        temp.width = this.drawCanvas.width;
        temp.height = this.drawCanvas.height;
        if (this.drawCanvas.width > 0) temp.getContext('2d').drawImage(this.drawCanvas, 0, 0);

        this.drawCanvas.width = window.innerWidth;
        this.drawCanvas.height = window.innerHeight;
        this.cursorCanvas.width = window.innerWidth;
        this.cursorCanvas.height = window.innerHeight;
        
        this.setupContexts();
        if (temp.width > 0) this.drawCtx.drawImage(temp, 0, 0);
    }

    setupContexts() {
        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    triggerWaterfall() {
        if (this.wipeState.active) return;
        this.wipeState.active = true;
        this.wipeState.start = performance.now();
        this.points = [];
        this.lastMidPoint = null;
        this._waterfallLoop();
    }

    _waterfallLoop() {
        if (!this.wipeState.active) return;
        
        const now = performance.now();
        const elapsed = now - this.wipeState.start;
        const progress = Math.min(elapsed / this.wipeState.duration, 1.0);
        
        const w = this.drawCanvas.width;
        const h = this.drawCanvas.height;
        const waveX = progress * (w + 200) - 100;
        
        this.drawCtx.save();
        this.drawCtx.globalCompositeOperation = 'destination-out';
        this.drawCtx.fillStyle = `rgba(255, 255, 255, 0.15)`;
        this.drawCtx.fillRect(0, 0, waveX, h);
        this.drawCtx.restore();

        const cCtx = this.cursorCanvas.getContext('2d');
        cCtx.save();
        
        cCtx.clearRect(Math.max(0, waveX - 400), 0, Math.min(400, waveX), h);
        
        if (progress < 1.0) {
            cCtx.beginPath();
            cCtx.moveTo(waveX, 0);
            for(let y = 0; y <= h; y += 20) {
                const offset = Math.sin((y + now) * 0.02) * 30;
                cCtx.lineTo(waveX + offset, y);
            }
            cCtx.lineTo(waveX - 100, h);
            cCtx.lineTo(waveX - 100, 0);
            
            const gradient = cCtx.createLinearGradient(waveX, 0, waveX - 100, 0);
            gradient.addColorStop(0, "rgba(0, 242, 255, 0.4)");
            gradient.addColorStop(0.5, "rgba(0, 200, 255, 0.1)");
            gradient.addColorStop(1, "transparent");
            
            cCtx.fillStyle = gradient;
            cCtx.fill();
            
            if (Math.random() < 0.5) {
                this.particles.push({
                    x: waveX + Math.random() * 20 - 10,
                    y: Math.random() * h,
                    vx: Math.random() * -2 - 1,
                    vy: Math.random() * 2 - 1,
                    life: 1.0
                });
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.05;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            cCtx.beginPath(); cCtx.arc(p.x, p.y, p.life * 3, 0, Math.PI*2);
            cCtx.fillStyle = `rgba(150, 255, 255, ${p.life})`;
            cCtx.fill();
        }

        cCtx.restore();

        if (progress < 1.0 || this.particles.length > 0) {
            requestAnimationFrame(() => this._waterfallLoop());
        } else {
            this.wipeState.active = false;
            this.drawCtx.clearRect(0, 0, w, h);
            cCtx.clearRect(0, 0, w, h);
        }
    }

    render(snapshot) {
        if (this.wipeState.active) return;
        
        const mode = snapshot.mode;
        if (mode === "FULL_ERASE_TRIGGER") {
            this.triggerWaterfall();
            return;
        }
        if (mode !== "DRAW" && mode !== "ERASE") {
            this._resetStroke();
            return;
        }

        const screenX = (1 - snapshot.position.x) * this.drawCanvas.width;
        const screenY = snapshot.position.y * this.drawCanvas.height;

        this.draw(screenX, screenY, mode);
    }

    draw(x, y, mode) {
        this.points.push({ x, y });
        if (this.points.length < 2) return;

        this.drawCtx.save();
        if (mode === "ERASE") {
            this.drawCtx.globalCompositeOperation = 'destination-out';
            this.drawCtx.lineWidth = this.config.eraseSize;
            this.drawCtx.shadowBlur = 0;
            this.drawCtx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            this.drawCtx.globalCompositeOperation = 'source-over';
            this.drawCtx.lineWidth = this.config.drawSize;
            this.drawCtx.strokeStyle = this.config.brushColor;
            this.drawCtx.shadowBlur = 8;
            this.drawCtx.shadowColor = this.config.brushColor;
        }

        const p1 = this.points[this.points.length - 2];
        const p2 = this.points[this.points.length - 1];
        const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        if (!this.lastMidPoint) {
            this.drawCtx.beginPath();
            this.drawCtx.moveTo(p1.x, p1.y);
            this.drawCtx.lineTo(midPoint.x, midPoint.y);
            this.drawCtx.stroke();
        } else {
            this.drawCtx.beginPath();
            this.drawCtx.moveTo(this.lastMidPoint.x, this.lastMidPoint.y);
            this.drawCtx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            this.drawCtx.stroke();
        }

        this.lastMidPoint = midPoint;
        if (this.points.length > 3) this.points.shift();
        this.drawCtx.restore();
    }

    _resetStroke() {
        this.points = [];
        this.lastMidPoint = null;
    }
};
