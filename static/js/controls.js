/* =========================================================
   GENGA SURFER
   CONTROLS
========================================================= */

let touchStartX = 0;
let touchStartY = 0;

let touchActive = false;


/* =========================================================
   LANE MOVEMENT
========================================================= */

function movePlayerLeft() {
  if (
    typeof gameRunning ===
      "undefined" ||
    !gameRunning ||
    gamePaused
  ) {
    return;
  }

  playerLane =
    Math.max(
      0,
      playerLane - 1
    );
}

function movePlayerRight() {
  if (
    typeof gameRunning ===
      "undefined" ||
    !gameRunning ||
    gamePaused
  ) {
    return;
  }

  playerLane =
    Math.min(
      2,
      playerLane + 1
    );
}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "ArrowLeft" ||
      event.key.toLowerCase() === "a"
    ) {
      event.preventDefault();

      movePlayerLeft();
    }

    if (
      event.key === "ArrowRight" ||
      event.key.toLowerCase() === "d"
    ) {
      event.preventDefault();

      movePlayerRight();
    }

    if (
      event.key === "Escape" ||
      event.key.toLowerCase() === "p"
    ) {
      if (
        typeof togglePause ===
        "function"
      ) {
        togglePause();
      }
    }
  }
);


/* =========================================================
   TOUCH / SWIPE
========================================================= */

document.addEventListener(
  "touchstart",
  event => {
    if (
      !event.touches ||
      !event.touches.length
    ) {
      return;
    }

    touchActive = true;

    touchStartX =
      event.touches[0].clientX;

    touchStartY =
      event.touches[0].clientY;
  },
  {
    passive: true
  }
);

document.addEventListener(
  "touchend",
  event => {
    if (
      !touchActive ||
      !event.changedTouches ||
      !event.changedTouches.length
    ) {
      return;
    }

    touchActive = false;

    const endX =
      event.changedTouches[0].clientX;

    const endY =
      event.changedTouches[0].clientY;

    const deltaX =
      endX - touchStartX;

    const deltaY =
      endY - touchStartY;

    /*
      Nur deutliche horizontale Swipes.
    */

    if (
      Math.abs(deltaX) < 35
    ) {
      return;
    }

    if (
      Math.abs(deltaX) <
      Math.abs(deltaY)
    ) {
      return;
    }

    if (deltaX < 0) {
      movePlayerLeft();
    } else {
      movePlayerRight();
    }
  },
  {
    passive: true
  }
);
