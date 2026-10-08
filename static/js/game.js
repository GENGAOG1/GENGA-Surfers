let gameRunning = false;
let gamePaused = false;

let score = 0;
let playerLane = 1;

let scoreTimer = null;


/* =========================
   SAVE KEYS
========================= */

const SAVE_KEY = "genga_surfer_saved_run";
const HIGHSCORE_KEY = "genga_surfer_highscore";
const COINS_KEY = "genga_surfer_coins";


/* =========================
   COINS / HIGHSCORE
========================= */

let totalCoins = Number(
    localStorage.getItem(COINS_KEY) || 0
);

let highscore = Number(
    localStorage.getItem(HIGHSCORE_KEY) || 0
);


/* =========================
   DOM
========================= */

const scoreElement = document.getElementById("score");
const coinsElement = document.getElementById("coins");
const highscoreElement = document.getElementById("highscore");

const startHighscoreElement =
    document.getElementById("startHighscore");

const startCoinsElement =
    document.getElementById("startCoins");

const finalScoreElement =
    document.getElementById("finalScore");

const finalCoinsElement =
    document.getElementById("finalCoins");

const newHighscoreText =
    document.getElementById("newHighscoreText");


/* =========================
   DISPLAY
========================= */

function updateScoreDisplay() {

    if (scoreElement) {
        scoreElement.textContent = score;
    }

    if (highscoreElement) {
        highscoreElement.textContent = highscore;
    }

    if (coinsElement) {
        coinsElement.textContent = totalCoins;
    }

    if (startHighscoreElement) {
        startHighscoreElement.textContent = highscore;
    }

    if (startCoinsElement) {
        startCoinsElement.textContent = totalCoins;
    }
}


/* =========================
   HIGHSCORE
========================= */

function checkHighscore() {

    if (score > highscore) {

        highscore = score;

        localStorage.setItem(
            HIGHSCORE_KEY,
            String(highscore)
        );

        return true;
    }

    return false;
}


/* =========================
   COINS
========================= */

function addCoin() {

    totalCoins += 1;

    localStorage.setItem(
        COINS_KEY,
        String(totalCoins)
    );

    updateScoreDisplay();
}


/* =========================
   SAVE CURRENT RUN
========================= */

function saveGame() {

    if (!gameRunning && !gamePaused) {
        return;
    }

    const saveData = {
        score: score,
        playerLane: playerLane,
        savedAt: Date.now()
    };

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(saveData)
    );
}


/* =========================
   LOAD SAVED RUN
========================= */

function loadSavedGame() {

    const rawSave =
        localStorage.getItem(SAVE_KEY);

    if (!rawSave) {
        return null;
    }

    try {

        return JSON.parse(rawSave);

    } catch (error) {

        console.error(
            "Gespeichertes Spiel konnte nicht geladen werden:",
            error
        );

        localStorage.removeItem(SAVE_KEY);

        return null;
    }
}


/* =========================
   DELETE SAVE
========================= */

function deleteSavedGame() {

    localStorage.removeItem(SAVE_KEY);
}


/* =========================
   START NEW GAME
========================= */

function startGame() {

    score = 0;
    playerLane = 1;

    gamePaused = false;
    gameRunning = true;

    deleteSavedGame();

    if (typeof resetPlayer === "function") {
        resetPlayer();
    }

    if (typeof resetObstacles === "function") {
        resetObstacles();
    }

    if (typeof resetCoins === "function") {
        resetCoins();
    }

    hideStartScreen();
    hidePauseScreen();
    hideGameOverScreen();

    updateScoreDisplay();
    updatePauseButton();
}


/* =========================
   CONTINUE
========================= */

function continueSavedGame() {

    const savedGame = loadSavedGame();

    if (!savedGame) {
        startGame();
        return;
    }

    score =
        Number(savedGame.score) || 0;

    playerLane =
        Number(savedGame.playerLane);

    if (
        playerLane < 0 ||
        playerLane > 2
    ) {
        playerLane = 1;
    }

    gamePaused = false;
    gameRunning = true;

    if (typeof resetPlayer === "function") {
        resetPlayer();
    }

    if (typeof resetObstacles === "function") {
        resetObstacles();
    }

    if (typeof resetCoins === "function") {
        resetCoins();
    }

    hideStartScreen();
    hidePauseScreen();
    hideGameOverScreen();

    updateScoreDisplay();
    updatePauseButton();
}


/* =========================
   PAUSE
========================= */

function pauseGame() {

    if (!gameRunning) {
        return;
    }

    gameRunning = false;
    gamePaused = true;

    saveGame();

    showPauseScreen();
    updatePauseButton();
}


/* =========================
   RESUME
========================= */

function resumeGame() {

    if (!gamePaused) {
        return;
    }

    gamePaused = false;
    gameRunning = true;

    hidePauseScreen();
    updatePauseButton();
}


/* =========================
   PAUSE BUTTON
========================= */

function updatePauseButton() {

    const button =
        document.getElementById("pauseButton");

    if (!button) {
        return;
    }

    button.textContent =
        gamePaused ? "▶" : "⏸";

    button.setAttribute(
        "aria-label",
        gamePaused
            ? "Spiel fortsetzen"
            : "Spiel pausieren"
    );
}


/* =========================
   SCORE
========================= */

function updateGame(delta) {

    if (!gameRunning) {
        return;
    }

    scoreTimer += delta;

    if (scoreTimer >= 1) {

        scoreTimer = 0;

        score += 1;

        checkHighscore();

        updateScoreDisplay();
    }
}


/* =========================
   GAME OVER
========================= */

function endGame() {

    if (!gameRunning && !gamePaused) {
        return;
    }

    gameRunning = false;
    gamePaused = false;

    clearInterval(scoreTimer);

    const wasNewHighscore =
        checkHighscore();

    deleteSavedGame();

    if (finalScoreElement) {
        finalScoreElement.textContent = score;
    }

    if (finalCoinsElement) {
        finalCoinsElement.textContent = totalCoins;
    }

    if (newHighscoreText) {

        if (wasNewHighscore) {
            newHighscoreText.classList.remove("hidden");
        } else {
            newHighscoreText.classList.add("hidden");
        }
    }

    hideStartScreen();
    hidePauseScreen();
    showGameOverScreen();

    updateScoreDisplay();
    updatePauseButton();
}


/* =========================
   SCREEN FUNCTIONS
========================= */

function showStartScreen() {

    const screen =
        document.getElementById("startScreen");

    if (screen) {
        screen.classList.remove("hidden");
    }
}

function hideStartScreen() {

    const screen =
        document.getElementById("startScreen");

    if (screen) {
        screen.classList.add("hidden");
    }
}

function showPauseScreen() {

    const screen =
        document.getElementById("pauseScreen");

    if (screen) {
        screen.classList.remove("hidden");
    }
}

function hidePauseScreen() {

    const screen =
        document.getElementById("pauseScreen");

    if (screen) {
        screen.classList.add("hidden");
    }
}

function showGameOverScreen() {

    const screen =
        document.getElementById("gameOverScreen");

    if (screen) {
        screen.classList.remove("hidden");
    }
}

function hideGameOverScreen() {

    const screen =
        document.getElementById("gameOverScreen");

    if (screen) {
        screen.classList.add("hidden");
    }
}


/* =========================
   START SCREEN SETUP
========================= */

function setupStartScreen() {

    const savedGame =
        loadSavedGame();

    const continueButton =
        document.getElementById("continueButton");

    if (!continueButton) {
        return;
    }

    if (savedGame) {

        continueButton.classList.remove("hidden");

    } else {

        continueButton.classList.add("hidden");
    }
}


/* =========================
   BUTTONS
========================= */

function setupGameButtons() {

    const startButton =
        document.getElementById("startButton");

    const restartButton =
        document.getElementById("restartButton");

    const continueButton =
        document.getElementById("continueButton");

    const pauseButton =
        document.getElementById("pauseButton");

    const resumeButton =
        document.getElementById("resumeButton");


    if (startButton) {

        startButton.addEventListener(
            "click",
            startGame
        );
    }


    if (restartButton) {

        restartButton.addEventListener(
            "click",
            startGame
        );
    }


    if (continueButton) {

        continueButton.addEventListener(
            "click",
            continueSavedGame
        );
    }


    if (pauseButton) {

        pauseButton.addEventListener(
            "click",
            () => {

                if (gameRunning) {

                    pauseGame();

                } else if (gamePaused) {

                    resumeGame();
                }
            }
        );
    }


    if (resumeButton) {

        resumeButton.addEventListener(
            "click",
            resumeGame
        );
    }
}


/* =========================
   SCORE LOOP
========================= */

let lastScoreTime =
    performance.now();

function scoreLoop(currentTime) {

    const delta =
        (currentTime - lastScoreTime) / 1000;

    lastScoreTime = currentTime;

    updateGame(delta);

    requestAnimationFrame(scoreLoop);
}


/* =========================
   SAVE WHEN LEAVING
========================= */

function saveBeforeLeaving() {

    if (gameRunning) {

        gameRunning = false;
        gamePaused = true;
    }

    if (gamePaused) {
        saveGame();
    }
}


window.addEventListener(
    "pagehide",
    saveBeforeLeaving
);


document.addEventListener(
    "visibilitychange",
    () => {

        if (document.hidden) {

            saveBeforeLeaving();

        } else {

            if (gamePaused) {
                showPauseScreen();
                updatePauseButton();
            }
        }
    }
);


/* =========================
   INIT
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateScoreDisplay();

        setupStartScreen();
        setupGameButtons();

        updatePauseButton();

        requestAnimationFrame(scoreLoop);
    }
);
