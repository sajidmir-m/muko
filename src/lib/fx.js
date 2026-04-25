// Canvas FX helpers: background stars + fire heart

export class BackgroundFX {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.particles = [];
    this.t = 0;
    this.resize();
    this.seed();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.w = w;
    this.h = h;
    this.c.width = Math.floor(w * this.dpr);
    this.c.height = Math.floor(h * this.dpr);
    this.c.style.width = `${w}px`;
    this.c.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  seed() {
    const count = Math.round(Math.min(140, Math.max(70, (this.w * this.h) / 12000)));
    this.particles = new Array(count).fill(0).map(() => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      r: 0.6 + Math.random() * 1.7,
      a: 0.15 + Math.random() * 0.55,
      vx: (-0.08 + Math.random() * 0.16) * (0.7 + Math.random() * 0.8),
      vy: (-0.04 + Math.random() * 0.08) * (0.7 + Math.random() * 0.8),
      hue: 285 + Math.random() * 50,
      tw: 0.2 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2
    }));
  }

  step(dt = 0.016) {
    const ctx = this.ctx;
    this.t += dt;

    ctx.clearRect(0, 0, this.w, this.h);

    const g = ctx.createRadialGradient(
      this.w * 0.55,
      this.h * 0.3,
      0,
      this.w * 0.55,
      this.h * 0.3,
      Math.max(this.w, this.h)
    );
    g.addColorStop(0, "rgba(255,79,216,0.08)");
    g.addColorStop(0.45, "rgba(138,91,255,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = this.w + 20;
      if (p.x > this.w + 20) p.x = -20;
      if (p.y < -20) p.y = this.h + 20;
      if (p.y > this.h + 20) p.y = -20;

      const tw = 0.6 + 0.4 * Math.sin(this.t * (0.8 + p.tw) + p.phase);
      const alpha = p.a * tw;

      const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 10);
      gg.addColorStop(0, `hsla(${p.hue}, 100%, 85%, ${alpha})`);
      gg.addColorStop(1, `hsla(${p.hue}, 100%, 60%, 0)`);
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function heartEquation(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y };
}

export class FireHeartFX {
  constructor(canvas, cakeSrc) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.w = 900;
    this.h = 900;
    this.scale = 16.5;
    this.center = { x: this.w / 2, y: this.h / 2 + 16 };
    this.targets = [];
    this.particles = [];
    this.phase = "gather";
    this.reveal = 0;
    this.burn = 0;

    this.cake = new Image();
    this.cakeReady = false;
    this.cake.onload = () => (this.cakeReady = true);
    this.cake.onerror = () => (this.cakeReady = false);
    this.cake.src = cakeSrc;

    this.buildTargets();
    this.resetParticles();
  }

  buildTargets() {
    const pts = [];
    for (let i = 0; i < 920; i++) {
      const t = (i / 920) * Math.PI * 2;
      const { x, y } = heartEquation(t);
      pts.push({ x: this.center.x + x * this.scale, y: this.center.y - y * this.scale });
    }
    for (let i = 0; i < 1100; i++) {
      const t = Math.random() * Math.PI * 2;
      const { x, y } = heartEquation(t);
      const r = Math.pow(Math.random(), 0.7) * 0.78 + 0.22;
      pts.push({ x: this.center.x + x * this.scale * r, y: this.center.y - y * this.scale * r });
    }
    this.targets = pts;
  }

  resetParticles() {
    const randEdge = () => {
      const side = (Math.random() * 4) | 0;
      if (side === 0) return { x: Math.random() * this.w, y: -20 };
      if (side === 1) return { x: this.w + 20, y: Math.random() * this.h };
      if (side === 2) return { x: Math.random() * this.w, y: this.h + 20 };
      return { x: -20, y: Math.random() * this.h };
    };

    this.particles = this.targets.map((tgt, i) => {
      const sp = randEdge();
      return {
        id: i,
        x: sp.x,
        y: sp.y,
        tx: tgt.x,
        ty: tgt.y,
        vx: 0,
        vy: 0,
        s: 0.9 + Math.random() * 1.5,
        heat: Math.random(),
        jitter: Math.random() * Math.PI * 2,
        arrived: false
      };
    });
  }

  setCanvasSizeFromCSS() {
    const rect = this.c.getBoundingClientRect();
    const cssSize = Math.min(rect.width, rect.height);
    const px = Math.floor(cssSize * this.dpr);
    if (this.c.width !== px || this.c.height !== px) {
      this.c.width = px;
      this.c.height = px;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.w = Math.floor(cssSize);
      this.h = Math.floor(cssSize);
      this.center = { x: this.w / 2, y: this.h / 2 + 8 };
      this.scale = Math.min(this.w, this.h) / 34;
      this.buildTargets();
      this.resetParticles();
    }
  }

  step(dt) {
    this.setCanvasSizeFromCSS();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    const bg = ctx.createRadialGradient(this.w / 2, this.h / 2, 0, this.w / 2, this.h / 2, this.w * 0.7);
    bg.addColorStop(0, "rgba(255,79,216,0.08)");
    bg.addColorStop(0.55, "rgba(138,91,255,0.06)");
    bg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.w, this.h);

    let arrivedCount = 0;
    const spring = 0.01;
    const damp = 0.86;

    for (const p of this.particles) {
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      p.vx += dx * spring;
      p.vy += dy * spring;
      p.vx *= damp;
      p.vy *= damp;
      p.x += p.vx * (dt * 60);
      p.y += p.vy * (dt * 60);
      const dist = Math.hypot(dx, dy);
      if (dist < 1.6) {
        p.arrived = true;
        arrivedCount++;
      } else {
        p.arrived = false;
      }
    }

    const progress = arrivedCount / this.particles.length;
    if (this.phase === "gather" && progress > 0.94) this.phase = "burn";
    if (this.phase === "burn") {
      this.burn = Math.min(1, this.burn + dt * 0.35);
      if (this.burn >= 1) this.phase = "reveal";
    }
    if (this.phase === "reveal") this.reveal = Math.min(1, this.reveal + dt * 0.22);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const t = performance.now() * 0.001;
    for (const p of this.particles) {
      const flick = 0.55 + 0.45 * Math.sin(t * 7.5 + p.jitter);
      const a = (p.arrived ? 0.6 : 0.36) * flick * (0.55 + 0.45 * this.burn);
      const r = p.s * (p.arrived ? 1.25 : 1.0);
      const hue = 18 + 26 * (0.5 + 0.5 * Math.sin(t * 1.3 + p.heat * 6));
      const core = `hsla(${hue}, 100%, 70%, ${a})`;
      const edge = `hsla(${hue}, 100%, 55%, 0)`;
      const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 10);
      gg.addColorStop(0, core);
      gg.addColorStop(1, edge);
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Outline glow
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(255,79,216,${0.15 + 0.25 * this.burn})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255,79,216,0.25)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let i = 0; i < 560; i++) {
      const tt = (i / 560) * Math.PI * 2;
      const { x, y } = heartEquation(tt);
      const px = this.center.x + x * this.scale * 1.02;
      const py = this.center.y - y * this.scale * 1.02;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Reveal cake inside heart
    if (this.reveal > 0 && this.cakeReady) {
      ctx.save();
      ctx.globalAlpha = this.reveal;

      ctx.beginPath();
      for (let i = 0; i < 560; i++) {
        const tt = (i / 560) * Math.PI * 2;
        const { x, y } = heartEquation(tt);
        const px = this.center.x + x * this.scale * 0.98;
        const py = this.center.y - y * this.scale * 0.98;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();

      const pad = this.w * 0.08;
      const box = { x: pad, y: pad, w: this.w - pad * 2, h: this.h - pad * 2 };
      const iw = this.cake.naturalWidth || 1;
      const ih = this.cake.naturalHeight || 1;
      const s = Math.max(box.w / iw, box.h / ih);
      const dw = iw * s;
      const dh = ih * s;
      const dx = box.x + (box.w - dw) / 2;
      const dy = box.y + (box.h - dh) / 2;
      ctx.drawImage(this.cake, dx, dy, dw, dh);

      const tint = ctx.createRadialGradient(this.w / 2, this.h / 2, 0, this.w / 2, this.h / 2, this.w * 0.65);
      tint.addColorStop(0, "rgba(255,79,216,0.10)");
      tint.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, this.w, this.h);

      ctx.restore();
    }
  }
}

