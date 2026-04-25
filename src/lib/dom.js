export function startHearts(container, opts = {}) {
  const {
    minMs = 220,
    maxMs = 520,
    sizeMin = 14,
    sizeMax = 28,
    durationMin = 5200,
    durationMax = 8200,
    soft = false
  } = opts;

  let stop = false;
  const symbols = soft ? ["❤", "♡", "❥"] : ["❤️", "💗", "💖", "💘"];

  const spawn = () => {
    if (stop) return;
    const el = document.createElement("div");
    el.className = "heartFloat";
    el.textContent = symbols[(Math.random() * symbols.length) | 0];

    const left = Math.random() * 100;
    const size = sizeMin + Math.random() * (sizeMax - sizeMin);
    const duration = durationMin + Math.random() * (durationMax - durationMin);
    const drift = (-60 + Math.random() * 120).toFixed(1);
    el.style.left = `${left}%`;
    el.style.fontSize = `${size}px`;
    el.style.animationDuration = `${duration}ms`;
    el.style.setProperty("--drift", `${drift}px`);

    container.appendChild(el);
    setTimeout(() => el.remove(), duration + 200);

    const next = minMs + Math.random() * (maxMs - minMs);
    setTimeout(spawn, next);
  };

  spawn();
  return () => {
    stop = true;
  };
}

export function rafLoop(loop) {
  let raf = 0;
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    loop(dt);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

