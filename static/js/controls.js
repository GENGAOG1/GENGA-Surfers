let touchStartX = null;


/* =========================================
   SWIPE START
========================================= */

document
    .getElementById("gameCanvas")
    .addEventListener(
        "touchstart",
        event => {

            if (!gameRunning) {
                return;
            }

            touchStartX =
                event.touches[0].clientX;

        },
        {
            passive: true
        }
    );


/* =========================================
   SWIPE ENDE
========================================= */

document
    .getElementById("gameCanvas")
    .addEventListener(
        "touchend",
        event => {

            if (
                !gameRunning ||
                touchStartX === null
            ) {

                touchStartX = null;

                return;
            }


            const endX =
                event.changedTouches[0].clientX;


            const difference =
                endX - touchStartX;


            if (
                Math.abs(difference) < 40
            ) {

                touchStartX = null;

                return;
            }


            /*
               Nach links
            */

            if (
                difference < 0
            ) {

                playerLane =
                    Math.max(
                        0,
                        playerLane - 1
                    );
            }


            /*
               Nach rechts
            */

            else {

                playerLane =
                    Math.min(
                        2,
                        playerLane + 1
                    );
            }


            /*
               Spieler weich zur
               neuen Spur bewegen
            */

            if (player) {

                player.position.x =
                    lanePositions[
                        playerLane
                    ];
            }


            touchStartX = null;

        },
        {
            passive: true
        }
    );
