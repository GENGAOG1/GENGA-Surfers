/* =========================================
   GENGA SURFER
   GAME CONTROLLER
========================================= */


let gameRunning = false;

let score = 0;

let playerLane = 1;

let scoreTimer = 0;


/*
   Positionen der drei Spuren

   0 = links
   1 = mitte
   2 = rechts
*/

const lanePositions = [
    -2,
    0,
    2
];


/* =========================================
   SPIEL STARTEN
========================================= */

function startGame() {

    console.log(
        "GENGA: Spiel startet..."
    );


    /*
       Spiel zuerst stoppen,
       damit sauber zurückgesetzt
       werden kann.
    */

    gameRunning = false;


    score = 0;

    playerLane = 1;

    scoreTimer = 0;


    /* =====================================
       SPIELER ZURÜCKSETZEN
    ===================================== */

    if (typeof player !== "undefined" && player) {

        player.position.x = 0;

        player.position.y = 0.9;

        player.position.z = 3;


        player.rotation.set(
            0,
            0,
            0
        );
    }


    /* =====================================
       HINDERNISSE ZURÜCKSETZEN
    ===================================== */

    if (
        typeof resetObstacles ===
        "function"
    ) {

        resetObstacles();
    }


    /* =====================================
       SCORE ZURÜCKSETZEN
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
       GAME OVER AUSBLENDEN
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
       START SCREEN AUSBLENDEN
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
       SPIEL STARTEN
    ===================================== */

    gameRunning = true;


    console.log(
        "GENGA: Spiel läuft."
    );
}


/* =========================================
   SCORE AKTUALISIEREN
========================================= */

function updateGame(delta) {

    if (!gameRunning) {
        return;
    }


    scoreTimer += delta;


    /*
       Alle Sekunden einen Punkt.
    */

    if (scoreTimer >= 1) {

        score += 1;

        scoreTimer -= 1;


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
   GAME OVER
========================================= */

function endGame() {

    if (!gameRunning) {
        return;
    }


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
            (time - scoreLastTime) /
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

function setupGameButtons() {

    const startButton =
        document.getElementById(
            "startButton"
        );


    const restartButton =
        document.getElementById(
            "restartButton"
        );


    /* =====================================
       START
    ===================================== */

    if (startButton) {

        startButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                startGame();
            }
        );

    } else {

        console.error(
            "GENGA: #startButton wurde nicht gefunden."
        );
    }


    /* =====================================
       RESTART
    ===================================== */

    if (restartButton) {

        restartButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                startGame();
            }
        );
    }
}


/* =========================================
   BUTTONS INITIALISIEREN
========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        setupGameButtons,
        {
            once: true
        }
    );

} else {

    setupGameButtons();
}
