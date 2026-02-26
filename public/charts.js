//for browser to understand this is svg elent and not html
const NS = "http://www.w3.org/2000/svg";

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

// fix the size
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function fmtNumber(n) {
  const x = Math.round(Number(n) || 0);
  return x.toString();
}

// formats large numbers with suffixes (e.g. 1.5k, 2.3M)
function fmtShort(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}

function clearSvg(svg, W, H) {
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";
}

/* ===== Chart 1: XP over time (area + line) ===== */
export function renderXpAreaChart(svg, points) {
  const W = 800, H = 260, P = 48;
  clearSvg(svg, W, H);

  if (!points || points.length < 2) return;

  const xs = points.map(p => p.x.getTime());
  const ys = points.map(p => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;
  const maxY = Math.max(...ys) || 1;

  const sx = (t) => P + ((t - minX) / (maxX - minX || 1)) * (W - 2 * P);
  const sy = (v) => (H - P) - ((v - minY) / (maxY - minY || 1)) * (H - 2 * P);

  // Draw axes
  svg.appendChild(el("path", {
    d: `M ${P} ${P} V ${H - P} H ${W - P}`,
    fill: "none",
    stroke: "rgba(255,255,255,0.3)"
  }));

  // Y axis ticks
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const value = (maxY / steps) * i;
    const y = sy(value);

    svg.appendChild(el("line", {
      x1: P,
      y1: y,
      x2: W - P,
      y2: y,
      stroke: "rgba(255,255,255,0.08)"
    }));

    svg.appendChild(el("text", {
      x: P - 10,
      y: y + 4,
      "text-anchor": "end",
      "font-size": 11,
      fill: "rgba(255,255,255,0.7)"
    })).textContent = fmtShort(value);
  }

  // X axis labels (monthly)
  const labelCount = 6;
  for (let i = 0; i <= labelCount; i++) {
    const ratio = i / labelCount;
    const time = minX + ratio * (maxX - minX);
    const x = sx(time);
    const date = new Date(time);

    svg.appendChild(el("text", {
      x,
      y: H - 14,
      "text-anchor": "middle",
      "font-size": 11,
      fill: "rgba(255,255,255,0.7)"
    })).textContent =
      date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }

  // Build line
  const dLine = points.map((p, i) => {
    const X = sx(p.x.getTime());
    const Y = sy(p.y);
    return `${i ? "L" : "M"} ${X.toFixed(2)} ${Y.toFixed(2)}`;
  }).join(" ");

  const baseY = sy(0);
  const firstX = sx(points[0].x.getTime());
  const lastX = sx(points[points.length - 1].x.getTime());

  const dArea = `${dLine} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

  svg.appendChild(el("path", {
    d: dArea,
    fill: "rgba(147,197,253,0.15)"
  }));

  svg.appendChild(el("path", {
    d: dLine,
    fill: "none",
    stroke: "#93C5FD",
    "stroke-width": 2
  }));
}

/* ===== Chart 2: Top projects XP (horizontal bars) ===== */
export function renderTopProjectsBarChart(svg, rows) {
  const W = 800, P = 24;
  svg.innerHTML = "";

  if (!rows || rows.length === 0) {
    svg.setAttribute("viewBox", `0 0 ${W} 260`);
    svg.style.height = "260px";
    return;
  }

  const left = 240;
  const barH = 22;
  const gap = 10;
  const top = 24;

  const list = rows.slice(0, 10); // top 10
  const H = top + list.length * (barH + gap) + 14;

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.height = `${H}px`; // IMPORTANT: make SVG taller so wrapper can scroll

  const max = Math.max(...list.map(r => r.value)) || 1;

  // Gradient for bars
  const defs = el("defs");
  const grad = el("linearGradient", { id: "barGrad", x1: "0", y1: "0", x2: "1", y2: "0" });
  grad.appendChild(el("stop", { offset: "0%", "stop-color": "#A78BFA", "stop-opacity": "0.90" }));
  grad.appendChild(el("stop", { offset: "100%", "stop-color": "#22D3EE", "stop-opacity": "0.85" }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  list.forEach((r, i) => {
    const y = top + i * (barH + gap);
    const value = Math.max(0, r.value || 0);
    const w = (W - left - P) * (value / max);

    // Label
    svg.appendChild(el("text", {
      x: P,
      y: y + barH * 0.75,
      "font-size": 12,
      fill: "rgba(255,255,255,0.85)",
    })).textContent = r.label;

    // Track
    svg.appendChild(el("rect", {
      x: left,
      y,
      width: W - left - P,
      height: barH,
      rx: 6,
      fill: "rgba(255,255,255,0.06)",
      stroke: "rgba(255,255,255,0.10)",
    }));

    // Bar
    svg.appendChild(el("rect", {
      x: left,
      y,
      width: clamp(w, 0, W - left - P),
      height: barH,
      rx: 6,
      fill: "url(#barGrad)",
      "fill-opacity": "0.85",
    }));

    // Value
    svg.appendChild(el("text", {
      x: left + clamp(w, 0, W - left - P) + 8,
      y: y + barH * 0.75,
      "font-size": 12,
      fill: "rgba(255,255,255,0.80)",
    })).textContent = fmtShort(value);
  });
}

/* ===== Chart 3: Pass/Fail donut =====
   - passCount: number of passes
   - failCount: number of fails
*/
export function renderPassFailDonut(svg, passCount, failCount) {
  const W = 520, H = 240;
  clearSvg(svg, W, H);

  const pass = Math.max(0, Number(passCount) || 0);
  const fail = Math.max(0, Number(failCount) || 0);
  const total = pass + fail;

  if (total <= 0) {
    svg.appendChild(el("text", {
      x: W / 2, y: H / 2, "text-anchor": "middle",
      "font-size": 14, fill: "rgba(255,255,255,0.70)"
    })).textContent = "No pass/fail data";
    return;
  }

  // Unique IDs per SVG instance (prevents ID collisions)
  const uid = `pf_${Math.random().toString(16).slice(2)}`;
  const PASS_ID = `${uid}_pass`;
  const FAIL_ID = `${uid}_fail`;
  const GLOW_ID = `${uid}_glow`;

  const cx = 150, cy = 120;
  const r = 64;
  const stroke = 18;
  const C = 2 * Math.PI * r;

  const passPct = pass / total;
  const passLen = C * passPct;
  const failLen = C - passLen;

  const defs = el("defs");

  const gPass = el("linearGradient", { id: PASS_ID, x1: "0", y1: "0", x2: "1", y2: "1" });
  gPass.appendChild(el("stop", { offset: "0%", "stop-color": "#22D3EE", "stop-opacity": "0.95" }));
  gPass.appendChild(el("stop", { offset: "100%", "stop-color": "#34D399", "stop-opacity": "0.95" }));

  const gFail = el("linearGradient", { id: FAIL_ID, x1: "0", y1: "1", x2: "1", y2: "0" });
  gFail.appendChild(el("stop", { offset: "0%", "stop-color": "#FB7185", "stop-opacity": "0.95" }));
  gFail.appendChild(el("stop", { offset: "100%", "stop-color": "#FBBF24", "stop-opacity": "0.95" }));

  const filter = el("filter", { id: GLOW_ID, x: "-50%", y: "-50%", width: "200%", height: "200%" });
  filter.appendChild(el("feGaussianBlur", { stdDeviation: "2.4", result: "blur" }));
  filter.appendChild(el("feColorMatrix", {
    in: "blur",
    type: "matrix",
    values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0",
    result: "glow"
  }));
  const merge = el("feMerge");
  merge.appendChild(el("feMergeNode", { in: "glow" }));
  merge.appendChild(el("feMergeNode", { in: "SourceGraphic" }));
  filter.appendChild(merge);

  defs.appendChild(gPass);
  defs.appendChild(gFail);
  defs.appendChild(filter);
  svg.appendChild(defs);

  // Base ring (grey)
  svg.appendChild(el("circle", {
    cx, cy, r,
    fill: "none",
    stroke: "rgba(255,255,255,0.10)",
    "stroke-width": stroke
  }));

  // PASS slice
  svg.appendChild(el("circle", {
    cx, cy, r,
    fill: "none",
    stroke: `url(#${PASS_ID})`,
    "stroke-width": stroke,
    "stroke-linecap": "round",
    "stroke-dasharray": `${passLen} ${C - passLen}`,
    "stroke-dashoffset": "0",
    transform: `rotate(-90 ${cx} ${cy})`,
    filter: `url(#${GLOW_ID})`
  }));

  // FAIL slice
  svg.appendChild(el("circle", {
    cx, cy, r,
    fill: "none",
    stroke: `url(#${FAIL_ID})`,
    "stroke-width": stroke,
    "stroke-linecap": "round",
    "stroke-dasharray": `${failLen} ${C - failLen}`,
    "stroke-dashoffset": `${-passLen}`,
    transform: `rotate(-90 ${cx} ${cy})`,
    filter: `url(#${GLOW_ID})`
  }));

  // Inner cutout
  svg.appendChild(el("circle", {
    cx, cy, r: r - stroke / 2 + 2,
    fill: "rgba(10,14,20,0.35)",
    stroke: "rgba(255,255,255,0.06)"
  }));

  // Center text
  const rate = passPct * 100;

  svg.appendChild(el("text", {
    x: cx, y: cy - 6,
    "text-anchor": "middle",
    "font-size": 26,
    "font-weight": 900,
    fill: "rgba(255,255,255,0.92)"
  })).textContent = `${Math.round(rate)}%`;

  svg.appendChild(el("text", {
    x: cx, y: cy + 16,
    "text-anchor": "middle",
    "font-size": 11,
    fill: "rgba(255,255,255,0.68)",
    "letter-spacing": "0.9"
  })).textContent = "PASS RATE";

  // Legend
  const lx = 285, ly = 88;

  function legendRow(y, label, value, fillRef) {
    svg.appendChild(el("rect", {
      x: lx, y: y - 10,
      width: 10, height: 10, rx: 3,
      fill: fillRef
    }));
    svg.appendChild(el("text", {
      x: lx + 16,
      y,
      "font-size": 12,
      fill: "rgba(255,255,255,0.86)"
    })).textContent = `${label}: ${fmtNumber(value)}`;
  }

  legendRow(ly, "Passed", pass, `url(#${PASS_ID})`);
  legendRow(ly + 26, "Failed", fail, `url(#${FAIL_ID})`);

  svg.appendChild(el("text", {
    x: lx + 16,
    y: ly + 56,
    "font-size": 12,
    fill: "rgba(255,255,255,0.70)"
  })).textContent = `Total: ${fmtNumber(total)}`;
}

/* ===== Chart 4: Audit done vs received =====
   - upAmount: audits done (up)
   - downAmount: audits received (down)
*/
export function renderAuditCompare(svg, upAmount, downAmount) {
  const W = 520, H = 240, P = 26;
  clearSvg(svg, W, H);

  const up = Math.max(0, Number(upAmount) || 0);
  const down = Math.max(0, Number(downAmount) || 0);
  const max = Math.max(up, down) || 1;

  const left = 150;         // space for labels
  const right = 74;         // reserved space for values (fix overlap)
  const trackW = W - left - P - right;

  const barH = 26;
  const gap = 24;

  // Gradients
  const defs = el("defs");

  const gUp = el("linearGradient", { id: "audUpG", x1: "0", y1: "0", x2: "1", y2: "0" });
  gUp.appendChild(el("stop", { offset: "0%", "stop-color": "#34D399", "stop-opacity": "0.95" }));
  gUp.appendChild(el("stop", { offset: "100%", "stop-color": "#22D3EE", "stop-opacity": "0.92" }));

  const gDown = el("linearGradient", { id: "audDownG", x1: "0", y1: "0", x2: "1", y2: "0" });
  gDown.appendChild(el("stop", { offset: "0%", "stop-color": "#A78BFA", "stop-opacity": "0.95" }));
  gDown.appendChild(el("stop", { offset: "100%", "stop-color": "#FBBF24", "stop-opacity": "0.90" }));

  defs.appendChild(gUp);
  defs.appendChild(gDown);
  svg.appendChild(defs);

  // Subtle vertical guides (makes it look more pro)
  for (let i = 1; i <= 4; i++) {
    const x = left + (trackW * i) / 4;
    svg.appendChild(el("line", {
      x1: x, y1: 58,
      x2: x, y2: H - 54,
      stroke: "rgba(255,255,255,0.06)"
    }));
  }

  function barRow(y, label, value, gradId) {
    const w = (trackW * value) / max;

    // Left label (right-aligned so it never touches the bar)
    svg.appendChild(el("text", {
      x: left - 14,
      y: y + barH * 0.72,
      "text-anchor": "end",
      "font-size": 12,
      fill: "rgba(255,255,255,0.78)"
    })).textContent = label;

    // Track
    svg.appendChild(el("rect", {
      x: left,
      y,
      width: trackW,
      height: barH,
      rx: 10,
      fill: "rgba(255,255,255,0.06)",
      stroke: "rgba(255,255,255,0.10)"
    }));

    // Bar
    svg.appendChild(el("rect", {
      x: left,
      y,
      width: clamp(w, 0, trackW),
      height: barH,
      rx: 10,
      fill: `url(#${gradId})`,
      "fill-opacity": "0.92"
    }));

    // Value (fixed column at right, no overlap)
    svg.appendChild(el("text", {
      x: W - P,
      y: y + barH * 0.72,
      "text-anchor": "end",
      "font-size": 12,
      fill: "rgba(255,255,255,0.80)"
    })).textContent = fmtShort(value);
  }

  const y1 = 78;
  const y2 = y1 + barH + gap;

  barRow(y1, "Done (up)", up, "audUpG");
  barRow(y2, "Received (down)", down, "audDownG");

  const ratio = down === 0 ? Infinity : up / down;

  // Ratio label (centered, clean)
  svg.appendChild(el("text", {
    x: (left + (W - P)) / 2,
    y: H - 26,
    "text-anchor": "middle",
    "font-size": 12,
    fill: "rgba(255,255,255,0.70)"
  })).textContent = `Ratio (up/down): ${ratio === Infinity ? "∞" : ratio.toFixed(2)}`;
}