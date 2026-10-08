/* =========================================================
   GENGA SURFER
   THREE.JS 3D ENGINE
========================================================= */

let scene;
let camera;
let renderer;

let player;

const lanePositions = [-2, 0, 2];

let playerLane = 1;
let targetPlayerX = 0;

let obstacleObjects = [];
let coinObjects = [];

let lastRowWasSingle = false;

const SPAWN_Z = -105;
const ROW_DISTANCE = 24;

const roadLength = 320;

let initialized3D = false;


/* =========================================================
   INITIALIZATION
========================================================= */

function init3D() {
  if (initialized3D) {
    return;
  }

  initialized3D = true;

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x06101f);

  scene.fog = new THREE.Fog(
    0x06101f,
    45,
    155
  );

  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );

  /*
    Kamera bleibt komplett stabil.
    Kein Wackeln und kein automatisches Hin- und Herbewegen.
  */
  camera.position.set(
    0,
    5.8,
    11
  );

  camera.lookAt(
    0,
    1,
    -22
  );

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  document
    .getElementById("gameContainer")
    .appendChild(renderer.domElement);

  createLights();
  createWorld();
  createPlayer();

  reset3DRun();

  window.addEventListener(
    "resize",
    resize3D
  );

  animate3D();
}


/* =========================================================
   LIGHTS
========================================================= */

function createLights() {
  const ambient = new THREE.AmbientLight(
    0xffffff,
    1.2
  );

  scene.add(ambient);

  const directional =
    new THREE.DirectionalLight(
      0xffffff,
      1.6
    );

  directional.position.set(
    4,
    12,
    8
  );

  scene.add(directional);
}


/* =========================================================
   WORLD
========================================================= */

function createWorld() {
  const roadGeometry =
    new THREE.PlaneGeometry(
      8,
      roadLength
    );

  const roadMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x202936,
      roughness: 0.9
    });

  const road =
    new THREE.Mesh(
      roadGeometry,
      roadMaterial
    );

  road.rotation.x = -Math.PI / 2;

  road.position.set(
    0,
    0,
    -90
  );

  scene.add(road);


  /*
    Seitliche Flächen
  */

  const sideGeometry =
    new THREE.PlaneGeometry(
      100,
      roadLength
    );

  const sideMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x0a1725
    });

  const leftSide =
    new THREE.Mesh(
      sideGeometry,
      sideMaterial
    );

  leftSide.rotation.x = -Math.PI / 2;

  leftSide.position.set(
    -54,
    -0.03,
    -90
  );

  scene.add(leftSide);

  const rightSide =
    leftSide.clone();

  rightSide.position.x = 54;

  scene.add(rightSide);


  /*
    Fahrbahnlinien
  */

  const lineMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x758092
    });

  [-1, 1].forEach(x => {
    const line =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          0.07,
          roadLength
        ),
        lineMaterial
      );

    line.rotation.x = -Math.PI / 2;

    line.position.set(
      x,
      0.012,
      -90
    );

    scene.add(line);
  });
}


/* =========================================================
   PLAYER
========================================================= */

function createPlayer() {
  const geometry =
    new THREE.BoxGeometry(
      1.15,
      1.7,
      1.15
    );

  const material =
    new THREE.MeshStandardMaterial({
      color:
        typeof getSelectedSkinColor === "function"
          ? getSelectedSkinColor()
          : 0x2196f3,

      roughness: 0.55
    });

  player =
    new THREE.Mesh(
      geometry,
      material
    );

  player.position.set(
    0,
    0.9,
    3
  );

  scene.add(player);
}

function applyPlayerSkin() {
  if (!player) {
    return;
  }

  if (
    typeof getSelectedSkinColor ===
    "function"
  ) {
    player.material.color.setHex(
      getSelectedSkinColor()
    );
  }
}


/* =========================================================
   OBSTACLES
========================================================= */

function createObstacle(
  lane,
  z,
  color = null
) {
  const geometry =
    new THREE.BoxGeometry(
      1.55,
      1.7,
      1.55
    );

  const material =
    new THREE.MeshStandardMaterial({
      color:
        color !== null
          ? color
          : randomObstacleColor(),

      roughness: 0.7
    });

  const obstacle =
    new THREE.Mesh(
      geometry,
      material
    );

  obstacle.position.set(
    lanePositions[lane],
    0.85,
    z
  );

  obstacle.userData.lane = lane;

  scene.add(obstacle);

  obstacleObjects.push(obstacle);

  return obstacle;
}

function randomObstacleColor() {
  const colors = [
    0xff4d5a,
    0xff8c42,
    0xffd23f,
    0xd946ef
  ];

  return colors[
    Math.floor(
      Math.random() * colors.length
    )
  ];
}

function spawnObstacleRow(z) {
  /*
    Meistens zwei Blöcke.
    Ein Block ist deutlich seltener.
    Zwei Einzelreihen hintereinander
    werden verhindert.
  */

  let single =
    Math.random() < 0.20;

  if (lastRowWasSingle) {
    single = false;
  }

  if (single) {
    const lane =
      Math.floor(
        Math.random() * 3
      );

    createObstacle(
      lane,
      z
    );

    lastRowWasSingle = true;

    /*
      Zwei freie Fahrspuren.
    */
    return [lane];
  }

  /*
    Genau zwei von drei Spuren blockieren.
    Eine Spur bleibt sicher.
  */

  const safeLane =
    Math.floor(
      Math.random() * 3
    );

  for (let lane = 0; lane < 3; lane++) {
    if (lane !== safeLane) {
      createObstacle(
        lane,
        z
      );
    }
  }

  lastRowWasSingle = false;

  return [
    0,
    1,
    2
  ].filter(
    lane => lane !== safeLane
  );
}


/* =========================================================
   COINS
========================================================= */

function createCoin(
  lane,
  z
) {
  const geometry =
    new THREE.TorusGeometry(
      0.32,
      0.095,
      8,
      20
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0xffd83d,
      metalness: 0.75,
      roughness: 0.25
    });

  const coin =
    new THREE.Mesh(
      geometry,
      material
    );

  coin.rotation.x =
    Math.PI / 2;

  coin.position.set(
    lanePositions[lane],
    1.35,
    z
  );

  coin.userData.lane = lane;

  scene.add(coin);

  coinObjects.push(coin);

  return coin;
}

function spawnCoinPattern(
  z,
  blockedLanes
) {
  /*
    Finde eine sichere Spur.
  */

  const safeLanes =
    [0, 1, 2].filter(
      lane =>
        !blockedLanes.includes(lane)
    );

  if (safeLanes.length === 0) {
    return;
  }

  const lane =
    safeLanes[
      Math.floor(
        Math.random() *
        safeLanes.length
      )
    ];

  /*
    Meistens eine kleine Coin-Linie.
  */

  const amount =
    Math.random() < 0.2
      ? 1
      : 3;

  for (let i = 0; i < amount; i++) {
    createCoin(
      lane,
      z - i * 2.2
    );
  }

  /*
    Manchmal noch ein Coin
    auf einer benachbarten Spur.
  */

  if (
    amount >= 3 &&
    Math.random() < 0.35
  ) {
    const alternatives =
      safeLanes.filter(
        value => value !== lane
      );

    if (alternatives.length) {
      const other =
        alternatives[
          Math.floor(
            Math.random() *
            alternatives.length
          )
        ];

      createCoin(
        other,
        z - 4.4
      );
    }
  }
}


/* =========================================================
   RESET
========================================================= */

function clearObstacles() {
  obstacleObjects.forEach(
    obstacle => {
      scene.remove(obstacle);
      obstacle.geometry.dispose();
      obstacle.material.dispose();
    }
  );

  obstacleObjects = [];
}

function clearCoins() {
  coinObjects.forEach(
    coin => {
      scene.remove(coin);
      coin.geometry.dispose();
      coin.material.dispose();
    }
  );

  coinObjects = [];
}

function reset3DRun() {
  clearObstacles();
  clearCoins();

  playerLane = 1;
  targetPlayerX =
    lanePositions[1];

  if (player) {
    player.position.set(
      0,
      0.9,
      3
    );

    applyPlayerSkin();
  }

  lastRowWasSingle = false;

  /*
    Startreihe bis weit nach hinten.
  */

  for (
    let i = 0;
    i < 8;
    i++
  ) {
    const z =
      SPAWN_Z -
      i * ROW_DISTANCE;

    const blocked =
      spawnObstacleRow(z);

    spawnCoinPattern(
      z - 8,
      blocked
    );
  }
}


/* =========================================================
   ENDLESS SPAWNING
========================================================= */

function updateSpawning() {
  if (!obstacleObjects.length) {
    return;
  }

  let furthestZ =
    obstacleObjects[0].position.z;

  for (
    const obstacle of obstacleObjects
  ) {
    if (
      obstacle.position.z <
      furthestZ
    ) {
      furthestZ =
        obstacle.position.z;
    }
  }

  /*
    Sobald die letzte Reihe näher
    als -130 kommt, wird hinten
    eine neue Reihe erzeugt.

    Dadurch laufen Coins und Hindernisse
    unbegrenzt weiter.
  */

  while (
    furthestZ > -135
  ) {
    furthestZ -=
      ROW_DISTANCE;

    const blocked =
      spawnObstacleRow(
        furthestZ
      );

    spawnCoinPattern(
      furthestZ - 8,
      blocked
    );
  }
}


/* =========================================================
   MOVEMENT
========================================================= */

function updatePlayer(delta) {
  if (!player) {
    return;
  }

  targetPlayerX =
    lanePositions[playerLane];

  /*
    Weiche Spurbewegung.
  */

  const difference =
    targetPlayerX -
    player.position.x;

  player.position.x +=
    difference *
    Math.min(
      1,
      delta * 13
    );
}


/* =========================================================
   OBSTACLE UPDATE
========================================================= */

function updateObstacles(delta) {
  if (
    typeof gameRunning ===
      "undefined" ||
    !gameRunning ||
    gamePaused
  ) {
    return;
  }

  const speed =
    typeof getCurrentGameSpeed ===
    "function"
      ? getCurrentGameSpeed()
      : 12;

  for (
    let i =
      obstacleObjects.length - 1;
    i >= 0;
    i--
  ) {
    const obstacle =
      obstacleObjects[i];

    obstacle.position.z +=
      speed * delta;

    /*
      Kollision.
    */

    if (
      Math.abs(
        obstacle.position.x -
        player.position.x
      ) < 0.95 &&
      Math.abs(
        obstacle.position.z -
        player.position.z
      ) < 1.15
    ) {
      if (
        typeof consumeExtraLife ===
        "function" &&
        consumeExtraLife()
      ) {
        removeObstacle(i);
        continue;
      }

      if (
        typeof endGame ===
        "function"
      ) {
        endGame();
      }

      return;
    }

    /*
      Hinter der Kamera löschen.
    */

    if (
      obstacle.position.z > 14
    ) {
      removeObstacle(i);
    }
  }
}

function removeObstacle(index) {
  const obstacle =
    obstacleObjects[index];

  if (!obstacle) {
    return;
  }

  scene.remove(obstacle);

  obstacle.geometry.dispose();
  obstacle.material.dispose();

  obstacleObjects.splice(
    index,
    1
  );
}


/* =========================================================
   COIN UPDATE
========================================================= */

function updateCoins(delta) {
  if (
    typeof gameRunning ===
      "undefined" ||
    !gameRunning ||
    gamePaused
  ) {
    return;
  }

  const speed =
    typeof getCurrentGameSpeed ===
    "function"
      ? getCurrentGameSpeed()
      : 12;

  for (
    let i =
      coinObjects.length - 1;
    i >= 0;
    i--
  ) {
    const coin =
      coinObjects[i];

    coin.position.z +=
      speed * delta;

    coin.rotation.z +=
      delta * 7;

    /*
      Coin-Kollision.
    */

    if (
      Math.abs(
        coin.position.x -
        player.position.x
      ) < 0.9 &&
      Math.abs(
        coin.position.z -
        player.position.z
      ) < 1.1
    ) {
      collectCoin(i);
      continue;
    }

    if (
      coin.position.z > 14
    ) {
      removeCoin(i);
    }
  }
}

function collectCoin(index) {
  const coin =
    coinObjects[index];

  if (!coin) {
    return;
  }

  scene.remove(coin);

  coin.geometry.dispose();
  coin.material.dispose();

  coinObjects.splice(
    index,
    1
  );

  if (
    typeof addCoins ===
    "function"
  ) {
    addCoins(1);
  }

  /*
    Kleiner Score-Bonus.
  */

  if (
    typeof score !==
    "undefined"
  ) {
    score += 5;
  }
}

function removeCoin(index) {
  const coin =
    coinObjects[index];

  if (!coin) {
    return;
  }

  scene.remove(coin);

  coin.geometry.dispose();
  coin.material.dispose();

  coinObjects.splice(
    index,
    1
  );
}


/* =========================================================
   RUN SNAPSHOT
========================================================= */

function get3DRunSnapshot() {
  return {
    playerLane,

    obstacles:
      obstacleObjects.map(
        obstacle => ({
          lane:
            obstacle.userData.lane,
          z:
            obstacle.position.z,
          color:
            obstacle.material.color.getHex()
        })
      ),

    coins:
      coinObjects.map(
        coin => ({
          lane:
            coin.userData.lane,
          z:
            coin.position.z
        })
      )
  };
}

function restore3DRun(snapshot) {
  clearObstacles();
  clearCoins();

  playerLane =
    Number.isInteger(
      snapshot.playerLane
    )
      ? snapshot.playerLane
      : 1;

  playerLane =
    Math.max(
      0,
      Math.min(
        2,
        playerLane
      )
    );

  targetPlayerX =
    lanePositions[playerLane];

  player.position.x =
    targetPlayerX;

  snapshot.obstacles
    .forEach(obstacle => {
      createObstacle(
        obstacle.lane,
        obstacle.z,
        obstacle.color
      );
    });

  snapshot.coins
    .forEach(coin => {
      createCoin(
        coin.lane,
        coin.z
      );
    });

  lastRowWasSingle = false;
}


/* =========================================================
   RESIZE
========================================================= */

function resize3D() {
  if (!camera || !renderer) {
    return;
  }

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
}


/* =========================================================
   MAIN 3D LOOP
========================================================= */

let previousTime = 0;

function animate3D(time = 0) {
  requestAnimationFrame(
    animate3D
  );

  const delta =
    Math.min(
      (time - previousTime) /
        1000,
      0.05
    );

  previousTime = time;

  if (
    typeof gameRunning !==
      "undefined" &&
    gameRunning &&
    !gamePaused
  ) {
    updatePlayer(delta);
    updateObstacles(delta);
    updateCoins(delta);
    updateSpawning();

    if (
      typeof updateGame ===
      "function"
    ) {
      updateGame(delta);
    }
  }

  if (renderer && scene && camera) {
    renderer.render(
      scene,
      camera
    );
  }
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    init3D();
  }
);
