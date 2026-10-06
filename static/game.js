// static/game.js
(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const DIFF_SPEED = { easy: 3, normal: 5, hard: 7, insane: 10 };
  const DIFF_SPAWN = { easy: 90, normal: 65, hard: 45, insane: 30 };

  let state = null;
  let raf = null;
  let W = 0;
  let H = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    console.log("[game] resize", W, H, "dpr", dpr);
  }

  window.addEventListener("resize", () => {
    resize();
    if (state) {
      state.player.y = H * 0.75;
    }
  });

  function makePlayer() {
    const size = Math.min(W, H) * 0.09;
    return {
      x: W / 2,
      y: H * 0.75,
      size,
      targetX: W / 2,
    };
  }

  function spawnBlock() {
    const size = Math.random() * 40 + 40;
    return {
      x: Math.random() * (W - size),
      y: -size,
      size,
      speed: DIFF_SPEED[state.difficulty] * (1 + Math.random() * 0.5),
      color: ["#ff4d4d", "#ffaa00", "#a04dff", "#ff66aa"][Math.floor(Math.random() * 4)],
    };
  }

  function onPointer(e) {
    if (!state || !state.running) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    state.player.targetX = clientX - rect.left;
  }

  function onKey(e) {
    if (!state || !state.running) return;
    if (e.key === "ArrowLeft" || e.key === "a") state.input.left = e.type === "keydown";
    if (e.key === "ArrowRight" || e.key === "d") state.input.right = e.type === "keydown";
  }

  function update(dt) {
    const p = state.player;

    if (state.input.left) p.targetX -= 12;
    if (state.input.right) p.targetX += 12;

    p.x += (p.targetX - p.x) * 0.2;
    if (p.x < p.size / 2) p.x = p.size / 2;
    if (p.x > W - p.size / 2) p.x = W - p.size / 2;

    state.frame++;
    if (state.frame % state.spawnEvery === 0) {
      state.blocks.push(spawnBlock());
    }

    for (let i = state.blocks.length - 1; i >= 0; i--) {
      const b = state.blocks[i];
      b.y += b.speed * dt * 0.06;

      if (b.y > H) {
        state.blocks.splice(i, 1);
        state.score += 1;
        state.coins += 1;
        if (state.onScore) state.onScore(state.score, state.coins);
        continue;
      }

      if (
        b.x < p.x + p.size / 2 &&
        b.x + b.size > p.x - p.size / 2 &&
        b.y < p.y + p.size / 2 &&
        b.y + b.size > p.y - p.size / 2
      ) {
        end();
        return;
      }
    }
  }

  function draw() {
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(0,229,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    state.blocks.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.size, b.size);
    });

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
    console.log("[game] end", res);
    if (state.onEnd) state.onEnd(res);
  }

  function start(opts) {
    console.log("[game] start", opts);
    canvas.classList.remove("hidden");
    resize();

    state = {
      running: true,
      paused: false,
      score: 0,
      coins: 0,
      difficulty: opts.difficulty || "normal",
      player: makePlayer(),
      blocks: [],
      frame: 0,
      spawnEvery: DIFF_SPAWN[opts.difficulty] || 65,
      lastTime: performance.now(),
      onScore: opts.onScore,
      onEnd: opts.onEnd,
      onPause: opts.onPause,
      input: { left: false, right: false },
    };

    console.log("[game] state initialized, W:", W, "H:", H, "player:", state.player);

    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointermove", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    if (state.onScore) state.onScore(0, 0);
    loop();
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
  console.log("[game] GengaGame loaded");
})();
