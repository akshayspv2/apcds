// Dependency-free canvas heatmap (replaces Plotly so the PWA works offline).
(function () {
  const STOPS = [
    [0.0, [22, 163, 74]],   // green
    [0.5, [250, 204, 21]],  // yellow
    [1.0, [220, 38, 38]],   // red
  ];

  function colorAt(v) {
    v = Math.max(0, Math.min(1, v));
    for (let i = 1; i < STOPS.length; i++) {
      if (v <= STOPS[i][0]) {
        const [p0, c0] = STOPS[i - 1];
        const [p1, c1] = STOPS[i];
        const t = (v - p0) / (p1 - p0);
        return c0.map((c, k) => Math.round(c + (c1[k] - c) * t));
      }
    }
    return STOPS[STOPS.length - 1][1];
  }

  function interpolateGrid(oldGrid, newGrid, alpha) {
    return newGrid.map((row, i) =>
      row.map((val, j) => {
        const old = oldGrid && oldGrid[i] ? oldGrid[i][j] : 0;
        return old * (1 - alpha) + val * alpha;
      })
    );
  }

  function drawArrow(ctx, x0, y0, x1, y1) {
    ctx.strokeStyle = "#38bdf8";
    ctx.fillStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    const a = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 14 * Math.cos(a - 0.4), y1 - 14 * Math.sin(a - 0.4));
    ctx.lineTo(x1 - 14 * Math.cos(a + 0.4), y1 - 14 * Math.sin(a + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  function drawHeatmap(canvas, grid, trajectory) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    if (!grid || !grid.length) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No heatmap data", W / 2, H / 2);
      return;
    }

    const rows = grid.length, cols = grid[0].length;
    const cw = W / cols, ch = H / rows;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const [r, g, b] = colorAt(grid[i][j]);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(j * cw, i * ch, cw + 0.5, ch + 0.5);
      }
    }

    // Trajectory arrow, starting at the centre of the grid (same convention as the original).
    if (trajectory && (trajectory.dx || trajectory.dy)) {
      const cx = W / 2, cy = H / 2;
      drawArrow(ctx, cx, cy, cx + trajectory.dx * cw, cy + trajectory.dy * ch);
    }
  }

  window.Heatmap = { interpolateGrid, drawHeatmap };
})();
