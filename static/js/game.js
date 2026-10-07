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
   SPIEL STARTEN
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

    if (player) {
        player.position.x = 0;
        player.position.z = 5;
    }

    /* Alte Hindernisse entfernen */

    if (obstacleObjects) {

        obstacleObjects.forEach(obstacle => {
            scene.remove(obstacle);
        });

        obstacleObjects.length = 0;
    }

    /* Startbildschirm schließen */

    const startScreen =
        document.getElementById("startScreen");

    const gameOverScreen =
        document.getElementById("gameOverScreen");

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    document.getElementById("score").textContent = "0";
}


/* =========================================
   SPIEL UPDATE
========================================= */

function updateGame(delta) {

    if (!gameRunning) {
        return;
    }

    scoreTimer += delta;

    if (scoreTimer >= 60) {

        score += 1;

        scoreTimer = 0;

        document.getElementById("score").textContent =
            Math.floor(score);
    }

    worldSpeed += delta * 0.0005;

    worldSpeed = Math.min(
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

    document.getElementById("finalScore").textContent =
        Math.floor(score);

    document
        .getElementById("gameOverScreen")
        .classList.remove("hidden");
}


/* =========================================
   GAME LOOP
========================================= */

let gameLastTime = performance.now();

function gameLoop(time) {

    requestAnimationFrame(gameLoop);

    const delta =
        Math.min(
            (time - gameLastTime) / 16.67,
            3
        );

    gameLastTime = time;

    updateGame(delta);
}

requestAnimationFrame(gameLoop);


/* =========================================
   BUTTONS
========================================= */

const startButton =
    document.getElementById("startButton");

const restartButton =
    document.getElementById("restartButton");


if (startButton) {
    startButton.onclick = startGame;
}

if (restartButton) {
    restartButton.onclick = startGame;
}
