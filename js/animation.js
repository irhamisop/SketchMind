window.AirDraw = window.AirDraw || {};

AirDraw.AnimationEngine = class {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.opacity = 0;
        this.colorSwitchTimer = 0;
        this.currentColorText = "";
        this.colorSwitchPos = { x: 0, y: 0 };
        this.eraserPos = { x: 0, y: 0 };
    }

    update(config) { this.config = { ...this.config, ...config }; }

    triggerColorSwitch(color, position) {
        this.colorSwitchTimer = 30; // 500ms at 60fps
        this.currentColorText = color;
        this.colorSwitchPos = { ...position };
    }

    render(snapshot) {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        const hand = snapshot.hand;
        const mode = snapshot.mode;

        const targetOpacity = hand ? 1.0 : 0.0;
        this.opacity = 0.2 * targetOpacity + 0.8 * this.opacity;

        if (this.opacity < 0.01 && this.colorSwitchTimer <= 0) return;

        this.ctx.save();
        this.ctx.globalAlpha = this.opacity;

        if (hand) {
            this._drawCyberHand(hand, width, height, mode);

            if (mode === "ERASE") {
                this._drawEraseIndicator(snapshot, width, height);
            }

            if (mode === "FULL_ERASE_HOLD" || mode === "FULL_ERASE_TRIGGER") {
                const palm = hand[9];
                this._drawProgress(palm.x * width, palm.y * height, snapshot.countdown);
            }
        }

        this.ctx.restore();

        if (this.colorSwitchTimer > 0) {
            this._drawColorSwitchIndicator(width, height);
            this.colorSwitchTimer--;
        }
    }

    _drawCyberHand(hand, w, h, mode) {
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = "rgba(0, 242, 255, 0.5)";

        const connections = [
            [0,1],[1,2],[2,3],[3,4],
            [0,5],[5,6],[6,7],[7,8],
            [5,9],[9,10],[10,11],[11,12],
            [9,13],[13,14],[14,15],[15,16],
            [13,17],[17,18],[18,19],[19,20],
            [0,17]
        ];

        this.ctx.beginPath();
        connections.forEach(([i, j]) => {
            const p1 = hand[i], p2 = hand[j];
            this.ctx.moveTo((1 - p1.x) * w, p1.y * h);
            this.ctx.lineTo((1 - p2.x) * w, p2.y * h);
        });
        
        const grad = this.ctx.createLinearGradient(0, h, w, 0);
        grad.addColorStop(0, "rgba(0, 255, 150, 0.8)");
        grad.addColorStop(1, "rgba(0, 200, 255, 0.8)");
        this.ctx.strokeStyle = grad;
        this.ctx.stroke();

        const tips = [4, 8, 12, 16, 20];
        
        for (let i = 0; i < 21; i++) {
            const isTip = tips.includes(i);
            const x = (1 - hand[i].x) * w;
            const y = hand[i].y * h;

            this.ctx.beginPath();
            this.ctx.arc(x, y, isTip ? 5 : 2.5, 0, Math.PI * 2);

            let fillColor = isTip ? "#00ffff" : "#ffffff";
            let shadowColor = isTip ? "#00ffff" : "transparent";
            let shadowBlur = isTip ? 12 : 0;

            if (mode === "DRAW" && (i === 4 || i === 8)) {
                fillColor = "#ffffff"; 
                shadowColor = "#00ffff";
                shadowBlur = 20;
                this.ctx.arc(x, y, 7, 0, Math.PI * 2);
            } else if (mode === "ERASE" && (i === 8 || i === 12)) {
                fillColor = "#ffffff"; 
                shadowColor = "#ff9900";
                shadowBlur = 20;
                this.ctx.arc(x, y, 7, 0, Math.PI * 2);
            } else if (mode === "FULL_ERASE_HOLD") {
                fillColor = "#ff3333";
                shadowColor = "#ff3333";
                shadowBlur = 15;
            }

            this.ctx.fillStyle = fillColor;
            this.ctx.shadowColor = shadowColor;
            this.ctx.shadowBlur = shadowBlur;
            this.ctx.fill();
        }
    }

    _drawEraseIndicator(snapshot, w, h) {
        const targetX = (1 - snapshot.position.x) * w;
        const targetY = snapshot.position.y * h;
        
        if (this.eraserPos.x === 0 && this.eraserPos.y === 0) {
            this.eraserPos = { x: targetX, y: targetY };
        } else {
            this.eraserPos.x += (targetX - this.eraserPos.x) * 0.3;
            this.eraserPos.y += (targetY - this.eraserPos.y) * 0.3;
        }

        const size = this.config.eraseSize;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.eraserPos.x, this.eraserPos.y, size / 2, 0, Math.PI * 2);
        
        const grad = this.ctx.createRadialGradient(
            this.eraserPos.x, this.eraserPos.y, size/4,
            this.eraserPos.x, this.eraserPos.y, size/2
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        grad.addColorStop(1, "rgba(100, 200, 255, 0.1)");
        
        this.ctx.fillStyle = grad;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = "rgba(0, 200, 255, 0.6)";
        this.ctx.fill();

        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.stroke();

        this.ctx.restore();
    }

    _drawColorSwitchIndicator(w, h) {
        const x = (1 - this.colorSwitchPos.x) * w;
        const y = this.colorSwitchPos.y * h;
        
        const progress = 1 - (this.colorSwitchTimer / 30);
        const radius = 10 + (progress * 15);
        const alpha = Math.max(0, 1 - progress);
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI*2);
        this.ctx.fillStyle = this.currentColorText;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.currentColorText;
        this.ctx.fill();
        
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "rgba(255,255,255,1)";
        this.ctx.stroke();
        this.ctx.restore();
    }

    _drawProgress(x, y, percentage) {
        const flippedX = this.canvas.width - x; 
        
        const radius = 40;
        this.ctx.beginPath();
        this.ctx.arc(flippedX, y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = "rgba(255, 60, 60, 0.2)";
        this.ctx.lineWidth = 6;
        this.ctx.shadowBlur = 0;
        this.ctx.stroke();

        const endAngle = (percentage / 100) * Math.PI * 2;
        if (endAngle > 0) {
            this.ctx.beginPath();
            this.ctx.arc(flippedX, y, radius, -Math.PI / 2, -Math.PI / 2 + endAngle);
            this.ctx.strokeStyle = "#ff3c3c";
            this.ctx.lineWidth = 6;
            this.ctx.lineCap = "round";
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = "#ff3c3c";
            this.ctx.stroke();
        }
    }
};
