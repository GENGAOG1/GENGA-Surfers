let gameRunning = false;

let score = 0;

let playerLane = 1;

let scoreTimer = 0;

const lanePositions = [
    -2,
    0,
    2
];


/* =========================================
   SPIEL START / NEUSTART
========================================= */

function startGame() {

    console.log("GENGA: Spiel wird gestartet...");


    /* ==============================
       SPIELZUSTAND ZURÜCKSETZEN
    ============================== */

    gameRunning = false;

    score = 0;

    playerLane = 1;

    scoreTimer = 0;


    /* ==============================
       SPIELER ZURÜCKSETZEN
    ============================== */

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


    /* ==============================
       ALTE HINDERNISSE ENTFERNEN
    ============================== */

    if (
        typeof obstacleObjects !== "undefined" &&
        obstacleObjects
    ) {

        obstacleObjects.forEach(
            obstacle => {

                if (scene) {
                    scene.remove(
                        obstacle
                    );
                }

            }
        );

        obstacleObjects.length = 0;
    }


    /* ==============================
       NEUE HINDERNISSE
    ============================== */

    if (
        typeof createObstacle === "function"
    ) {

        createObstacle(
            0,
            -20,
            0xff3030
        );

        createObstacle(
            2,
            -40,
            0x00cc66
        );

        createObstacle(
            1,
            -60,
            0xffcc00
        );

        createObstacle(
            0,
            -80,
            0xaa55ff
        );

        createObstacle(
            2,
            -100,
            0xff6600
        );
    }


    /* ==============================
       SCORE ZURÜCKSETZEN
    ============================== */

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


    /* ==============================
       GAME OVER AUSBLENDEN
    ============================== */

    const gameOverScreen =
        document.getElementById(
            "gameOverScreen"
        );

    if (gameOverScreen) {

        gameOverScreen.classList.add(
            "hidden"
        );
    }


    /* ==============================
       STARTSCREEN AUSBLENDEN
    ============================== */

    const startScreen =
        document.getElementById(
            "startScreen"
        );

    if (startScreen) {

        startScreen.classList.add(
            "hidden"
        );
    }


    /* ==============================
       SPIEL WIEDER AKTIVIEREN
    ============================== */

    gameRunning = true;

    console.log(
        "GENGA: Spiel läuft wieder."
    );
}


/* =========================================
   SCORE
========================================= */

function updateGame(delta) {

    if (!gameRunning) {
        return;
    }


    scoreTimer += delta;


    /*
       1 Punkt pro Sekunde
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


    /* ==============================
       FINAL SCORE
    ============================== */

    const finalScoreElement =
        document.getElementById(
            "finalScore"
        );

    if (finalScoreElement) {

        finalScoreElement.textContent =
            Math.floor(score);
    }


    /* ==============================
       GAME OVER SCREEN
    ============================== */

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
            (time - scoreLastTime) / 1000,
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
