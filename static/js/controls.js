
document.addEventListener("keydown", event => {
  if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    movePlayerLeft();
  } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    movePlayerRight();
  } else if (event.key.toLowerCase() === "p" || event.key === "Escape") {
    if (typeof togglePause === "function") togglePause();
  }
});

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", event => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

document.addEventListener("touchend", event => {
  if (!gameRunning || gamePaused) return;

  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) movePlayerLeft();
    else movePlayerRight();
  }
}, { passive: true });
