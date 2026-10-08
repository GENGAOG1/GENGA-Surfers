/* =========================================================
   GENGA SURFER
   MAIN GAME LOGIC
========================================================= */

let gameRunning = false;
let gamePaused = false;

let score = 0;
let runTime = 0;

let runModifiers = {
  scoreMultiplier: 1,
  extraLife: false,
  extraLifeUsed: false
};

let savedRunAvailable = false;


/* =========================================================
   ELEMENTS
========================================================= */

let startScreen;
let pauseScreen;
let gameOverScreen;
let shopScreen;

let startButton;
let resumeButton;
let pauseButton;

let scoreElement;
let finalScoreElement;
let bestScoreElement;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    startScreen =
      document.getElementById(
        "startScreen"
      );

    pauseScreen =
      document.getElementById(
        "pauseScreen"
      );

    gameOverScreen =
      document.getElementById(
        "gameOverScreen"
      );

    shopScreen =
      document.getElementById(
        "shopScreen"
      );

    startButton =
      document.getElementById(
        "startButton"
      );

    resumeButton =
      document.getElementById(
        "resumeButton"
      );

    pauseButton =
      document.getElementById(
        "pauseButton"
      );

    scoreElement =
      document.getElementById(
        "score"
      );

    finalScoreElement =
      document.getElementById(
        "finalScore"
      );

    bestScoreElement =
      document.getElementById(
        "bestScore"
      );


    /*
      Buttons
    */

    startButton.addEventListener(
      "click",
      () => {
        startGame();
      }
    );

    resumeButton.addEventListener(
      "click",
      () => {
        resumeSavedRun();
      }
    );

    pauseButton.addEventListener(
      "click",
      () => {
        togglePause();
      }
    );


    document
      .getElementById(
        "resumeGameButton"
      )
      .addEventListener(
        "click",
        () => {
          resumeGame();
        }
      );


    document
      .getElementById(
        "restartButton"
      )
      .addEventListener(
        "click",
        () => {
          startGame();
        }
      );


    document
      .getElementById(
        "pauseMenuButton"
      )
      .addEventListener(
        "click",
        () => {
          goToMainMenu();
        }
      );


    document
      .getElementById(
        "gameOverMenuButton"
      )
      .addEventListener(
        "click",
        () => {
          goToMainMenu();
        }
      );


    document
      .getElementById(
        "openShopButton"
      )
      .addEventListener(
        "click",
        () => {
          openShop();
        }
      );


    document
      .getElementById(
        "pauseShopButton"
      )
      .addEventListener(
        "click",
        () => {
          openShop();
        }
      );


    document
      .getElementById(
        "gameOverShopButton"
      )
      .addEventListener(
        "click",
        () => {
          openShop();
        }
      );


    document
      .getElementById(
        "closeShopButton"
      )
      .addEventListener(
        "click",
        () => {
          closeShop();
        }
      );


    updateBestScoreDisplay();

    checkSavedRun();

    hidePauseButton();
  }
);


/* =========================================================
   START GAME
========================================================= */

function startGame() {
  /*
    Neuer Run löscht den alten
    gespeicherten Run.
  */

  clearSavedRun();

  score = 0;
  runTime = 0;

  runModifiers =
    typeof prepareRunUpgrades ===
    "function"
      ? prepareRunUpgrades()
      : {
          scoreMultiplier: 1,
          extraLife: false,
          extraLifeUsed: false
        };

  gameRunning = true;
  gamePaused = false;

  if (
    typeof reset3DRun ===
    "function"
  ) {
    reset3DRun();
  }

  hideAllScreens();

  hidePauseButton();

  /*
    Pause-Button erst nach dem
    Start sichtbar.
  */

  pauseButton.classList.remove(
    "hidden"
  );

  updateScoreDisplay();

  updateBestScoreDisplay();
}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {
  if (!gameRunning) {
    return;
  }

  if (gamePaused) {
    resumeGame();
  } else {
    pauseGame();
  }
}

function pauseGame(
  automatic = false
) {
  if (
    !gameRunning ||
    gamePaused
  ) {
    return;
  }

  gamePaused = true;

  pauseScreen.classList.remove(
    "hidden"
  );

  pauseButton.classList.add(
    "hidden"
  );

  saveCurrentRun();

  if (!automatic) {
    /*
      Normale Pause.
    */
  }
}

function resumeGame() {
  if (!gameRunning) {
    return;
  }

  gamePaused = false;

  pauseScreen.classList.add(
    "hidden"
  );

  pauseButton.classList.remove(
    "hidden"
  );
}


/* =========================================================
   SCORE / SPEED
========================================================= */

function updateGame(delta) {
  if (
    !gameRunning ||
    gamePaused
  ) {
    return;
  }

  runTime += delta;

  score +=
    delta *
    runModifiers.scoreMultiplier;

  updateScoreDisplay();
}

function getCurrentGameSpeed() {
  /*
    Start: 12
    Später: deutlich schneller
    Maximum: 29
  */

  return Math.min(
    29,
    12 +
      runTime * 0.42
  );
}

function updateScoreDisplay() {
  if (!scoreElement) {
    return;
  }

  scoreElement.textContent =
    Math.floor(score);
}

function updateBestScoreDisplay() {
  if (!bestScoreElement) {
    return;
  }

  let best = 0;

  try {
    const raw =
      localStorage.getItem(
        SAVE_KEY
      );

    if (raw) {
      const data =
        JSON.parse(raw);

      best =
        Number(data.bestScore) ||
        0;
    }
  } catch {
    best = 0;
  }

  bestScoreElement.textContent =
    Math.floor(best);
}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {
  if (!gameRunning) {
    return;
  }

  gameRunning = false;
  gamePaused = false;

  /*
    Bestenwert speichern.
  */

  const final =
    Math.floor(score);

  try {
    const raw =
      localStorage.getItem(
        SAVE_KEY
      );

    const data =
      raw
        ? JSON.parse(raw)
        : {};

    data.bestScore =
      Math.max(
        Number(data.bestScore) || 0,
        final
      );

    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.warn(
      "Bestwert konnte nicht gespeichert werden.",
      error
    );
  }

  clearSavedRun();

  finalScoreElement.textContent =
    final;

  updateBestScoreDisplay();

  hidePauseButton();

  pauseScreen.classList.add(
    "hidden"
  );

  startScreen.classList.add(
    "hidden"
  );

  shopScreen.classList.add(
    "hidden"
  );

  gameOverScreen.classList.remove(
    "hidden"
  );
}


/* =========================================================
   MAIN MENU
========================================================= */

function goToMainMenu() {
  /*
    Wenn man aus einem laufenden
    pausierten Run kommt, bleibt der
    Run gespeichert.
  */

  if (
    gameRunning &&
    gamePaused
  ) {
    saveCurrentRun();
  }

  gameRunning = false;
  gamePaused = false;

  pauseScreen.classList.add(
    "hidden"
  );

  gameOverScreen.classList.add(
    "hidden"
  );

  shopScreen.classList.add(
    "hidden"
  );

  startScreen.classList.remove(
    "hidden"
  );

  hidePauseButton();

  checkSavedRun();
}


/* =========================================================
   SHOP
========================================================= */

function openShop() {
  /*
    Während eines laufenden Runs
    bleibt das Spiel pausiert.
  */

  if (
    gameRunning &&
    !gamePaused
  ) {
    pauseGame(true);
  }

  shopScreen.classList.remove(
    "hidden"
  );

  if (
    typeof updateShop ===
    "function"
  ) {
    updateShop();
  }
}

function closeShop() {
  shopScreen.classList.add(
    "hidden"
  );

  /*
    Wenn der Shop aus der Pause
    geöffnet wurde, bleibt das Spiel
    pausiert.
  */

  if (
    gameRunning &&
    gamePaused
  ) {
    pauseScreen.classList.remove(
      "hidden"
    );
  }
}


/* =========================================================
   SCREEN HELPERS
========================================================= */

function hideAllScreens() {
  startScreen.classList.add(
    "hidden"
  );

  pauseScreen.classList.add(
    "hidden"
  );

  gameOverScreen.classList.add(
    "hidden"
  );

  shopScreen.classList.add(
    "hidden"
  );
}

function hidePauseButton() {
  if (pauseButton) {
    pauseButton.classList.add(
      "hidden"
    );
  }
}


/* =========================================================
   SAVED RUN
========================================================= */

function saveCurrentRun() {
  if (
    !gameRunning ||
    typeof get3DRunSnapshot !==
      "function"
  ) {
    return;
  }

  const snapshot =
    get3DRunSnapshot();

  const data = {
    score,
    runTime,
    runModifiers,
    snapshot,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem(
      RUN_SAVE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.warn(
      "Run konnte nicht gespeichert werden:",
      error
    );
  }
}

function loadCurrentRun() {
  try {
    const raw =
      localStorage.getItem(
        RUN_SAVE_KEY
      );

    if (!raw) {
      return null;
    }

    const data =
      JSON.parse(raw);

    if (
      !data ||
      !data.snapshot
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function clearSavedRun() {
  try {
    localStorage.removeItem(
      RUN_SAVE_KEY
    );
  } catch {
    // nichts
  }

  savedRunAvailable = false;
}

function checkSavedRun() {
  const saved =
    loadCurrentRun();

  savedRunAvailable =
    Boolean(saved);

  if (
    savedRunAvailable &&
    resumeButton
  ) {
    resumeButton.classList.remove(
      "hidden"
    );
  } else if (resumeButton) {
    resumeButton.classList.add(
      "hidden"
    );
  }
}

function resumeSavedRun() {
  const saved =
    loadCurrentRun();

  if (!saved) {
    startGame();
    return;
  }

  score =
    Number(saved.score) || 0;

  runTime =
    Number(saved.runTime) || 0;

  runModifiers =
    saved.runModifiers || {
      scoreMultiplier: 1,
      extraLife: false,
      extraLifeUsed: false
    };

  gameRunning = true;
  gamePaused = false;

  if (
    typeof restore3DRun ===
    "function"
  ) {
    restore3DRun(
      saved.snapshot
    );
  }

  hideAllScreens();

  pauseButton.classList.remove(
    "hidden"
  );

  updateScoreDisplay();
}


/* =========================================================
   PAGE / TAB CHANGE
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {
    if (
      document.hidden &&
      gameRunning
    ) {
      pauseGame(true);
    }
  }
);

window.addEventListener(
  "pagehide",
  () => {
    if (gameRunning) {
      if (!gamePaused) {
        gamePaused = true;
      }

      saveCurrentRun();
    }

    if (
      typeof saveGame ===
      "function"
    ) {
      saveGame();
    }
  }
);


/* =========================================================
   BEFORE LEAVING
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {
    if (gameRunning) {
      saveCurrentRun();
    }

    if (
      typeof saveGame ===
      "function"
    ) {
      saveGame();
    }
  }
);
