import { signin, saveToken, getToken, logout } from "./auth.js";
import { graphql } from "./api.js";
import { Q_ME, Q_DASHBOARD } from "./queries.js";
import { renderXpAreaChart, renderTopProjectsBarChart } from "./charts.js";

const loginView = document.getElementById("loginView");
const profileView = document.getElementById("profileView");
const logoutBtn = document.getElementById("logoutBtn");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const identifierInput = document.getElementById("identifier");
const passwordInput = document.getElementById("password");

const pLogin = document.getElementById("pLogin");
const pId = document.getElementById("pId");
const xpTotal = document.getElementById("xpTotal");

const audUp = document.getElementById("audUp");
const audDown = document.getElementById("audDown");
const audRatio = document.getElementById("audRatio");

const pfPass = document.getElementById("pfPass");
const pfFail = document.getElementById("pfFail");

const xpChart = document.getElementById("xpChart");
const topChart = document.getElementById("topChart");

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

function simplifyPath(path) {
  const parts = (path || "").split("/").filter(Boolean);
  return parts[parts.length - 1] || path || "unknown";
}

function buildXpPoints(transactions) {
  const xpTx = transactions
    .filter(t => t.type === "xp" && typeof t.amount === "number" && t.createdAt)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  let cum = 0;
  return xpTx.map(t => {
    cum += t.amount;
    return { x: new Date(t.createdAt), y: cum };
  });
}

function buildTopProjectRows(transactions) {
  const xpTx = transactions.filter(t => t.type === "xp" && typeof t.amount === "number");

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

    pLogin.textContent = me.login;
    pId.textContent = me.id;

    // Nested + variables query (required)
    const dashData = await graphql(Q_DASHBOARD, { uid: me.id });

    const transactions = dashData.transaction || [];
    const progress = dashData.progress || [];

    // Total XP
    const totalXp = transactions
      .filter(t => t.type === "xp")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    xpTotal.textContent = `Total XP: ${Math.round(totalXp)}`;

    // Audit ratio (up/down may vary by schema, but this works if present)
    const up = transactions.filter(t => t.type === "up").reduce((s, t) => s + (t.amount || 0), 0);
    const down = transactions.filter(t => t.type === "down").reduce((s, t) => s + (t.amount || 0), 0);

    audUp.textContent = Math.round(up);
    audDown.textContent = Math.round(down);
    audRatio.textContent = down === 0 ? "∞" : (up / down).toFixed(2);

    // Pass / Fail from progress grades
    pfPass.textContent = progress.filter(p => p.grade === 1).length;
    pfFail.textContent = progress.filter(p => p.grade === 0).length;

    // SVG charts
    const points = buildXpPoints(transactions);
    const topRows = buildTopProjectRows(transactions);

    renderXpAreaChart(xpChart, points);
    renderTopProjectsBarChart(topChart, topRows);

  } catch (err) {
    logout();
    location.hash = "#login";
    setView("login");
    loginError.textContent = err.message || "Failed to load dashboard.";
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