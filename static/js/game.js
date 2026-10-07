let gameRunning = false;

let score = 0;

let playerLane = 1;

const lanePositions = [
    -2,
    0,
    2
];


function startGame() {

    console.log("GENGA: Spiel gestartet");

    gameRunning = true;

    score = 0;

    playerLane = 1;

    const scoreElement =
        document.getElementById("score");

    if (scoreElement) {
        scoreElement.textContent = "0";
    }

    const startScreen =
        document.getElementById("startScreen");

    if (startScreen) {
        startScreen.classList.add("hidden");
    }
}


function endGame() {

    gameRunning = false;

    const finalScore =
        document.getElementById("finalScore");

    if (finalScore) {
        finalScore.textContent =
            Math.floor(score);
    }

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
            startButton.onclick =
                startGame;
        }


        if (restartButton) {
            restartButton.onclick =
                startGame;
        }

    }
);
