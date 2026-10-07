let gameRunning = false;

let score = 0;

let playerLane = 1;

let scoreTimer = 0;


/* =========================================
   SPUREN
========================================= */

const lanePositions = [
    -2,
    0,
    2
];


/* =========================================
   SPIEL START
========================================= */

function startGame() {

    gameRunning = true;

    score = 0;

    playerLane = 1;

    scoreTimer = 0;


    /*
       Geschwindigkeit zurücksetzen
    */

    worldSpeed = 0.35;


    /*
       Spieler zurücksetzen
    */

    if (player) {

        player.position.x = 0;

        player.position.z = 5;
    }


    /*
       Alte Hindernisse entfernen
    */

    obstacleObjects.forEach(
        obstacle => {

            scene.remove(
                obstacle
            );
        }
    );


    obstacleObjects = [];


    /*
       Neue Hindernisse
    */

    createDemoObstacles();


    /*
       Anzeigen
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
   SPIEL UPDATE
========================================= */

function updateGame(
    delta
) {

    if (!gameRunning) {
        return;
    }


    /*
       Score steigt kontinuierlich.
    */

    scoreTimer += delta;


    if (
        scoreTimer >= 1
    ) {

        score += 1;

        scoreTimer = 0;


        document
            .getElementById(
                "score"
            )
            .textContent =
            score;
    }


    /*
       Das Spiel wird langsam schneller.

       Aber nicht zu schnell.
    */

    worldSpeed +=
        delta *
        0.0005;


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
   GAME LOOP
========================================= */

let gameLastTime =
    performance.now();


function gameLoop(time) {

    requestAnimationFrame(
        gameLoop
    );


    const delta =
        Math.min(
            (time -
            gameLastTime) /
            16.67,
            3
        );


    gameLastTime =
        time;


    updateGame(
        delta
    );
}


requestAnimationFrame(
    gameLoop
);


/* =========================================
   BUTTONS
========================================= */

document
    .getElementById(
        "startButton"
    )
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById(
        "restartButton"
    )
    .addEventListener(
        "click",
        startGame
    );
