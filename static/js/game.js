let gameRunning = false;

let score = 0;

let playerLane = 1;


/*
   Positionen der drei Spuren
*/

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


    /*
       Spieler in die mittlere Spur
    */

    if (player) {

        player.position.x =
            lanePositions[playerLane];
    }


    document
        .getElementById("startScreen")
        .classList.add("hidden");


    document
        .getElementById("gameOverScreen")
        .classList.add("hidden");


    document
        .getElementById("score")
        .textContent = "0";
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
        .getElementById("finalScore")
        .textContent =
        Math.floor(score);


    document
        .getElementById("gameOverScreen")
        .classList.remove(
            "hidden"
        );
}


/* =========================================
   BUTTONS
========================================= */

document
    .getElementById("startButton")
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById("restartButton")
    .addEventListener(
        "click",
        startGame
    );
