// Einfaches Block-Ausweichspiel auf Canvas
(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const DIFF_SPEED = { easy: 3, normal: 5, hard: 7, insane: 10 };
  const DIFF_SPAWN = { easy: 90, normal: 65, hard: 45, insane: 30 };

  let state = null;
  let raf = null;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);

  function makePlayer(w, h) {
    const size = Math.min(w, h) * 0.09;
    return {
      x: w / 2,
      y: h * 0.75,
      size,
      speed: 0.6,
      targetX: w / 2,
    };
  }

  function spawnBlock(w, h, difficulty) {
    const size = Math.random() * 40 + 40;
    return {
      x: Math.random() * (w - size),
      y: -size,
      size,
      speed: DIFF_SPEED[difficulty] * (1 + Math.random() * 0.5),
      color: ["#ff4d4d", "#ffaa00", "#a04dff", "#ff66aa"][Math.floor(Math.random() * 4)],
    };
  }

  function start(opts) {
    canvas.classList.remove("hidden");
    resize();

    state = {
      running: true,
      paused: false,
      score: 0,
      coins: 0,
      difficulty: opts.difficulty || "normal",
      player: makePlayer(canvas.width, canvas.height),
      blocks: [],
      frame: 0,
      spawnEvery: DIFF_SPAWN[opts.difficulty] || 65,
      lastTime: performance.now(),
      onScore: opts.onScore,
      onEnd: opts.onEnd,
      onPause: opts.onPause,
      input: { left: false, right: false },
    };

    // Touch/Maus-Steuerung
    canvas.addEventListener("pointerdown", onPointer, { passive: true });
    canvas.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    loop();
  }

  function onPointer(e) {
    if (!state || !state.running) return;
    const rect = canvas.getBoundingClientRect();
    state.player.targetX = e.clientX - rect.left;
  }

  function onKey(e) {
    if (!state || !state.running) return;
    if (e.key === "ArrowLeft" || e.key === "a") state.input.left = e.type === "keydown";
    if (e.key === "ArrowRight" || e.key === "d") state.input.right = e.type === "keydown";
  }

  function update(dt) {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const p = state.player;

    // Tastatur
    if (state.input.left) p.targetX -= 12;
    if (state.input.right) p.targetX += 12;

    // Sanft zum Ziel
    p.x += (p.targetX - p.x) * 0.2;
    if (p.x < p.size / 2) p.x = p.size / 2;
    if (p.x > w - p.size / 2) p.x = w - p.size / 2;

    // Spawn
    state.frame++;
    if (state.frame % state.spawnEvery === 0) {
      state.blocks.push(spawnBlock(w, h, state.difficulty));
    }

    // Bewegen + Kollision
    for (let i = state.blocks.length - 1; i >= 0; i--) {
      const b = state.blocks[i];
      b.y += b.speed * dt * 0.06;

      // Score wenn Block unten durch
      if (b.y > h) {
        state.blocks.splice(i, 1);
        state.score += 1;
        state.coins += 1;
        if (state.onScore) state.onScore(state.score, state.coins);
        continue;
      }

      // Kollision
      if (
        b.x < p.x + p.size / 2 &&
        b.x + b.size > p.x - p.size / 2 &&
        b.y < p.y + p.size / 2 &&
        b.y + b.size > p.y - p.size / 2
      ) {
        return end();
      }
    }
  }

  function draw() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, w, h);

    // Gitter als Hintergrund
    ctx.strokeStyle = "rgba(0,229,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Blöcke
    state.blocks.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.size, b.size);
    });

    // Spieler
    const p = state.player;
    ctx.fillStyle = "#00e5ff";
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 20;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.shadowBlur = 0;
  }

  function loop() {
    if (!state || !state.running) return;
    const now = performance.now();
    const dt = Math.min((now - state.lastTime) / 16.67, 3);
    state.lastTime = now;

    if (!state.paused) {
      update(dt);
      if (!state.running) return;
      draw();
    }

    raf = requestAnimationFrame(loop);
  }

  function end() {
    if (!state || !state.running) return;
    state.running = false;
    if (raf) cancelAnimationFrame(raf);
    const res = { score: state.score, coins: state.coins };
    if (state.onEnd) state.onEnd(res);
  }

  function pause() {
    if (!state || !state.running) return;
    state.paused = true;
    if (state.onPause) state.onPause();
  }

  function resume() {
    if (!state) return;
    state.paused = false;
    state.lastTime = performance.now();
  }

  function quit() {
    if (!state) return;
    state.running = false;
    if (raf) cancelAnimationFrame(raf);
    canvas.classList.add("hidden");
  }

  window.GengaGame = { start, pause, resume, quit };
})();
