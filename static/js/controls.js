/* =========================================
   GENGA SURFER
   TOUCH / SWIPE CONTROLS
========================================= */

let playerLane = 1;

let touchStartX = 0;

let touchStartY = 0;

let touchStartTime = 0;


/* =========================================
   LANE
========================================= */

function movePlayerLeft() {

    if (
        typeof gameRunning !==
        "undefined" &&
        !gameRunning
    ) {
        return;
    }


    if (
        typeof gamePaused !==
        "undefined" &&
        gamePaused
    ) {
        return;
    }


    if (
        playerLane > 0
    ) {

        playerLane--;
    }
}


function movePlayerRight() {

    if (
        typeof gameRunning !==
        "undefined" &&
        !gameRunning
    ) {
        return;
    }


    if (
        typeof gamePaused !==
        "undefined" &&
        gamePaused
    ) {
        return;
    }


    if (
        playerLane < 2
    ) {

        playerLane++;
    }
}


/* =========================================
   TOUCH START
========================================= */

document.addEventListener(
    "touchstart",
    event => {

        if (
            !event.touches ||
            !event.touches.length
        ) {
            return;
        }


        touchStartX =
            event.touches[0].clientX;


        touchStartY =
            event.touches[0].clientY;


        touchStartTime =
            performance.now();
    },
    {
        passive: true
    }
);


/* =========================================
   TOUCH END
========================================= */

document.addEventListener(
    "touchend",
    event => {

        if (
            typeof gameRunning !==
            "undefined" &&
            !gameRunning
        ) {
            return;
        }


        if (
            typeof gamePaused !==
            "undefined" &&
            gamePaused
        ) {
            return;
        }


        if (
            !event.changedTouches ||
            !event.changedTouches.length
        ) {
            return;
        }


        const touch =
            event.changedTouches[0];


        const endX =
            touch.clientX;


        const endY =
            touch.clientY;


        const deltaX =
            endX -
            touchStartX;


        const deltaY =
            endY -
            touchStartY;


        const elapsed =
            performance.now() -
            touchStartTime;


        /*
         * Kein Wischen:
         * ignorieren.
         */

        if (
            elapsed > 700
        ) {
            return;
        }


        if (
            Math.abs(deltaX) < 35
        ) {
            return;
        }


        /*
         * Nur horizontale
         * Bewegungen.
         */

        if (
            Math.abs(deltaX) <
            Math.abs(deltaY)
        ) {
            return;
        }


        if (
            deltaX < 0
        ) {

            movePlayerLeft();

        } else {

            movePlayerRight();
        }
    },
    {
        passive: true
    }
);


/* =========================================
   KEYBOARD
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "ArrowLeft"
        ) {

            movePlayerLeft();
        }


        if (
            event.key ===
            "ArrowRight"
        ) {

            movePlayerRight();
        }


        if (
            event.key ===
            " " &&
            typeof gameRunning !==
            "undefined" &&
            gameRunning
        ) {

            if (
                typeof gamePaused !==
                "undefined" &&
                gamePaused
            ) {

                if (
                    typeof resumeGame ===
                    "function"
                ) {

                    resumeGame();
                }

            } else {

                if (
                    typeof pauseGame ===
                    "function"
                ) {

                    pauseGame();
                }
            }
        }
    }
);
