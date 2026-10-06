import { API } from "./api.js";
import { Storage, defaultSave } from "./storage.js";

const $ = (id) => document.getElementById(id);

const DIFFS = ["easy", "normal", "hard", "insane"];
const DIFF_LABELS = { easy: "Leicht", normal: "Normal", hard: "Schwer", insane: "Wahnsinn" };

let currentUser = null;
let currentSave = null;

// ------------------------------------------------------------------
// UI
// ------------------------------------------------------------------
function applyUser(user) {
  currentUser = user;
  if (!user) {
    $("user-info").textContent = "";
    $("auth-box").classList.remove("hidden");
    $("btn-logout").classList.add("hidden");
    return;
  }
  const roleTag = user.role && user.role !== "player" ? ` · ${user.role}` : "";
  const guestTag = user.is_guest ? " (Gast)" : "";
  $("user-info").textContent = `👤 ${user.name}${guestTag}${roleTag}`;
  $("auth-box").classList.add("hidden");
  $("btn-logout").classList.remove("hidden");
}

function applySave(save) {
  currentSave = save || defaultSave();
  $("diff-label").textContent = DIFF_LABELS[currentSave.difficulty] || "Normal";
}

function showView(name) {
  $("view-main").classList.toggle("hidden", name !== "main");
  $("view-leaderboard").classList.toggle("hidden", name !== "leaderboard");
}

// ------------------------------------------------------------------
// Boot
// ------------------------------------------------------------------
async function boot() {
  const { user, save } = await API.bootstrap();
  applyUser(user);
  applySave(save);
}

// ------------------------------------------------------------------
// Auth
// ------------------------------------------------------------------
$("btn-guest").addEventListener("click", async () => {
  const name = $("guest-name").value.trim();
  if (name.length < 2) return alert("Name zu kurz (min. 2 Zeichen)");
  try {
    const data = await API.createGuest(name);
    applyUser({ ...data.user, is_guest: true });
    applySave(defaultSave());
  } catch (e) {
    alert("Fehler: " + e.message);
  }
});

$("btn-register").addEventListener("click", async () => {
  const email = $("email").value.trim();
  const password = $("password").value;
  const name = $("reg-name").value.trim();
  if (!email || password.length < 6) return alert("E-Mail oder Passwort ungültig");
  try {
    const user = await API.register(email, password, name);
    applyUser(user);
    // Lokalen Save hochladen
    const local = Storage.getSave() || defaultSave();
    await API.pushSave(local);
    applySave(local);
  } catch (e) {
    alert("Fehler: " + e.message);
  }
});

$("btn-login").addEventListener("click", async () => {
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || !password) return alert("Bitte E-Mail und Passwort eingeben");
  try {
    const user = await API.login(email, password);
    applyUser(user);
    const remote = await API.pullSave();
    applySave(remote || defaultSave());
  } catch (e) {
    alert("Fehler: " + e.message);
  }
});

$("btn-logout").addEventListener("click", async () => {
  await API.logout();
  applyUser(null);
  applySave(defaultSave());
});

// ------------------------------------------------------------------
// Difficulty
// ------------------------------------------------------------------
$("btn-difficulty").addEventListener("click", async () => {
  const idx = DIFFS.indexOf(currentSave.difficulty);
  currentSave.difficulty = DIFFS[(idx + 1) % DIFFS.length];
  $("diff-label").textContent = DIFF_LABELS[currentSave.difficulty];
  Storage.setSave(currentSave);
  if (currentUser) {
    try { await API.pushSave(currentSave); } catch {}
  }
});

// ------------------------------------------------------------------
// Leaderboard
// ------------------------------------------------------------------
$("btn-leaderboard").addEventListener("click", async () => {
  try {
    const rows = await API.leaderboard();
    const list = $("leaderboard-list");
    list.innerHTML = rows.length
      ? rows.map((r, i) =>
          `<div class="row"><span>#${i + 1} ${escapeHtml(r.display_name)}</span><span>${r.score}</span></div>`
        ).join("")
      : "<div style='color:#888;padding:12px'>Noch keine Einträge.</div>";
    showView("leaderboard");
  } catch {
    alert("Leaderboard konnte nicht geladen werden.");
  }
});

$("btn-back-leaderboard").addEventListener("click", () => showView("main"));

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// ------------------------------------------------------------------
// Spiel starten (delegiert an game.js)
// ------------------------------------------------------------------
$("btn-play").addEventListener("click", () => {
  if (!currentUser) {
    alert("Bitte erst Gast-Account erstellen oder einloggen.");
    return;
  }
  $("menu").classList.add("hidden");
  $("hud").classList.remove("hidden");

  window.GengaGame.start({
    difficulty: currentSave.difficulty,
    onScore: (score, coins) => {
      $("hud-score").textContent = score;
      $("hud-coins").textContent = (currentSave.coins || 0) + coins;
    },
    onPause: () => {
      $("pause-overlay").classList.remove("hidden");
    },
    onEnd: async (result) => {
      $("hud").classList.add("hidden");
      $("gameover-overlay").classList.remove("hidden");
      $("go-score").textContent = result.score;
      $("go-coins").textContent = result.coins;

      // Fortschritt updaten
      currentSave.score = result.score;
      currentSave.coins = (currentSave.coins || 0) + result.coins;
      currentSave.best_score = Math.max(currentSave.best_score || 0, result.score);
      currentSave.updated_at = Math.floor(Date.now() / 1000);
      Storage.setSave(currentSave);
      $("go-best").textContent = currentSave.best_score;

      try { await API.pushSave(currentSave); } catch (e) { console.warn(e); }
    },
  });
});

$("btn-pause-hud").addEventListener("click", () => window.GengaGame.pause());

$("btn-resume").addEventListener("click", () => {
  $("pause-overlay").classList.add("hidden");
  window.GengaGame.resume();
});

$("btn-quit").addEventListener("click", () => {
  $("pause-overlay").classList.add("hidden");
  $("hud").classList.add("hidden");
  window.GengaGame.quit();
  $("menu").classList.remove("hidden");
});

$("btn-restart").addEventListener("click", () => {
  $("gameover-overlay").classList.add("hidden");
  $("hud").classList.remove("hidden");
  window.GengaGame.start({
    difficulty: currentSave.difficulty,
    onScore: (score, coins) => {
      $("hud-score").textContent = score;
      $("hud-coins").textContent = (currentSave.coins || 0) + coins;
    },
    onPause: () => $("pause-overlay").classList.remove("hidden"),
    onEnd: async (result) => {
      $("hud").classList.add("hidden");
      $("gameover-overlay").classList.remove("hidden");
      $("go-score").textContent = result.score;
      $("go-coins").textContent = result.coins;
      currentSave.score = result.score;
      currentSave.coins = (currentSave.coins || 0) + result.coins;
      currentSave.best_score = Math.max(currentSave.best_score || 0, result.score);
      currentSave.updated_at = Math.floor(Date.now() / 1000);
      Storage.setSave(currentSave);
      $("go-best").textContent = currentSave.best_score;
      try { await API.pushSave(currentSave); } catch (e) { console.warn(e); }
    },
  });
});

$("btn-menu").addEventListener("click", () => {
  $("gameover-overlay").classList.add("hidden");
  $("menu").classList.remove("hidden");
});

// ------------------------------------------------------------------
// Start
// ------------------------------------------------------------------
boot();

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch(() => {});
}
