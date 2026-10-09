/* =========================================================
   GENGA SURFER — 3D GAME
========================================================= */
let scene, camera, renderer, player;
let roadLines = [];
let obstacleObjects = [];
let coinObjects = [];
let sceneryObjects = [];
let playerLane = 1;
let targetPlayerX = 0;
let distanceUntilNextRow = 0;
let lastRowWasSingle = false;
let lastFrameTime = 0;
let threeReady = false;
const lanePositions = [-2, 0, 2];
const playerZ = 2;
const rowDistance = 24;
/* =========================================================
   INITIALIZATION
========================================================= */
function init3D() {
    if (threeReady) return;
    if (!window.THREE) {
        console.error("Three.js wurde nicht geladen.");
        return;
    }
    // Unterstützt beide HTML-Versionen
    const container =
        document.getElementById("gameContainer") ||
        document.getElementById("gameCanvas");
    if (!container) {
        console.error(
            "3D-Container fehlt: #gameContainer oder #gameCanvas"
        );
        return;
    }
    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x07111f);
        scene.fog = new THREE.Fog(0x07111f, 35, 150);
        camera = new THREE.PerspectiveCamera(
            62,
            window.innerWidth / window.innerHeight,
            0.1,
            250
        );
        camera.position.set(0, 5.8, 11);
        camera.lookAt(0, 1, -22);
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 2)
        );
        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.replaceChildren(renderer.domElement);
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        scene.add(
            new THREE.HemisphereLight(
                0xb8d9ff,
                0x152034,
                2.1
            )
        );
        const sun = new THREE.DirectionalLight(
            0xffffff,
            2.2
        );
        sun.position.set(-5, 12, 6);
        sun.castShadow = true;
        scene.add(sun);
        buildWorld();
        buildPlayer();
        reset3DRun();
        window.addEventListener("resize", resize3D);
        threeReady = true;
        lastFrameTime = performance.now();
        requestAnimationFrame(animate3D);
        console.log("Genga Surfer 3D erfolgreich gestartet.");
    } catch (error) {
        console.error(
            "Fehler beim Initialisieren der 3D-Welt:",
            error
        );
    }
}
/* =========================================================
   WORLD
========================================================= */
function buildWorld() {
    const road = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 230),
        new THREE.MeshStandardMaterial({
            color: 0x26364b,
            roughness: 0.9
        })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.12, -65);
    road.receiveShadow = true;
    scene.add(road);
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 260),
        new THREE.MeshStandardMaterial({
            color: 0x0c1a2b,
            roughness: 1
        })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.22, -65);
    scene.add(ground);
    // Straßenmarkierungen
    for (const x of [-1, 1]) {
        for (let z = 8; z > -150; z -= 8) {
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.055, 0.025, 3.5),
                new THREE.MeshBasicMaterial({
                    color: 0x7895b5
                })
            );
            line.position.set(x, -0.085, z);
            scene.add(line);
            roadLines.push(line);
        }
    }
    // Gebäude entlang der Strecke
    for (const x of [-6, 6]) {
        for (let z = -150; z < 10; z += 18) {
            const h = 2 + Math.random() * 7;
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, h, 3),
                new THREE.MeshStandardMaterial({
                    color:
                        Math.random() > 0.5
                            ? 0x142a43
                            : 0x1a304a,
                    roughness: 0.9
                })
            );
            building.position.set(
                x + (Math.random() - 0.5) * 2,
                h / 2 - 0.2,
                z
            );
            scene.add(building);
            sceneryObjects.push(building);
        }
    }
}
/* =========================================================
   PLAYER
========================================================= */
function buildPlayer() {
    const material = new THREE.MeshStandardMaterial({
        color: getSkinColorSafe(),
        roughness: 0.45,
        metalness: 0.1
    });
    player = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.25, 0.65),
        material
    );
    body.position.y = 0.85;
    body.castShadow = true;
    player.add(body);
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 20, 16),
        new THREE.MeshStandardMaterial({
            color: 0xffd1ad,
            roughness: 0.8
        })
    );
    head.position.y = 1.7;
    head.castShadow = true;
    player.add(head);
    const legsMaterial = new THREE.MeshStandardMaterial({
        color: 0x15243a
    });
    for (const x of [-0.23, 0.23]) {
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.55, 0.3),
            legsMaterial
        );
        leg.position.set(x, 0.28, 0);
        player.add(leg);
    }
    player.position.set(0, 0, playerZ);
    scene.add(player);
}
function getSkinColorSafe() {
    return typeof getSelectedSkinColor === "function"
        ? getSelectedSkinColor()
        : 0x2496ff;
}
function applyPlayerSkin() {
    if (!player) return;
    const body = player.children[0];
    if (body && body.material) {
        body.material.color.setHex(getSkinColorSafe());
    }
}
/* =========================================================
   DYNAMIC OBJECTS
========================================================= */
function clearDynamicObjects() {
    for (const item of [...obstacleObjects, ...coinObjects]) {
        scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        if (item.mesh.material) {
            item.mesh.material.dispose();
        }
    }
    obstacleObjects = [];
    coinObjects = [];
}
/* =========================================================
   RESET RUN
========================================================= */
function reset3DRun() {
    if (!scene || !player) return;
    clearDynamicObjects();
    playerLane = 1;
    targetPlayerX = 0;
    player.position.set(0, 0, playerZ);
    lastRowWasSingle = false;
    distanceUntilNextRow = rowDistance;
    spawnObstacleRow(-45);
    spawnObstacleRow(-69);
    spawnObstacleRow(-93);
    spawnCoinPattern(-57, [0, 1, 2]);
    applyPlayerSkin();
}
/* =========================================================
   OBSTACLES
========================================================= */
function spawnObstacleRow(z) {
    const roll = Math.random();
    let lanes;
    if (roll < 0.13) {
        lanes = [];
    } else {
        const single =
            Math.random() < 0.2 && !lastRowWasSingle;
        if (single) {
            lanes = [Math.floor(Math.random() * 3)];
            lastRowWasSingle = true;
        } else {
            const safeLane = Math.floor(Math.random() * 3);
            lanes = [0, 1, 2].filter(
                lane => lane !== safeLane
            );
            lastRowWasSingle = false;
        }
    }
    lanes.forEach(lane => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.25, 1.5, 1.1),
            new THREE.MeshStandardMaterial({
                color: [
                    0xff5b58,
                    0xffb23f,
                    0xe75b91
                ][Math.floor(Math.random() * 3)],
                roughness: 0.65
            })
        );
        mesh.position.set(
            lanePositions[lane],
            0.75,
            z
        );
        mesh.castShadow = true;
        scene.add(mesh);
        obstacleObjects.push({
            mesh,
            lane,
            hit: false
        });
    });
    const safeLanes = [0, 1, 2].filter(
        lane => !lanes.includes(lane)
    );
    if (safeLanes.length) {
        spawnCoinPattern(z - 5, safeLanes);
    }
}
/* =========================================================
   COINS
========================================================= */
function spawnCoinPattern(z, safeLanes) {
    if (!safeLanes.length) return;
    const lane =
        safeLanes[
            Math.floor(Math.random() * safeLanes.length)
        ];
    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(
            new THREE.TorusGeometry(
                0.28,
                0.09,
                8,
                18
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffd84a,
                emissive: 0x7a4a00,
                metalness: 0.7,
                roughness: 0.25
            })
        );
        mesh.position.set(
            lanePositions[lane],
            1.05,
            z - i * 1.6
        );
        mesh.rotation.x = Math.PI / 2;
        scene.add(mesh);
        coinObjects.push({
            mesh,
            lane,
            collected: false
        });
    }
}
/* =========================================================
   PLAYER MOVEMENT
========================================================= */
function movePlayerLeft() {
    if (!gameRunning || gamePaused) return;
    playerLane = Math.max(0, playerLane - 1);
    targetPlayerX = lanePositions[playerLane];
}
function movePlayerRight() {
    if (!gameRunning || gamePaused) return;
    playerLane = Math.min(2, playerLane + 1);
    targetPlayerX = lanePositions[playerLane];
}
function updatePlayer(delta) {
    if (!player) return;
    player.position.x +=
        (targetPlayerX - player.position.x) *
        Math.min(1, delta * 14);
}
/* =========================================================
   SPAWNING
========================================================= */
function updateSpawning(delta) {
    if (!gameRunning || gamePaused) return;
    distanceUntilNextRow -=
        getCurrentGameSpeed() * delta;
    while (distanceUntilNextRow <= 0) {
        spawnObstacleRow(-100);
        distanceUntilNextRow += rowDistance;
    }
}
/* =========================================================
   OBSTACLE COLLISIONS
========================================================= */
function updateObstacles(delta) {
    if (!gameRunning || gamePaused) return;
    const movement = getCurrentGameSpeed() * delta;
    for (const item of obstacleObjects) {
        item.mesh.position.z += movement;
        if (
            !item.hit &&
            item.mesh.position.z > 0.7 &&
            item.mesh.position.z < 3.4
        ) {
            if (item.lane === playerLane) {
                item.hit = true;
                if (
                    typeof consumeExtraLife === "function" &&
                    consumeExtraLife()
                ) {
                    item.mesh.position.z = 12;
                } else {
                    endGame();
                    return;
                }
            }
        }
    }
    obstacleObjects = obstacleObjects.filter(item => {
        if (item.mesh.position.z > 12) {
            scene.remove(item.mesh);
            item.mesh.geometry.dispose();
            item.mesh.material.dispose();
            return false;
        }
        return true;
    });
}
/* =========================================================
   COIN COLLECTION
========================================================= */
function updateCoins(delta) {
    if (!gameRunning || gamePaused) return;
    const movement = getCurrentGameSpeed() * delta;
    for (const item of coinObjects) {
        item.mesh.position.z += movement;
        item.mesh.rotation.z += delta * 3;
        if (
            !item.collected &&
            item.lane === playerLane &&
            Math.abs(item.mesh.position.z - playerZ) < 1.25
        ) {
            item.collected = true;
            if (typeof addCoins === "function") {
                addCoins(1);
            }
            score += 5;
            if (typeof updateScoreDisplay === "function") {
                updateScoreDisplay();
            }
            item.mesh.position.z = 15;
        }
    }
    coinObjects = coinObjects.filter(item => {
        if (item.mesh.position.z > 12) {
            scene.remove(item.mesh);
            item.mesh.geometry.dispose();
            item.mesh.material.dispose();
            return false;
        }
        return true;
    });
}
/* =========================================================
   SAVE / RESTORE RUN
========================================================= */
function get3DRunSnapshot() {
    return {
        playerLane,
        distanceUntilNextRow,
        lastRowWasSingle,
        obstacles: obstacleObjects.map(item => ({
            lane: item.lane,
            z: item.mesh.position.z,
            color: item.mesh.material.color.getHex(),
            hit: item.hit
        })),
        coins: coinObjects.map(item => ({
            lane: item.lane,
            z: item.mesh.position.z,
            collected: item.collected
        }))
    };
}
function restore3DRun(snapshot) {
    if (!scene || !player || !snapshot) return;
    clearDynamicObjects();
    playerLane = Math.max(
        0,
        Math.min(2, Number(snapshot.playerLane) || 1)
    );
    targetPlayerX = lanePositions[playerLane];
    player.position.x = targetPlayerX;
    distanceUntilNextRow =
        Number(snapshot.distanceUntilNextRow) || rowDistance;
    lastRowWasSingle = Boolean(snapshot.lastRowWasSingle);
    (snapshot.obstacles || []).forEach(item => {
        const lane = Math.max(
            0,
            Math.min(2, Number(item.lane) || 0)
        );
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.25, 1.5, 1.1),
            new THREE.MeshStandardMaterial({
                color: item.color || 0xff5b58
            })
        );
        mesh.position.set(
            lanePositions[lane],
            0.75,
            Number(item.z) || -45
        );
        scene.add(mesh);
        obstacleObjects.push({
            mesh,
            lane,
            hit: Boolean(item.hit)
        });
    });
    (snapshot.coins || []).forEach(item => {
        const lane = Math.max(
            0,
            Math.min(2, Number(item.lane) || 0)
        );
        const mesh = new THREE.Mesh(
            new THREE.TorusGeometry(0.28, 0.09, 8, 18),
            new THREE.MeshStandardMaterial({
                color: 0xffd84a,
                metalness: 0.7
            })
        );
        mesh.position.set(
            lanePositions[lane],
            1.05,
            Number(item.z) || -57
        );
        mesh.rotation.x = Math.PI / 2;
        scene.add(mesh);
        coinObjects.push({
            mesh,
            lane,
            collected: Boolean(item.collected)
        });
    });
    applyPlayerSkin();
}
/* =========================================================
   RESIZE
========================================================= */
function resize3D() {
    if (!camera || !renderer) return;
    camera.aspect =
        window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}
/* =========================================================
   ANIMATION LOOP
========================================================= */
function animate3D(now) {
    requestAnimationFrame(animate3D);
    const delta = Math.min(
        (now - lastFrameTime) / 1000 || 0,
        0.05
    );
    lastFrameTime = now;
    if (gameRunning && !gamePaused) {
        updateGame(delta);
        updatePlayer(delta);
        updateObstacles(delta);
        updateCoins(delta);
        updateSpawning(delta);
        roadLines.forEach(line => {
            line.position.z +=
                getCurrentGameSpeed() * delta;
            if (line.position.z > 10) {
                line.position.z -= 160;
            }
        });
        sceneryObjects.forEach(building => {
            building.position.z +=
                getCurrentGameSpeed() * delta * 0.55;
            if (building.position.z > 12) {
                building.position.z -= 170;
            }
        });
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}
/* =========================================================
   START INITIALIZATION
========================================================= */
// Funktioniert auch dann, wenn das Skript erst nach
// DOMContentLoaded geladen wird.
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        init3D,
        { once: true }
    );
} else {
    init3D();
}
