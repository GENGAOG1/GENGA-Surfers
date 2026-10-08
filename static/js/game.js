let gameRunning = false;
let gamePaused = false;

let score = 0;
let playerLane = 1;

let scoreTimer = 0;


/* =====================================
   STORAGE
===================================== */

const SAVE_KEY =
    "genga_surfer_saved_run";

const HIGHSCORE_KEY =
    "genga_surfer_highscore";

const COINS_KEY =
    "genga_surfer_coins";

const OWNED_SKINS_KEY =
    "genga_surfer_owned_skins";

const SELECTED_SKIN_KEY =
    "genga_surfer_selected_skin";


/* =====================================
   SKINS
===================================== */

const SKINS = {

    blue: {
        name: "Blau",
        price: 0,
        color: 0x007aff
    },

    red: {
        name: "Rot",
        price: 50,
        color: 0xff3b30
    },

    purple: {
        name: "Lila",
        price: 100,
        color: 0xaf52de
    },

    green: {
        name: "Grün",
        price: 200,
        color: 0x34c759
    }

};


let totalCoins =
    Number(
        localStorage.getItem(
            COINS_KEY
        ) || 0
    );


let highscore =
    Number(
        localStorage.getItem(
            HIGHSCORE_KEY
        ) || 0
    );


let ownedSkins;


try {

    ownedSkins =
        JSON.parse(
            localStorage.getItem(
                OWNED_SKINS_KEY
            )
        ) || ["blue"];

} catch {

    ownedSkins = ["blue"];
}


if (!ownedSkins.includes("blue")) {

    ownedSkins.push("blue");
}


let selectedSkin =
    localStorage.getItem(
        SELECTED_SKIN_KEY
    ) || "blue";


if (!SKINS[selectedSkin]) {

    selectedSkin = "blue";
}


/* =====================================
   DOM
===================================== */

const scoreElement =
    document.getElementById("score");

const coinsElement =
    document.getElementById("coins");

const highscoreElement =
    document.getElementById("highscore");

const menuCoinsElement =
    document.getElementById("menuCoins");

const menuHighscoreElement =
    document.getElementById("menuHighscore");

const shopCoinsElement =
    document.getElementById("shopCoins");

const finalScoreElement =
    document.getElementById("finalScore");

const finalCoinsElement =
    document.getElementById("finalCoins");

const newHighscoreText =
    document.getElementById(
        "newHighscoreText"
    );


/* =====================================
   DISPLAY
===================================== */

function updateDisplays() {

    if (scoreElement) {

        scoreElement.textContent =
            score;
    }


    if (coinsElement) {

        coinsElement.textContent =
            totalCoins;
    }


    if (highscoreElement) {

        highscoreElement.textContent =
            highscore;
    }


    if (menuCoinsElement) {

        menuCoinsElement.textContent =
            totalCoins;
    }


    if (menuHighscoreElement) {

        menuHighscoreElement.textContent =
            highscore;
    }


    if (shopCoinsElement) {

        shopCoinsElement.textContent =
            totalCoins;
    }
}


/* =====================================
   HIGHSCORE
===================================== */

function checkHighscore() {

    if (score > highscore) {

        highscore =
            score;

        localStorage.setItem(
            HIGHSCORE_KEY,
            String(highscore)
        );

        return true;
    }

    return false;
}


/* =====================================
   COINS
===================================== */

function addCoin() {

    totalCoins += 1;

    localStorage.setItem(
        COINS_KEY,
        String(totalCoins)
    );

    updateDisplays();
}


/* =====================================
   SAVE GAME
===================================== */

function saveGame() {

    if (
        !gameRunning &&
        !gamePaused
    ) {

        return;
    }


    const saveData = {

        score:
            score,

        playerLane:
            playerLane,

        savedAt:
            Date.now()
    };


    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(saveData)
    );
}


/* =====================================
   LOAD SAVE
===================================== */

function loadSavedGame() {

    const raw =
        localStorage.getItem(
            SAVE_KEY
        );


    if (!raw) {

        return null;
    }


    try {

        return JSON.parse(raw);

    } catch {

        localStorage.removeItem(
            SAVE_KEY
        );

        return null;
    }
}


/* =====================================
   DELETE SAVE
===================================== */

function deleteSavedGame() {

    localStorage.removeItem(
        SAVE_KEY
    );
}


/* =====================================
   START NEW GAME
===================================== */

function startGame() {

    score = 0;

    scoreTimer = 0;

    playerLane = 1;

    gameRunning = true;

    gamePaused = false;


    deleteSavedGame();


    if (
        typeof resetPlayer ===
        "function"
    ) {

        resetPlayer();
    }


    if (
        typeof resetObstacles ===
        "function"
    ) {

        resetObstacles();
    }


    if (
        typeof resetCoins ===
        "function"
    ) {

        resetCoins();
    }


    applySelectedSkin();


    hideAllScreens();

    showHUD();

    updateDisplays();

    updatePauseButton();
}


/* =====================================
   CONTINUE SAVED GAME
===================================== */

function continueSavedGame() {

    const saved =
        loadSavedGame();


    if (!saved) {

        startGame();

        return;
    }


    score =
        Number(saved.score) || 0;


    playerLane =
        Number(saved.playerLane);


    if (
        playerLane < 0 ||
        playerLane > 2
    ) {

        playerLane = 1;
    }


    scoreTimer = 0;

    gameRunning = true;

    gamePaused = false;


    if (
        typeof resetPlayer ===
        "function"
    ) {

        resetPlayer();
    }


    if (
        typeof resetObstacles ===
        "function"
    ) {

        resetObstacles();
    }


    if (
        typeof resetCoins ===
        "function"
    ) {

        resetCoins();
    }


    applySelectedSkin();


    hideAllScreens();

    showHUD();

    updateDisplays();

    updatePauseButton();
}


/* =====================================
   PAUSE
===================================== */

function pauseGame() {

    if (!gameRunning) {

        return;
    }


    gameRunning = false;

    gamePaused = true;


    saveGame();


    showScreen("pauseScreen");

    updatePauseButton();
}


/* =====================================
   RESUME
===================================== */

function resumeGame() {

    if (!gamePaused) {

        return;
    }


    gameRunning = true;

    gamePaused = false;


    hideScreen("pauseScreen");

    updatePauseButton();
}


/* =====================================
   GAME OVER
===================================== */

function endGame() {

    if (
        !gameRunning &&
        !gamePaused
    ) {

        return;
    }


    gameRunning = false;

    gamePaused = false;


    const isNewHighscore =
        checkHighscore();


    deleteSavedGame();


    if (finalScoreElement) {

        finalScoreElement.textContent =
            score;
    }


    if (finalCoinsElement) {

        finalCoinsElement.textContent =
            totalCoins;
    }


    if (newHighscoreText) {

        if (isNewHighscore) {

            newHighscoreText.classList.remove(
                "hidden"
            );

        } else {

            newHighscoreText.classList.add(
                "hidden"
            );
        }
    }


    hideHUD();

    hideAllScreens();

    showScreen(
        "gameOverScreen"
    );


    updateDisplays();
}


/* =====================================
   MAIN MENU
===================================== */

function openMainMenu() {

    gameRunning = false;

    gamePaused = false;


    deleteSavedGame();


    hideHUD();

    hideAllScreens();


    showScreen(
        "mainMenu"
    );


    updateDisplays();

    updatePauseButton();
}


/* =====================================
   SHOP
===================================== */

function openShop() {

    gameRunning = false;

    gamePaused = false;


    hideHUD();

    hideAllScreens();


    showScreen(
        "shopScreen"
    );


    updateDisplays();

    updateShop();
}


function closeShop() {

    hideAllScreens();


    showScreen(
        "mainMenu"
    );


    updateDisplays();
}


/* =====================================
   BUY / SELECT SKIN
===================================== */

function buyOrSelectSkin(
    skinId
) {

    const skin =
        SKINS[skinId];


    if (!skin) {

        return;
    }


    /*
     * Bereits gekauft:
     * einfach auswählen.
     */

    if (
        ownedSkins.includes(
            skinId
        )
    ) {

        selectedSkin =
            skinId;


        localStorage.setItem(
            SELECTED_SKIN_KEY,
            selectedSkin
        );


        applySelectedSkin();

        updateShop();

        return;
    }


    /*
     * Nicht genug Münzen.
     */

    if (
        totalCoins <
        skin.price
    ) {

        alert(
            "Du hast nicht genug Münzen."
        );

        return;
    }


    /*
     * Kaufen.
     */

    totalCoins -=
        skin.price;


    ownedSkins.push(
        skinId
    );


    selectedSkin =
        skinId;


    localStorage.setItem(
        COINS_KEY,
        String(totalCoins)
    );


    localStorage.setItem(
        OWNED_SKINS_KEY,
        JSON.stringify(
            ownedSkins
        )
    );


    localStorage.setItem(
        SELECTED_SKIN_KEY,
        selectedSkin
    );


    applySelectedSkin();

    updateDisplays();

    updateShop();
}


/* =====================================
   UPDATE SHOP
===================================== */

function updateShop() {

    const buttons =
        document.querySelectorAll(
            ".skin-button"
        );


    const items =
        document.querySelectorAll(
            ".shop-item"
        );


    items.forEach(
        item => {

            const skinId =
                item.dataset.skin;


            item.classList.toggle(
                "selected",
                skinId === selectedSkin
            );
        }
    );


    buttons.forEach(
        button => {

            const skinId =
                button.dataset.skin;


            const skin =
                SKINS[skinId];


            if (!skin) {

                return;
            }


            if (
                selectedSkin ===
                skinId
            ) {

                button.textContent =
                    "Ausgewählt";

                return;
            }


            if (
                ownedSkins.includes(
                    skinId
                )
            ) {

                button.textContent =
                    "Auswählen";

                return;
            }


            button.textContent =
                `🪙 ${skin.price} Kaufen`;
        }
    );
}


/* =====================================
   APPLY SKIN
===================================== */

function applySelectedSkin() {

    if (!player) {

        return;
    }


    const skin =
        SKINS[selectedSkin];


    if (!skin) {

        return;
    }


    if (
        player.material
    ) {

        player.material.color.setHex(
            skin.color
        );
    }
}


/* =====================================
   SCREENS
===================================== */

function showScreen(
    id
) {

    const screen =
        document.getElementById(id);


    if (screen) {

        screen.classList.remove(
            "hidden"
        );
    }
}


function hideScreen(
    id
) {

    const screen =
        document.getElementById(id);


    if (screen) {

        screen.classList.add(
            "hidden"
        );
    }
}


function hideAllScreens() {

    const screens = [
        "mainMenu",
        "shopScreen",
        "pauseScreen",
        "gameOverScreen"
    ];


    screens.forEach(
        id => hideScreen(id)
    );
}


/* =====================================
   HUD
===================================== */

function showHUD() {

    const hud =
        document.getElementById(
            "gameHUD"
        );


    if (hud) {

        hud.classList.remove(
            "hidden"
        );
    }
}


function hideHUD() {

    const hud =
        document.getElementById(
            "gameHUD"
        );


    if (hud) {

        hud.classList.add(
            "hidden"
        );
    }
}


/* =====================================
   PAUSE BUTTON
===================================== */

function updatePauseButton() {

    const button =
        document.getElementById(
            "pauseButton"
        );


    if (!button) {

        return;
    }


    button.textContent =
        gamePaused
            ? "▶"
            : "⏸";
}


/* =====================================
   SCORE
===================================== */

function updateGame(
    delta
) {

    if (!gameRunning) {

        return;
    }


    scoreTimer +=
        delta;


    if (
        scoreTimer >= 1
    ) {

        scoreTimer -= 1;

        score += 1;


        checkHighscore();

        updateDisplays();
    }
}


/* =====================================
   SCORE LOOP
===================================== */

let lastScoreTime =
    performance.now();


function scoreLoop(
    time
) {

    const delta =
        Math.min(
            (time - lastScoreTime) /
                1000,
            0.1
        );


    lastScoreTime =
        time;


    updateGame(
        delta
    );


    requestAnimationFrame(
        scoreLoop
    );
}


/* =====================================
   SAVE ON LEAVE
===================================== */

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

        if (
            document.hidden
        ) {

            saveBeforeLeaving();
        }
    }
);


/* =====================================
   BUTTONS
===================================== */

function setupButtons() {

    const playButton =
        document.getElementById(
            "playButton"
        );


    const shopButton =
        document.getElementById(
            "shopButton"
        );


    const backButton =
        document.getElementById(
            "backToMenuButton"
        );


    const pauseButton =
        document.getElementById(
            "pauseButton"
        );


    const resumeButton =
        document.getElementById(
            "resumeButton"
        );


    const pauseMenuButton =
        document.getElementById(
            "pauseMenuButton"
        );


    const gameOverMenuButton =
        document.getElementById(
            "gameOverMenuButton"
        );


    const gameOverRestartButton =
        document.getElementById(
            "gameOverRestartButton"
        );


    if (playButton) {

        playButton.addEventListener(
            "click",
            startGame
        );
    }


    if (shopButton) {

        shopButton.addEventListener(
            "click",
            openShop
        );
    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            closeShop
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


    if (pauseMenuButton) {

        pauseMenuButton.addEventListener(
            "click",
            openMainMenu
        );
    }


    if (gameOverMenuButton) {

        gameOverMenuButton.addEventListener(
            "click",
            openMainMenu
        );
    }


    if (gameOverRestartButton) {

        gameOverRestartButton.addEventListener(
            "click",
            startGame
        );
    }


    /*
     * Shop Buttons
     */

    document.querySelectorAll(
        ".skin-button"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buyOrSelectSkin(
                        button.dataset.skin
                    );
                }
            );
        }
    );
}


/* =====================================
   INITIALISIERUNG
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateDisplays();

        setupButtons();

        updateShop();

        hideHUD();

        hideAllScreens();

        showScreen(
            "mainMenu"
        );


        requestAnimationFrame(
            scoreLoop
        );
    }
);
