/* =========================================
   GENGA SURFER
   GAME CONTROLLER
========================================= */

let gameRunning = false;

let gamePaused = false;

let score = 0;

let runCoins = 0;

let scoreTimer = 0;

let remainingLives = 0;


/* =========================================
   START
========================================= */

function startGame() {

    gamePaused = false;

    gameRunning = false;

    score = 0;

    runCoins = 0;

    scoreTimer = 0;


    if (
        typeof playerLane !==
        "undefined"
    ) {

        playerLane = 1;
    }


    if (
        typeof getExtraLives ===
        "function"
    ) {

        remainingLives =
            getExtraLives();

    } else {

        remainingLives = 0;
    }


    /* Spieler */

    if (typeof resetPlayer === "function") {

        resetPlayer();

    } else if (typeof player !== "undefined" && player) {

        player.position.set(
            0,
            0.9,
            3
        );
    }


    /* Hindernisse */

    if (
        typeof resetObstacles ===
        "function"
    ) {

        resetObstacles();
    }


    /* Münzen */

    if (
        typeof resetCoins ===
        "function"
    ) {

        resetCoins();
    }


    /* Score */

    const scoreElement =
        document.getElementById(
            "score"
        );


    if (scoreElement) {

        scoreElement.textContent =
            "0";
    }


    /* Screens */

    hide(
        "startScreen"
    );

    hide(
        "gameOverScreen"
    );

    hide(
        "pauseScreen"
    );


    show(
        "gameHUD"
    );


    updateHUD();


    gameRunning = true;


    console.log(
        "GENGA SURFER START"
    );
}


/* =========================================
   SCORE
========================================= */

function updateGame(
    delta
) {

    if (
        !gameRunning ||
        gamePaused
    ) {

        return;
    }


    scoreTimer += delta;


    if (
        scoreTimer >= 1
    ) {

        scoreTimer -= 1;


        let multiplier = 1;


        if (
            typeof getScoreMultiplier ===
            "function"
        ) {

            multiplier =
                getScoreMultiplier();
        }


        score += multiplier;


        const scoreElement =
            document.getElementById(
                "score"
            );


        if (scoreElement) {

            scoreElement.textContent =
                Math.floor(score);
        }


        updateHUD();
    }
}


/* =========================================
   PAUSE
========================================= */

function pauseGame() {

    if (
        !gameRunning
    ) {

        return;
    }


    gamePaused = true;


    show(
        "pauseScreen"
    );
}


function resumeGame() {

    if (
        !gameRunning
    ) {

        return;
    }


    hide(
        "pauseScreen"
    );


    gamePaused = false;
}


/* =========================================
   GAME OVER
========================================= */

function endGame() {

    if (
        !gameRunning
    ) {

        return;
    }


    /* Extra Life */

    if (
        remainingLives > 0
    ) {

        remainingLives--;


        updateHUD();


        if (
            typeof clearNearbyObstacles ===
            "function"
        ) {

            clearNearbyObstacles();
        }


        if (
            typeof resetPlayer ===
            "function"
        ) {

            resetPlayer();
        }


        showLifeMessage();


        gamePaused = true;


        setTimeout(
            () => {

                if (
                    gameRunning
                ) {

                    gamePaused =
                        false;
                }

            },
            800
        );


        return;
    }


    /* Wirklich tot */

    gameRunning = false;

    gamePaused = false;


    const finalScore =
        document.getElementById(
            "finalScore"
        );


    if (finalScore) {

        finalScore.textContent =
            Math.floor(score);
    }


    const finalCoins =
        document.getElementById(
            "finalCoins"
        );


    if (finalCoins) {

        finalCoins.textContent =
            `🪙 +${runCoins}`;
    }


    hide(
        "gameHUD"
    );


    show(
        "gameOverScreen"
    );


    updateAllCoinDisplays();
}


/* =========================================
   COINS
========================================= */

function collectCoin() {

    let multiplier = 1;


    if (
        typeof getCoinMultiplier ===
        "function"
    ) {

        multiplier =
            getCoinMultiplier();
    }


    const amount =
        Math.max(
            1,
            Math.floor(
                multiplier
            )
        );


    runCoins += amount;


    if (
        typeof addCoins ===
        "function"
    ) {

        addCoins(
            amount
        );
    }


    updateHUD();
}


/* =========================================
   HUD
========================================= */

function updateHUD() {

    const coins =
        typeof getCoins ===
        "function"
            ? getCoins()
            : 0;


    const coinElement =
        document.getElementById(
            "hudCoins"
        );


    if (coinElement) {

        coinElement.textContent =
            `🪙 ${coins.toLocaleString("de-DE")}`;
    }


    const livesElement =
        document.getElementById(
            "hudLives"
        );


    if (livesElement) {

        livesElement.textContent =
            "❤️".repeat(
                remainingLives
            );
    }


    const multiplierElement =
        document.getElementById(
            "hudMultiplier"
        );


    if (multiplierElement) {

        const multiplier =
            typeof getScoreMultiplier ===
            "function"
                ? getScoreMultiplier()
                : 1;


        multiplierElement.textContent =
            `x${multiplier}`;
    }
}


/* =========================================
   LIFE MESSAGE
========================================= */

function showLifeMessage() {

    let element =
        document.getElementById(
            "lifeMessage"
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );


        element.id =
            "lifeMessage";


        element.textContent =
            "❤️ EXTRA LIFE!";


        document.body.appendChild(
            element
        );
    }


    element.classList.add(
        "show"
    );


    setTimeout(
        () => {

            element.classList.remove(
                "show"
            );

        },
        750
    );
}


/* =========================================
   MENÜ
========================================= */

function returnToMainMenu() {

    gameRunning = false;

    gamePaused = false;


    hide(
        "gameHUD"
    );

    hide(
        "pauseScreen"
    );

    hide(
        "gameOverScreen"
    );

    hide(
        "shopScreen"
    );

    hide(
        "upgradeScreen"
    );


    show(
        "startScreen"
    );


    updateAllCoinDisplays();


    if (
        typeof updateMenuActiveUpgrade ===
        "function"
    ) {

        updateMenuActiveUpgrade();
    }
}


/* =========================================
   HELPER
========================================= */

function show(id) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.classList.remove(
            "hidden"
        );
    }
}


function hide(id) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.classList.add(
            "hidden"
        );
    }
}


/* =========================================
   BUTTONS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const startButton =
            document.getElementById(
                "startButton"
            );


        const restartButton =
            document.getElementById(
                "restartButton"
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


        if (startButton) {

            startButton.onclick =
                startGame;
        }


        if (restartButton) {

            restartButton.onclick =
                startGame;
        }


        if (pauseButton) {

            pauseButton.onclick =
                pauseGame;
        }


        if (resumeButton) {

            resumeButton.onclick =
                resumeGame;
        }


        if (pauseMenuButton) {

            pauseMenuButton.onclick =
                returnToMainMenu;
        }


        if (gameOverMenuButton) {

            gameOverMenuButton.onclick =
                returnToMainMenu;
        }


        updateHUD();
    }
);


/* =========================================
   SCORE LOOP
========================================= */

let lastScoreTime =
    performance.now();


function scoreLoop(
    time
) {

    requestAnimationFrame(
        scoreLoop
    );


    const delta =
        Math.min(
            (time -
                lastScoreTime) /
                1000,
            0.1
        );


    lastScoreTime =
        time;


    updateGame(
        delta
    );
}


requestAnimationFrame(
    scoreLoop
);


/* =========================================
   PAGE VISIBILITY
========================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden &&
            gameRunning &&
            !gamePaused
        ) {

            pauseGame();
        }
    }
);
