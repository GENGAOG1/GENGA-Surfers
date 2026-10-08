/* =========================================
   GENGA SURFER
   GAME CONTROLLER
========================================= */


let gameRunning = false;

let score = 0;

let playerLane = 1;

let scoreTimer = 0;

let remainingLives = 0;


/* =========================================
   START GAME
========================================= */

function startGame() {

    console.log(
        "GENGA: Spiel startet..."
    );


    gameRunning = false;

    score = 0;

    playerLane = 1;

    scoreTimer = 0;


    /*
     * Extra Leben vom aktiven Upgrade.
     */

    if (
        typeof getExtraLives ===
        "function"
    ) {

        remainingLives =
            getExtraLives();

    } else {

        remainingLives = 0;
    }


    /* =====================================
       SPIELER RESET
    ===================================== */

    if (player) {

        player.position.x = 0;

        player.position.y = 0.9;

        player.position.z = 3;

        player.rotation.set(
            0,
            0,
            0
        );
    }


    /*
     * Game3D Reset
     */

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


    /* =====================================
       SCORE RESET
    ===================================== */

    const scoreElement =
        document.getElementById(
            "score"
        );


    if (scoreElement) {

        scoreElement.textContent =
            "0";
    }


    const finalScoreElement =
        document.getElementById(
            "finalScore"
        );


    if (finalScoreElement) {

        finalScoreElement.textContent =
            "0";
    }


    /* =====================================
       GAME OVER SCREEN
    ===================================== */

    const gameOverScreen =
        document.getElementById(
            "gameOverScreen"
        );


    if (gameOverScreen) {

        gameOverScreen.classList.add(
            "hidden"
        );
    }


    /* =====================================
       START SCREEN
    ===================================== */

    const startScreen =
        document.getElementById(
            "startScreen"
        );


    if (startScreen) {

        startScreen.classList.add(
            "hidden"
        );
    }


    /* =====================================
       GAME START
    ===================================== */

    gameRunning = true;


    updateLifeDisplay();

    updateActiveUpgradeDisplay();


    console.log(
        "GENGA: Spiel läuft."
    );
}


/* =========================================
   SCORE
========================================= */

function updateGame(
    delta
) {

    if (!gameRunning) {

        return;
    }


    scoreTimer += delta;


    if (
        scoreTimer >= 1
    ) {

        scoreTimer -= 1;


        let multiplier =
            1;


        if (
            typeof getScoreMultiplier ===
            "function"
        ) {

            multiplier =
                getScoreMultiplier();
        }


        score +=
            multiplier;


        const scoreElement =
            document.getElementById(
                "score"
            );


        if (scoreElement) {

            scoreElement.textContent =
                Math.floor(score);
        }
    }
}


/* =========================================
   GAME OVER / EXTRA LIFE
========================================= */

function endGame() {

    if (!gameRunning) {

        return;
    }


    /*
     * Extra Life benutzen.
     */

    if (
        remainingLives > 0
    ) {

        remainingLives--;


        /*
         * Spiel kurz stoppen.
         */

        gameRunning = false;


        updateLifeDisplay();


        showLifeMessage();


        /*
         * Hindernisse entfernen,
         * damit der Spieler nicht
         * direkt wieder kollidiert.
         */

        if (
            typeof obstacleObjects !==
            "undefined"
        ) {

            for (
                const obstacle of
                obstacleObjects
            ) {

                if (
                    obstacle.position.z > -25
                ) {

                    scene.remove(
                        obstacle
                    );
                }
            }


            obstacleObjects =
                obstacleObjects.filter(
                    obstacle =>
                        obstacle.position.z <= -25
                );
        }


        /*
         * Spieler zurücksetzen.
         */

        if (player) {

            player.position.x =
                lanePositions[
                    playerLane
                ];

            player.position.z =
                3;
        }


        /*
         * Nach kurzer Pause
         * weiterlaufen.
         */

        setTimeout(
            () => {

                if (
                    typeof gameRunning !==
                    "undefined"
                ) {

                    gameRunning =
                        true;
                }

            },
            700
        );


        return;
    }


    /*
     * Kein Leben mehr.
     */

    console.log(
        "GENGA: GAME OVER"
    );


    gameRunning = false;


    /* =====================================
       FINAL SCORE
    ===================================== */

    const finalScoreElement =
        document.getElementById(
            "finalScore"
        );


    if (finalScoreElement) {

        finalScoreElement.textContent =
            Math.floor(score);
    }


    /* =====================================
       GAME OVER SCREEN
    ===================================== */

    const gameOverScreen =
        document.getElementById(
            "gameOverScreen"
        );


    if (gameOverScreen) {

        gameOverScreen.classList.remove(
            "hidden"
        );
    }
}


/* =========================================
   LIFE MESSAGE
========================================= */

function showLifeMessage() {

    let message =
        document.getElementById(
            "lifeMessage"
        );


    if (!message) {

        message =
            document.createElement(
                "div"
            );


        message.id =
            "lifeMessage";


        message.innerHTML =
            "❤️ EXTRA LIFE!";


        document.body.appendChild(
            message
        );
    }


    message.classList.add(
        "show"
    );


    setTimeout(
        () => {

            message.classList.remove(
                "show"
            );

        },
        700
    );
}


/* =========================================
   LIFE DISPLAY
========================================= */

function updateLifeDisplay() {

    let element =
        document.getElementById(
            "lives"
        );


    if (!element) {

        return;
    }


    if (
        remainingLives <= 0
    ) {

        element.textContent =
            "";

        return;
    }


    element.textContent =
        "❤️".repeat(
            remainingLives
        );
}


/* =========================================
   AKTIVES UPGRADE ANZEIGEN
========================================= */

function updateActiveUpgradeDisplay() {

    let element =
        document.getElementById(
            "activeUpgradeDisplay"
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );


        element.id =
            "activeUpgradeDisplay";


        document.body.appendChild(
            element
        );
    }


    if (
        typeof getActiveUpgradeDefinition !==
        "function"
    ) {

        return;
    }


    const upgrade =
        getActiveUpgradeDefinition();


    if (!upgrade) {

        element.textContent =
            "";

        return;
    }


    element.textContent =
        `${upgrade.definition.icon} ${upgrade.definition.name} Lv.${upgrade.level}`;
}


/* =========================================
   SCORE LOOP
========================================= */

let scoreLastTime =
    performance.now();


function scoreLoop(time) {

    requestAnimationFrame(
        scoreLoop
    );


    const delta =
        Math.min(
            (time -
                scoreLastTime) /
                1000,
            0.1
        );


    scoreLastTime =
        time;


    updateGame(
        delta
    );
}


requestAnimationFrame(
    scoreLoop
);


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
    }
);
