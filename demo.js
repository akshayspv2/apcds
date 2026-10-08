// Simulated data so the deployed site is useful without any hardware/backend.
(function () {
  let t = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const levelOf = (p) => (p > 0.75 ? "HIGH" : p > 0.45 ? "MEDIUM" : "LOW");

  // Pseudo-random walkers for the fake camera view
  const walkers = Array.from({ length: 28 }, () => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.004, vy: (Math.random() - 0.5) * 0.004,
  }));

  function next() {
    t += 1;
    // Slow oscillation with a periodic surge so all risk levels get exercised
    const base = 0.5 + 0.5 * Math.sin(t / 25);
    const surge = Math.max(0, Math.sin(t / 60)) ** 3;
    const intensity = clamp(0.25 * base + 0.75 * surge, 0, 1);

    const grid = Array.from({ length: 5 }, (_, i) =>
      Array.from({ length: 5 }, (_, j) => {
        const d = Math.hypot(i - 2, j - 2) / 3;
        const noise = (Math.random() - 0.5) * 0.08;
        return +clamp((1 - d) * intensity * 1.2 + noise, 0, 1).toFixed(2);
      })
    );

    const vision = Math.round(8 + intensity * 70);
    const rf = Math.round(vision * (0.55 + Math.random() * 0.1));
    const growth = +((Math.cos(t / 25) * 0.4) + (surge * 1.2)).toFixed(2);
    const flow = +(8 + intensity * 40 + Math.random() * 3).toFixed(1);
    const stampede = +clamp(0.1 + intensity * 0.8 + (Math.random() - 0.5) * 0.05, 0, 1).toFixed(2);
    const audio = +clamp(intensity + (Math.random() - 0.5) * 0.2, 0, 1);

    return {
      vision: { count: vision, growth },
      rf: { count: rf, growth },
      future: +(vision + growth * 30).toFixed(1),
      flow_speed: flow,
      stampede_probability: stampede,
      heatmap: grid,
      trajectory: { dx: +(Math.sin(t / 15) * 1.5).toFixed(2), dy: +(Math.cos(t / 20) * 1.5).toFixed(2) },
      risk: { overall: levelOf(Math.max(stampede, audio * 0.9)), vision: levelOf(intensity), audio: levelOf(audio) },
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  function drawFeed(canvas) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,163,184,.12)";
    for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.fillStyle = "#4ade80";
    walkers.forEach((w) => {
      w.x += w.vx; w.y += w.vy;
      if (w.x < 0 || w.x > 1) w.vx *= -1;
      if (w.y < 0 || w.y > 1) w.vy *= -1;
      ctx.beginPath();
      ctx.arc(w.x * W, w.y * H, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("DEMO FEED (simulated)", 14, 24);
  }

  window.Demo = { next, drawFeed };
})();
