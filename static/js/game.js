
let gameRunning = false;
let gamePaused = false;
let score = 0;
let runTime = 0;
let savedRunAvailable = false;

let startScreen, pauseScreen, gameOverScreen, shopScreen;
let startButton, resumeButton, pauseButton;
let scoreElement, finalScoreElement, bestScoreElement;

document.addEventListener("DOMContentLoaded", () => {
  const byId = id => document.getElementById(id);

  startScreen = byId("startScreen");
  pauseScreen = byId("pauseScreen");
  gameOverScreen = byId("gameOverScreen");
  shopScreen = byId("shopScreen");

  startButton = byId("startButton");
  resumeButton = byId("resumeButton");
  pauseButton = byId("pauseButton");

  scoreElement = byId("score");
  finalScoreElement = byId("finalScore");
  bestScoreElement = byId("bestScore");

  // Buttons werden direkt registriert.
  startButton.addEventListener("click", startGame);
  resumeButton.addEventListener("click", resumeSavedRun);
  pauseButton.addEventListener("click", togglePause);
  byId("resumeGameButton").addEventListener("click", resumeGame);
  byId("restartButton").addEventListener("click", startGame);

  byId("pauseMenuButton").addEventListener("click", goToMainMenu);
  byId("gameOverMenuButton").addEventListener("click", goToMainMenu);

  byId("openShopButton").addEventListener("click", () => openShop("start"));
  byId("pauseShopButton").addEventListener("click", () => openShop("pause"));
  byId("gameOverShopButton").addEventListener("click", () => openShop("gameover"));
  byId("closeShopButton").addEventListener("click", closeShop);

  // Event-Listener sind bereits gesetzt, bevor die 3D-Engine startet.
  try {
    if (typeof init3D === "function") init3D();
  } catch (error) {
    console.error("3D-Initialisierung fehlgeschlagen:", error);
  }

  updateCoinDisplays();
  updateBestScoreDisplay();
  checkSavedRun();
  hidePauseButton();
});

function startGame() {
  clearSavedRun();

  score = 0;
  runTime = 0;

  if (typeof prepareRunUpgrades === "function") {
    runModifiers = prepareRunUpgrades();
  } else {
    runModifiers = {
      scoreMultiplier: 1,
      extraLife: false,
      extraLifeUsed: false
    };
  }

  gameRunning = true;
  gamePaused = false;

  try {
    if (typeof reset3DRun === "function") reset3DRun();
  } catch (error) {
    console.error("Spiel konnte nicht zurückgesetzt werden:", error);
  }

  hideAllScreens();
  pauseButton.classList.remove("hidden");
  updateScoreDisplay();
  updateBestScoreDisplay();
}

function togglePause() {
  if (!gameRunning) return;
  if (gamePaused) resumeGame();
  else pauseGame();
}

function pauseGame() {
  if (!gameRunning || gamePaused) return;

  gamePaused = true;
  pauseScreen.classList.remove("hidden");
  pauseButton.classList.add("hidden");
  saveCurrentRun();
}

function resumeGame() {
  if (!gameRunning) return;

  gamePaused = false;
  pauseScreen.classList.add("hidden");
  pauseButton.classList.remove("hidden");
}

function updateGame(delta) {
  if (!gameRunning || gamePaused) return;

  runTime += delta;
  score += delta * (runModifiers?.scoreMultiplier || 1);
  updateScoreDisplay();
}

function getCurrentGameSpeed() {
  return Math.min(29, 12 + runTime * 0.42);
}

function updateScoreDisplay() {
  if (scoreElement) scoreElement.textContent = Math.floor(score);
}

function updateBestScoreDisplay() {
  if (!bestScoreElement) return;

  const best = Number(saveData?.bestScore) || 0;
  bestScoreElement.textContent = Math.floor(best);
}

function endGame() {
  if (!gameRunning) return;

  gameRunning = false;
  gamePaused = false;

  const final = Math.floor(score);
  saveData.bestScore = Math.max(Number(saveData.bestScore) || 0, final);

  if (typeof saveGame === "function") saveGame();
  clearSavedRun();

  finalScoreElement.textContent = final;
  updateBestScoreDisplay();
  hidePauseButton();

  pauseScreen.classList.add("hidden");
  startScreen.classList.add("hidden");
  shopScreen.classList.add("hidden");
  gameOverScreen.classList.remove("hidden");
}

let shopReturnScreen = "start";

function openShop(from = "start") {
  shopReturnScreen = from;

  if (from === "pause" && gameRunning) {
    gamePaused = true;
    saveCurrentRun();
  }

  startScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  shopScreen.classList.remove("hidden");

  if (typeof updateShop === "function") updateShop();
}

function closeShop() {
  shopScreen.classList.add("hidden");

  if (shopReturnScreen === "pause" && gameRunning) {
    pauseScreen.classList.remove("hidden");
    gamePaused = true;
  } else if (shopReturnScreen === "gameover") {
    gameOverScreen.classList.remove("hidden");
  } else {
    startScreen.classList.remove("hidden");
  }

  checkSavedRun();
}

function goToMainMenu() {
  if (gameRunning && gamePaused) saveCurrentRun();

  gameRunning = false;
  gamePaused = false;

  hideAllScreens();
  startScreen.classList.remove("hidden");
  hidePauseButton();
  checkSavedRun();
  updateCoinDisplays();
}

function hideAllScreens() {
  startScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  shopScreen.classList.add("hidden");
}

function hidePauseButton() {
  if (pauseButton) pauseButton.classList.add("hidden");
}

function saveCurrentRun() {
  if (!gameRunning || typeof get3DRunSnapshot !== "function") return;

  const data = {
    score,
    runTime,
    runModifiers,
    snapshot: get3DRunSnapshot(),
    timestamp: Date.now()
  };

  try {
    localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Run konnte nicht gespeichert werden:", error);
  }
}

function loadCurrentRun() {
  try {
    const raw = localStorage.getItem(RUN_SAVE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    return data?.snapshot ? data : null;
  } catch {
    return null;
  }
}

function clearSavedRun() {
  try {
    localStorage.removeItem(RUN_SAVE_KEY);
  } catch (error) {
    console.warn("Gespeicherter Run konnte nicht gelöscht werden:", error);
  }
  savedRunAvailable = false;
}

function checkSavedRun() {
  const saved = loadCurrentRun();
  savedRunAvailable = Boolean(saved);

  if (resumeButton) {
    resumeButton.classList.toggle("hidden", !savedRunAvailable);
  }
}

function resumeSavedRun() {
  const saved = loadCurrentRun();
  if (!saved) {
    startGame();
    return;
  }

  score = Number(saved.score) || 0;
  runTime = Number(saved.runTime) || 0;
  runModifiers = saved.runModifiers || {
    scoreMultiplier: 1,
    extraLife: false,
    extraLifeUsed: false
  };

  gameRunning = true;
  gamePaused = false;

  try {
    if (typeof restore3DRun === "function") restore3DRun(saved.snapshot);
  } catch (error) {
    console.error("Run konnte nicht fortgesetzt werden:", error);
    startGame();
    return;
  }

  hideAllScreens();
  pauseButton.classList.remove("hidden");
  updateScoreDisplay();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && gameRunning && !gamePaused) pauseGame();
});

window.addEventListener("pagehide", () => {
  if (gameRunning) saveCurrentRun();
  if (typeof saveGame === "function") saveGame();
});
