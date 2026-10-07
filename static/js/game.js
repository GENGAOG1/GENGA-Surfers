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
   SPIEL START
========================================= */

function startGame() {

    if (gameRunning) {
        return;
    }


    gameRunning = true;

    score = 0;

    playerLane = 1;

    scoreTimer = 0;

    worldSpeed = 0.35;


    /*
       Spieler zurücksetzen
    */

    if (player) {

        player.position.x = 0;

        player.position.z = 5;
    }


    /*
       Alte Blöcke löschen
    */

    if (obstacleObjects) {

        obstacleObjects.forEach(
            obstacle => {
                scene.remove(
                    obstacle
                );
            }
        );

        obstacleObjects.length = 0;
    }


    /*
       Neue Blöcke
    */

    createDemoObstacles();


    /*
       Menüs
    */

    document
        .getElementById(
            "startScreen"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "gameOverScreen"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "score"
        )
        .textContent = "0";
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


    if (scoreTimer >= 60) {

        score += 1;

        scoreTimer = 0;


        document
            .getElementById(
                "score"
            )
            .textContent =
            Math.floor(score);
    }


    /*
       Geschwindigkeit langsam erhöhen
    */

    worldSpeed +=
        delta * 0.0004;


    worldSpeed =
        Math.min(
            worldSpeed,
            0.9
        );
}


/* =========================================
   GAME OVER
========================================= */

function endGame() {

    if (!gameRunning) {
        return;
    }


    gameRunning = false;


    document
        .getElementById(
            "finalScore"
        )
        .textContent =
        Math.floor(score);


    document
        .getElementById(
            "gameOverScreen"
        )
        .classList.remove(
            "hidden"
        );
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
            16.67,
            3
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

document
    .getElementById(
        "startButton"
    )
    .onclick =
    startGame;


document
    .getElementById(
        "restartButton"
    )
    .onclick =
    startGame;
