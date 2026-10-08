/* =========================================
   GENGA SURFER
   GAME CONTROLLER
========================================= */

let gameRunning = false;

let score = 0;

let playerLane = 1;

let scoreTimer = 0;

let gamePaused = false;


/* =========================================
   SAVE
========================================= */

const SAVE_KEY =
    "genga_surfer_saved_run";


function saveGame() {

    /*
       Nur speichern, wenn wirklich ein
       laufendes oder pausiertes Spiel existiert.
    */

    if (
        !gameRunning &&
        !gamePaused
    ) {

        return;
    }


    const saveData = {

        score:
            Math.floor(score),

        playerLane:
            playerLane,

        savedAt:
            Date.now()
    };


    try {

        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(saveData)
        );

        console.log(
            "GENGA: Spiel gespeichert"
        );

    } catch (error) {

        console.error(
            "GENGA: Speichern fehlgeschlagen",
            error
        );
    }
}


/* =========================================
   GESPEICHERTES SPIEL LADEN
========================================= */

function loadSavedGame() {

    try {

        const saved =
            localStorage.getItem(
                SAVE_KEY
            );


        if (!saved) {

            return null;
        }


        const data =
            JSON.parse(saved);


        if (
            typeof data.score !==
            "number" ||

            typeof data.playerLane !==
            "number"
        ) {

            return null;
        }


        return data;

    } catch (error) {

        console.error(
            "GENGA: Gespeichertes Spiel konnte nicht geladen werden.",
            error
        );


        return null;
    }
}


/* =========================================
   GESPEICHERTES SPIEL LÖSCHEN
========================================= */

function deleteSavedGame() {

    try {

        localStorage.removeItem(
            SAVE_KEY
        );

        console.log(
            "GENGA: Gespeicherter Lauf gelöscht."
        );

    } catch (error) {

        console.error(
            "GENGA: Gespeicherter Lauf konnte nicht gelöscht werden.",
            error
        );
    }
}


/* =========================================
   SPIEL STARTEN
========================================= */

function startGame() {

    console.log(
        "GENGA: Neues Spiel startet"
    );


    /*
       Alten gespeicherten Lauf bewusst
       verwerfen.
    */

    deleteSavedGame();


    gameRunning = false;

    gamePaused = false;

    score = 0;

    playerLane = 1;

    scoreTimer = 0;


    /* =====================================
       SPIELER
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


    /* =====================================
       HINDERNISSE
    ===================================== */

    if (
        typeof resetObstacles ===
        "function"
    ) {

        resetObstacles();
    }


    /* =====================================
       SCORE
    ===================================== */

    updateScoreDisplay();


    /* =====================================
       GAME OVER VERSTECKEN
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
       PAUSE VERSTECKEN
    ===================================== */

    hidePauseScreen();


    /* =====================================
       START SCREEN VERSTECKEN
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


    /*
       Jetzt läuft das Spiel.
    */

    gameRunning = true;


    updatePauseButton();


    console.log(
        "GENGA: Spiel läuft"
    );
}


/* =========================================
   GESPEICHERTES SPIEL FORTSETZEN
========================================= */

function continueSavedGame() {

    const saved =
        loadSavedGame();


    if (!saved) {

        startGame();

        return;
    }


    console.log(
        "GENGA: Gespeicherten Lauf fortsetzen"
    );


    gameRunning = false;

    gamePaused = false;


    score =
        Math.max(
            0,
            Math.floor(
                saved.score
            )
        );


    playerLane =
        Math.max(
            0,
            Math.min(
                2,
                Math.floor(
                    saved.playerLane
                )
            )
        );


    scoreTimer = 0;


    /* =====================================
       SPIELER
    ===================================== */

    if (player) {

        player.position.x =
            lanePositions[
                playerLane
            ];

        player.position.y = 0.9;

        player.position.z = 3;

        player.rotation.set(
            0,
            0,
            0
        );
    }


    /* =====================================
       HINDERNISSE
    ===================================== */

    if (
        typeof resetObstacles ===
        "function"
    ) {

        resetObstacles();
    }


    /* =====================================
       SCORE
    ===================================== */

    updateScoreDisplay();


    /* =====================================
       SCREENS
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


    const gameOverScreen =
        document.getElementById(
            "gameOverScreen"
        );


    if (gameOverScreen) {

        gameOverScreen.classList.add(
            "hidden"
        );
    }


    hidePauseScreen();


    /*
       Spiel läuft wieder.
    */

    gameRunning = true;


    updatePauseButton();
}


/* =========================================
   SCORE ANZEIGE
========================================= */

function updateScoreDisplay() {

    const scoreElement =
        document.getElementById(
            "score"
        );


    if (scoreElement) {

        scoreElement.textContent =
            Math.floor(score);
    }


    const finalScoreElement =
        document.getElementById(
            "finalScore"
        );


    if (finalScoreElement) {

        finalScoreElement.textContent =
            Math.floor(score);
    }
}


/* =========================================
   PAUSE
========================================= */

function pauseGame() {

    if (!gameRunning) {

        return;
    }


    console.log(
        "GENGA: Spiel pausiert"
    );


    gameRunning = false;

    gamePaused = true;


    saveGame();


    showPauseScreen();

    updatePauseButton();
}


/* =========================================
   FORTSETZEN
========================================= */

function resumeGame() {

    if (!gamePaused) {

        return;
    }


    console.log(
        "GENGA: Spiel fortgesetzt"
    );


    gamePaused = false;

    gameRunning = true;


    hidePauseScreen();

    updatePauseButton();
}


/* =========================================
   PAUSE SCREEN
========================================= */

function showPauseScreen() {

    const pauseScreen =
        document.getElementById(
            "pauseScreen"
        );


    if (pauseScreen) {

        pauseScreen.classList.remove(
            "hidden"
        );
    }
}


function hidePauseScreen() {

    const pauseScreen =
        document.getElementById(
            "pauseScreen"
        );


    if (pauseScreen) {

        pauseScreen.classList.add(
            "hidden"
        );
    }
}


/* =========================================
   PAUSE BUTTON
========================================= */

function updatePauseButton() {

    const pauseButton =
        document.getElementById(
            "pauseButton"
        );


    if (!pauseButton) {

        return;
    }


    if (gameRunning) {

        pauseButton.textContent =
            "⏸";

        pauseButton.setAttribute(
            "aria-label",
            "Spiel pausieren"
        );

    } else {

        pauseButton.textContent =
            "▶";

        pauseButton.setAttribute(
            "aria-label",
            "Spiel fortsetzen"
        );
    }
}


/* =========================================
   SCORE
========================================= */

function updateGame(delta) {

    if (!gameRunning) {

        return;
    }


    scoreTimer += delta;


    if (
        scoreTimer >= 1
    ) {

        score += 1;

        scoreTimer -= 1;


        updateScoreDisplay();
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

    gamePaused = false;


    /*
       Ein abgeschlossener Lauf ist kein
       fortsetzbarer Lauf mehr.
    */

    deleteSavedGame();


    const finalScoreElement =
        document.getElementById(
            "finalScore"
        );


    if (finalScoreElement) {

        finalScoreElement.textContent =
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


    hidePauseScreen();

    updatePauseButton();
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
            (
                time -
                scoreLastTime
            ) / 1000,
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
   SEITENWECHSEL / APP VERLASSEN
========================================= */

function saveBeforeLeaving() {

    if (
        gameRunning ||
        gamePaused
    ) {

        saveGame();
    }
}


/*
   Wird ausgelöst, wenn die Seite verlassen
   oder im Hintergrund angehalten wird.
*/

window.addEventListener(
    "pagehide",
    saveBeforeLeaving
);


document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.visibilityState ===
            "hidden"
        ) {

            saveBeforeLeaving();
        }
    }
);


/* =========================================
   STARTSCREEN
========================================= */

function setupStartScreen() {

    const startButton =
        document.getElementById(
            "startButton"
        );


    const continueButton =
        document.getElementById(
            "continueButton"
        );


    const saved =
        loadSavedGame();


    /*
       Es gibt einen gespeicherten Lauf.
    */

    if (saved) {

        if (startButton) {

            startButton.textContent =
                "Neues Spiel";
        }


        if (continueButton) {

            continueButton.classList.remove(
                "hidden"
            );

            continueButton.textContent =
                "Fortsetzen";
        }

    } else {

        if (startButton) {

            startButton.textContent =
                "Neues Spiel";
        }


        if (continueButton) {

            continueButton.classList.add(
                "hidden"
            );
        }
    }
}


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


    const continueButton =
        document.getElementById(
            "continueButton"
        );


    const pauseButton =
        document.getElementById(
            "pauseButton"
        );


    const resumeButton =
        document.getElementById(
            "resumeButton"
        );


    /* =====================================
       NEUES SPIEL
    ===================================== */

    if (startButton) {

        startButton.onclick =
            function (event) {

                event.preventDefault();

                startGame();
            };
    }


    /* =====================================
       RESTART
    ===================================== */

    if (restartButton) {

        restartButton.onclick =
            function (event) {

                event.preventDefault();

                startGame();
            };
    }


    /* =====================================
       FORTSETZEN
    ===================================== */

    if (continueButton) {

        continueButton.onclick =
            function (event) {

                event.preventDefault();

                continueSavedGame();
            };
    }


    /* =====================================
       PAUSE
    ===================================== */

    if (pauseButton) {

        pauseButton.onclick =
            function (event) {

                event.preventDefault();

                if (gameRunning) {

                    pauseGame();

                } else if (gamePaused) {

                    resumeGame();
                }
            };
    }


    /* =====================================
       PAUSE SCREEN FORTSETZEN
    ===================================== */

    if (resumeButton) {

        resumeButton.onclick =
            function (event) {

                event.preventDefault();

                resumeGame();
            };
    }


    setupStartScreen();

    updatePauseButton();
}


/* =========================================
   BUTTON INITIALISIERUNG
========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        setupGameButtons,
        { once: true }
    );

} else {

    setupGameButtons();
}
