(function () {
  const POLL_MS = 3000;
  const $ = (id) => document.getElementById(id);

  // ---------- settings ----------
  const DEFAULTS = {
    mode: "demo",
    apiUrl: "http://127.0.0.1:8000",
    videoUrl: "http://127.0.0.1:5002/core/video_feed",
  };

  function loadSettings() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("apcds-settings") || "{}") }; }
    catch { return { ...DEFAULTS }; }
  }
  function saveSettings(s) {
    try { localStorage.setItem("apcds-settings", JSON.stringify(s)); } catch {}
  }

  let settings = loadSettings();
  let lastGrid = null;
  let timer = null;

  // ---------- rendering ----------
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v, d = 0) => (typeof v === "number" && isFinite(v) ? v : d);
  const riskClass = (r) => (r === "HIGH" ? "risk-high" : r === "MEDIUM" ? "risk-medium" : "risk-low");

  function render(data) {
    const vision = data.vision || {};
    const rf = data.rf || {};
    const risk = data.risk || {};

    $("stats").innerHTML = `
      <h3>Crowd Analytics</h3>
      <h4>Vision (Camera)</h4>
      <p>People: <b>${num(vision.count)}</b></p>
      <p>Growth: ${num(vision.growth)}/s</p>
      <h4>RF (ESP32)</h4>
      <p>Devices: <b>${num(rf.count)}</b></p>
      <p>Growth: ${num(rf.growth)}/s</p>`;

    $("prediction").innerHTML = `
      <h3>Prediction</h3>
      <p>Future (30s): <b>${num(data.future)}</b></p>
      <p>Flow Speed: <b>${num(data.flow_speed)}</b></p>
      <p>Stampede Prob: <b>${(num(data.stampede_probability) * 100).toFixed(1)}%</b></p>`;

    const overall = risk.overall || "LOW";
    const banner = $("riskBanner");
    banner.className = riskClass(overall);
    banner.textContent = `${overall} RISK`;

    $("modalities").innerHTML = `
      <h3>Modality Risk</h3>
      <div class="chips">
        <span class="chip ${riskClass(risk.vision)}">Vision: ${esc(risk.vision || "LOW")}</span>
        <span class="chip ${riskClass(risk.audio)}">Audio: ${esc(risk.audio || "LOW")}</span>
        <span class="chip ${riskClass(overall)}">Overall: ${esc(overall)}</span>
      </div>`;

    if (Array.isArray(data.heatmap) && data.heatmap.length) {
      const smooth = Heatmap.interpolateGrid(lastGrid, data.heatmap, 0.6);
      lastGrid = smooth;
      Heatmap.drawHeatmap($("heatmap"), smooth, data.trajectory);
    } else {
      Heatmap.drawHeatmap($("heatmap"), null);
    }
  }

  function setStatus(kind, text) {
    const el = $("status");
    el.className = "pill pill-" + kind;
    el.textContent = text;
  }

  // ---------- data ----------
  async function tick() {
    if (settings.mode === "demo") {
      render(Demo.next());
      setStatus("demo", "Demo data");
      return;
    }
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 2500);
      const base = settings.apiUrl.replace(/\/+$/, "");
      const res = await fetch(base + "/api/dashboard", { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(to);
      if (!res.ok) throw new Error("HTTP " + res.status);
      render(await res.json());
      setStatus("on", "Live");
    } catch (e) {
      setStatus("off", "Backend unreachable");
    }
  }

  function applyMode() {
    const live = settings.mode === "live";
    const img = $("videoFeed");
    if (live && settings.videoUrl) {
      img.src = settings.videoUrl;
      img.hidden = false;
      $("demoFeed").hidden = true;
    } else {
      img.removeAttribute("src");
      img.hidden = true;
      $("demoFeed").hidden = false;
    }
    lastGrid = null;
    clearInterval(timer);
    tick();
    timer = setInterval(tick, POLL_MS);
  }

  $("videoFeed").addEventListener("error", () => {
    if (settings.mode === "live") { $("videoFeed").hidden = true; $("demoFeed").hidden = false; }
  });

  // animate the fake camera feed
  setInterval(() => { if (!$("demoFeed").hidden) Demo.drawFeed($("demoFeed")); }, 60);

  // ---------- settings dialog ----------
  const dlg = $("settingsDialog");
  $("settingsBtn").addEventListener("click", () => {
    $("modeSelect").value = settings.mode;
    $("apiUrl").value = settings.apiUrl;
    $("videoUrl").value = settings.videoUrl;
    dlg.showModal();
  });
  dlg.addEventListener("close", () => {
    if (dlg.returnValue !== "save") return;
    settings = {
      mode: $("modeSelect").value,
      apiUrl: $("apiUrl").value.trim() || DEFAULTS.apiUrl,
      videoUrl: $("videoUrl").value.trim() || DEFAULTS.videoUrl,
    };
    saveSettings(settings);
    applyMode();
  });

  applyMode();
})();
