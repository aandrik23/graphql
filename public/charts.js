const NS = "http://www.w3.org/2000/svg";

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// Area/line chart for cumulative XP over time
export function renderXpAreaChart(svg, points) {
  const W = 800, H = 260, P = 32;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";

  if (!points || points.length < 2) return;

  const xs = points.map(p => p.x.getTime());
  const ys = points.map(p => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;
  const maxY = Math.max(...ys) || 1;

  const sx = (t) => P + ((t - minX) / (maxX - minX || 1)) * (W - 2 * P);
  const sy = (v) => (H - P) - ((v - minY) / (maxY - minY || 1)) * (H - 2 * P);

  svg.appendChild(el("path", {
    d: `M ${P} ${P} V ${H - P} H ${W - P}`,
    fill: "none",
    stroke: "currentColor",
    "stroke-opacity": "0.25",
  }));

  const dLine = points.map((p, i) => {
    const X = sx(p.x.getTime());
    const Y = sy(p.y);
    return `${i ? "L" : "M"} ${X.toFixed(2)} ${Y.toFixed(2)}`;
  }).join(" ");

  const baseY = sy(0);
  const firstX = sx(points[0].x.getTime());
  const lastX = sx(points[points.length - 1].x.getTime());
  const dArea = `${dLine} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`;

  svg.appendChild(el("path", {
    d: dArea,
    fill: "currentColor",
    "fill-opacity": "0.12",
    stroke: "none",
  }));

  svg.appendChild(el("path", {
    d: dLine,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
  }));

  const last = points[points.length - 1];
  svg.appendChild(el("circle", {
    cx: sx(last.x.getTime()),
    cy: sy(last.y),
    r: 4,
    fill: "currentColor",
  }));
}

// Horizontal bars chart for top projects XP
export function renderTopProjectsBarChart(svg, rows) {
  const W = 800, H = 320, P = 24;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";

  if (!rows || rows.length === 0) return;

  const top = 24;
  const left = 240;
  const barH = 22;
  const gap = 10;

  const max = Math.max(...rows.map(r => r.value)) || 1;
  const list = rows.slice(0, 10);

  list.forEach((r, i) => {
    const y = top + i * (barH + gap);
    const value = Math.max(0, r.value || 0);
    const w = (W - left - P) * (value / max);

    svg.appendChild(el("text", {
      x: P,
      y: y + barH * 0.75,
      "font-size": 12,
      fill: "currentColor",
      "fill-opacity": "0.85",
    })).textContent = r.label;

    svg.appendChild(el("rect", {
      x: left,
      y,
      width: clamp(w, 0, W - left - P),
      height: barH,
      rx: 6,
      fill: "currentColor",
      "fill-opacity": "0.35",
    }));

    svg.appendChild(el("text", {
      x: left + clamp(w, 0, W - left - P) + 8,
      y: y + barH * 0.75,
      "font-size": 12,
      fill: "currentColor",
      "fill-opacity": "0.85",
    })).textContent = Math.round(value).toString();
  });
}