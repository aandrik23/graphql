// public/app.js

import { signin, saveToken, getToken, logout } from "./auth.js";
import { graphql } from "./api.js";
import { Q_ME, Q_DASHBOARD } from "./queries.js";
import {
  renderXpAreaChart,
  renderTopProjectsBarChart,
  renderPassFailDonut,
  renderAuditCompare,
} from "./charts.js";

const loginView = document.getElementById("loginView");
const profileView = document.getElementById("profileView");
const logoutBtn = document.getElementById("logoutBtn");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const identifierInput = document.getElementById("identifier");
const passwordInput = document.getElementById("password");

// Hero
const avatarInitials = document.getElementById("avatarInitials");
const fullName = document.getElementById("fullName");
const pLogin = document.getElementById("pLogin");
const pId = document.getElementById("pId");
const xpTotal = document.getElementById("xpTotal");

// Small cards
const xpBig = document.getElementById("xpBig");
const xpMeta = document.getElementById("xpMeta");

const auditBig = document.getElementById("auditBig");
const audUp = document.getElementById("audUp");
const audDown = document.getElementById("audDown");
const audRatio = document.getElementById("audRatio"); // may exist in older HTML, safe to keep

const pfBig = document.getElementById("pfBig");
const pfPass = document.getElementById("pfPass");
const pfFail = document.getElementById("pfFail");

// Charts
const xpChart = document.getElementById("xpChart");
const topChart = document.getElementById("topChart");
const pfChart = document.getElementById("pfChart");
const auditChart = document.getElementById("auditChart");

function setView(view) {
  const showProfile = view === "profile";
  loginView.hidden = showProfile;
  profileView.hidden = !showProfile;
  logoutBtn.hidden = !showProfile;
}

function renderRoute() {
  const hash = location.hash || "#login";
  const token = getToken();

  if (hash === "#profile") {
    if (!token) {
      location.hash = "#login";
      setView("login");
      return;
    }
    setView("profile");
    renderProfile();
    return;
  }

  setView("login");
}

function fmtShort(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}

function makeInitials(login) {
  const s = (login || "").trim();
  if (!s) return "U";
  if (s.includes(" ")) {
    const parts = s.split(/\s+/).filter(Boolean);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  return (s[0] + (s[1] || "")).toUpperCase();
}

function simplifyPath(path) {
  const parts = (path || "").split("/").filter(Boolean);
  return parts[parts.length - 1] || path || "unknown";
}

function buildXpPoints(transactions) {
  const xpTx = transactions
    .filter((t) => t.type === "xp" && typeof t.amount === "number" && t.createdAt)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  let cum = 0;
  return xpTx.map((t) => {
    cum += t.amount;
    return { x: new Date(t.createdAt), y: cum };
  });
}

function buildTopProjectRows(transactions) {
  const xpTx = transactions.filter((t) => t.type === "xp" && typeof t.amount === "number");

  const map = new Map();
  for (const t of xpTx) {
    const key = t.path || "unknown";
    map.set(key, (map.get(key) || 0) + t.amount);
  }

  return [...map.entries()]
    .map(([path, value]) => ({ label: simplifyPath(path), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

async function renderProfile() {
  try {
    // Normal query (required)
    const meData = await graphql(Q_ME);
    const me = meData.user?.[0];
    if (!me) throw new Error("User not found.");

    // Hero info
    pLogin.textContent = me.login;
    pId.textContent = me.id;
    fullName.textContent = me.login;
    avatarInitials.textContent = makeInitials(me.login);

    // Nested + variables query (required)
    const dashData = await graphql(Q_DASHBOARD, { uid: me.id });
    const transactions = dashData.transaction || [];
    const progress = dashData.progress || [];

    // XP totals
    const xpTx = transactions.filter((t) => t.type === "xp");
    const totalXp = xpTx.reduce((sum, t) => sum + (t.amount || 0), 0);

    xpTotal.textContent = fmtShort(totalXp);
    xpBig.textContent = fmtShort(totalXp);
    xpMeta.textContent = `${xpTx.length} XP transactions`;

    // Audit totals
    const up = transactions.filter((t) => t.type === "up").reduce((s, t) => s + (t.amount || 0), 0);
    const down = transactions.filter((t) => t.type === "down").reduce((s, t) => s + (t.amount || 0), 0);
    const ratio = down === 0 ? Infinity : up / down;

    audUp.textContent = fmtShort(up);
    audDown.textContent = fmtShort(down);
    if (audRatio) audRatio.textContent = ratio === Infinity ? "∞" : ratio.toFixed(2);
    auditBig.textContent = ratio === Infinity ? "∞" : ratio.toFixed(2);

    // Pass/Fail meaning: progress table grades
    const passCount = progress.filter((p) => p.grade === 1).length;
    const failCount = progress.filter((p) => p.grade === 0).length;
    const totalAttempts = passCount + failCount;
    const passRate = totalAttempts ? (passCount / totalAttempts) * 100 : 0;

    pfPass.textContent = passCount.toString();
    pfFail.textContent = failCount.toString();
    pfBig.textContent = totalAttempts ? `${Math.round(passRate)}%` : "—";

    // Charts
    renderXpAreaChart(xpChart, buildXpPoints(transactions));
    renderTopProjectsBarChart(topChart, buildTopProjectRows(transactions));
    renderPassFailDonut(pfChart, passCount, failCount);
    renderAuditCompare(auditChart, up, down);

  } catch (err) {
    logout();
    location.hash = "#login";
    setView("login");
    loginError.textContent = err.message || "Failed to load profile.";
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  try {
    const token = await signin(identifierInput.value.trim(), passwordInput.value);
    saveToken(token);
    location.hash = "#profile";
    renderRoute();
  } catch (err) {
    loginError.textContent = err.message;
  }
});

logoutBtn.addEventListener("click", () => {
  logout();
  passwordInput.value = "";
  loginError.textContent = "";
  location.hash = "#login";
  renderRoute();
});

window.addEventListener("hashchange", renderRoute);
renderRoute();