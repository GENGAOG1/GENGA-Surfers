let scene;
let camera;
let renderer;

let player;

let obstacleObjects = [];
let coinObjects = [];

let lastTime = performance.now();


/* =========================
   SETTINGS
========================= */

const START_SPEED = 12;
const MAX_SPEED = 24;

const SPEED_INCREASE = 0.35;

const SPAWN_INTERVAL = 24;
const SPAWN_DISTANCE = -105;

const COIN_SPAWN_DISTANCE = 18;

const lanePositions = [-2, 0, 2];

const obstacleColors = [
    0xff3b30,
    0xff9500,
    0xffcc00,
    0x34c759,
    0x007aff,
    0xaf52de
];

let lastRowWasOneBlock = false;

let nextCoinZ = -20;


/* =========================
   INIT
========================= */

function initGame3D() {

    if (typeof THREE === "undefined") {

        console.error(
            "Three.js wurde nicht geladen."
        );

        return;
    }

    if (renderer) {
        return;
    }

    createScene();

    requestAnimationFrame(animate);
}


/* =========================
   CREATE SCENE
========================= */

function createScene() {

    const canvasContainer =
        document.getElementById("gameCanvas");

    if (!canvasContainer) {
        return;
    }


    /* =========================
       SCENE
    ========================= */

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(0x07152d);


    /* =========================
       CAMERA
    ========================= */

    camera =
        new THREE.PerspectiveCamera(
            65,
            window.innerWidth / window.innerHeight,
            0.1,
            300
        );

    camera.position.set(
        0,
        4.8,
        10.5
    );

    camera.lookAt(
        0,
        0.8,
        -25
    );


    /* =========================
       RENDERER
    ========================= */

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    renderer.domElement.style.touchAction =
        "none";

    canvasContainer.appendChild(
        renderer.domElement
    );


    /* =========================
       LIGHT
    ========================= */

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            0.8
        );

    scene.add(ambientLight);


    const directionalLight =
        new THREE.DirectionalLight(
            0xffffff,
            1
        );

    directionalLight.position.set(
        5,
        10,
        5
    );

    scene.add(directionalLight);


    /* =========================
       ROAD
    ========================= */

    const roadGeometry =
        new THREE.PlaneGeometry(
            8,
            300
        );

    const roadMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x151f35
        });

    const road =
        new THREE.Mesh(
            roadGeometry,
            roadMaterial
        );

    road.rotation.x =
        -Math.PI / 2;

    road.position.set(
        0,
        0,
        -130
    );

    scene.add(road);


    /* =========================
       LANE LINES
    ========================= */

    const lineMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        });

    [-1, 1].forEach(x => {

        const lineGeometry =
            new THREE.BoxGeometry(
                0.06,
                0.02,
                300
            );

        const line =
            new THREE.Mesh(
                lineGeometry,
                lineMaterial
            );

        line.position.set(
            x,
            0.02,
            -130
        );

        scene.add(line);
    });


    /* =========================
       PLAYER
    ========================= */

    const playerGeometry =
        new THREE.BoxGeometry(
            1.2,
            1.8,
            1.2
        );

    const playerMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x007aff
        });

    player =
        new THREE.Mesh(
            playerGeometry,
            playerMaterial
        );

    player.position.set(
        0,
        0.9,
        3
    );

    scene.add(player);


    /* =========================
       INITIAL OBJECTS
    ========================= */

    resetObstacles();
    resetCoins();


    window.addEventListener(
        "resize",
        onWindowResize
    );
}


/* =========================
   RESET PLAYER
========================= */

function resetPlayer() {

    if (!player) {
        return;
    }

    player.position.x =
        lanePositions[playerLane];

    player.position.y = 0.9;
    player.position.z = 3;
}


/* =========================
   OBSTACLES
========================= */

function spawnObstacleRow(z) {

    let lanesToBlock = [];

    /*
     * 15% Chance auf nur einen Block.
     *
     * Zwei einzelne Block-Reihen
     * direkt hintereinander werden
     * verhindert.
     */

    const createOneBlock =
        !lastRowWasOneBlock &&
        Math.random() < 0.15;


    if (createOneBlock) {

        const blockedLane =
            Math.floor(
                Math.random() * 3
            );

        lanesToBlock.push(
            blockedLane
        );

        lastRowWasOneBlock = true;

    } else {

        /*
         * Bei zwei Blöcken bleibt
         * immer genau eine Spur frei.
         */

        const safeLane =
            Math.floor(
                Math.random() * 3
            );

        for (
            let lane = 0;
            lane < 3;
            lane++
        ) {

            if (lane !== safeLane) {

                lanesToBlock.push(
                    lane
                );
            }
        }

        lastRowWasOneBlock = false;
    }


    /* =========================
       CREATE BLOCKS
    ========================= */

    lanesToBlock.forEach(
        lane => {

            const geometry =
                new THREE.BoxGeometry(
                    1.35,
                    1.8,
                    1.35
                );

            const material =
                new THREE.MeshStandardMaterial({
                    color:
                        obstacleColors[
                            Math.floor(
                                Math.random() *
                                obstacleColors.length
                            )
                        ]
                });

            const obstacle =
                new THREE.Mesh(
                    geometry,
                    material
                );

            obstacle.position.set(
                lanePositions[lane],
                0.9,
                z
            );

            scene.add(obstacle);

            obstacleObjects.push(
                obstacle
            );
        }
    );
}


/* =========================
   RESET OBSTACLES
========================= */

function resetObstacles() {

    obstacleObjects.forEach(
        obstacle => {

            if (obstacle.parent) {

                obstacle.parent.remove(
                    obstacle
                );
            }

            obstacle.geometry.dispose();
            obstacle.material.dispose();
        }
    );

    obstacleObjects = [];

    lastRowWasOneBlock = false;


    /*
     * Erste Reihe
     */

    spawnObstacleRow(-35);


    /*
     * Weitere Reihen
     */

    for (
        let i = 1;
        i < 7;
        i++
    ) {

        spawnObstacleRow(
            -35 -
            i * SPAWN_INTERVAL
        );
    }
}


/* =========================
   COINS
========================= */

function createCoin(lane, z) {

    const geometry =
        new THREE.CylinderGeometry(
            0.38,
            0.38,
            0.12,
            24
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.7,
            roughness: 0.25
        });

    const coin =
        new THREE.Mesh(
            geometry,
            material
        );

    /*
     * Münze aufrecht drehen.
     */

    coin.rotation.z =
        Math.PI / 2;

    coin.position.set(
        lanePositions[lane],
        1.15,
        z
    );

    scene.add(coin);

    coinObjects.push(
        coin
    );
}


/* =========================
   RESET COINS
========================= */

function resetCoins() {

    /*
     * Alte Münzen entfernen.
     */

    coinObjects.forEach(
        coin => {

            if (coin.parent) {

                coin.parent.remove(
                    coin
                );
            }

            coin.geometry.dispose();
            coin.material.dispose();
        }
    );

    coinObjects = [];


    /*
     * Startposition für
     * weitere Münzen.
     */

    nextCoinZ = -20;


    /*
     * Erste Münzen erzeugen.
     */

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        const lane =
            Math.floor(
                Math.random() * 3
            );

        createCoin(
            lane,
            -20 -
            i * COIN_SPAWN_DISTANCE
        );
    }


    /*
     * Position der nächsten Münze.
     */

    nextCoinZ =
        -20 -
        10 * COIN_SPAWN_DISTANCE;
}


/* =========================
   SPAWN COINS
========================= */

function updateCoinSpawning() {

    /*
     * Wir halten immer Münzen
     * weit vor dem Spieler bereit.
     */

    while (
        nextCoinZ > -180
    ) {

        const lane =
            Math.floor(
                Math.random() * 3
            );

        createCoin(
            lane,
            nextCoinZ
        );

        nextCoinZ -=
            COIN_SPAWN_DISTANCE;
    }


    /*
     * Position der am weitesten
     * entfernten Münze suchen.
     */

    let furthestCoinZ = 0;

    coinObjects.forEach(
        coin => {

            if (
                coin.position.z <
                furthestCoinZ
            ) {

                furthestCoinZ =
                    coin.position.z;
            }
        }
    );


    /*
     * Wenn die Münzen näher kommen,
     * den Spawn-Bereich wieder
     * nach hinten verschieben.
     */

    if (
        furthestCoinZ > -120
    ) {

        nextCoinZ =
            furthestCoinZ -
            COIN_SPAWN_DISTANCE;
    }
}


/* =========================
   GAME SPEED
========================= */

function getCurrentGameSpeed() {

    return Math.min(
        START_SPEED +
        score * SPEED_INCREASE,
        MAX_SPEED
    );
}


/* =========================
   UPDATE OBSTACLES
========================= */

function updateObstacles(delta) {

    const speed =
        getCurrentGameSpeed();


    /*
     * Hindernisse bewegen.
     */

    obstacleObjects.forEach(
        obstacle => {

            obstacle.position.z +=
                speed * delta;
        }
    );


    /*
     * Kollisionen + alte
     * Hindernisse entfernen.
     */

    for (
        let i = obstacleObjects.length - 1;
        i >= 0;
        i--
    ) {

        const obstacle =
            obstacleObjects[i];


        if (
            checkCollision(
                obstacle
            )
        ) {

            endGame();

            return;
        }


        if (
            obstacle.position.z > 12
        ) {

            scene.remove(
                obstacle
            );

            obstacle.geometry.dispose();
            obstacle.material.dispose();

            obstacleObjects.splice(
                i,
                1
            );
        }
    }


    updateSpawning();
}


/* =========================
   UPDATE COINS
========================= */

function updateCoins(delta) {

    const speed =
        getCurrentGameSpeed();


    /*
     * Münzen bewegen.
     */

    coinObjects.forEach(
        coin => {

            coin.position.z +=
                speed * delta;


            /*
             * Dreh-Animation.
             */

            coin.rotation.y +=
                delta * 5;
        }
    );


    /*
     * Münzen prüfen.
     */

    for (
        let i = coinObjects.length - 1;
        i >= 0;
        i--
    ) {

        const coin =
            coinObjects[i];


        /*
         * Münze eingesammelt?
         */

        if (
            checkCoinCollision(
                coin
            )
        ) {

            addCoin();


            scene.remove(
                coin
            );

            coin.geometry.dispose();
            coin.material.dispose();


            coinObjects.splice(
                i,
                1
            );

            continue;
        }


        /*
         * Münze hinter dem Spieler.
         */

        if (
            coin.position.z > 12
        ) {

            scene.remove(
                coin
            );

            coin.geometry.dispose();
            coin.material.dispose();


            coinObjects.splice(
                i,
                1
            );
        }
    }


    /*
     * Neue Münzen erzeugen.
     */

    updateCoinSpawning();
}


/* =========================
   SPAWN OBSTACLES
========================= */

function updateSpawning() {

    let furthestZ = 0;


    obstacleObjects.forEach(
        obstacle => {

            if (
                obstacle.position.z <
                furthestZ
            ) {

                furthestZ =
                    obstacle.position.z;
            }
        }
    );


    /*
     * Neue Reihe erzeugen,
     * sobald die letzte Reihe
     * zu nah kommt.
     */

    if (
        furthestZ >
        -150
    ) {

        spawnObstacleRow(
            furthestZ -
            SPAWN_INTERVAL
        );
    }
}


/* =========================
   OBSTACLE COLLISION
========================= */

function checkCollision(
    obstacle
) {

    if (!player) {
        return false;
    }


    const xDistance =
        Math.abs(
            player.position.x -
            obstacle.position.x
        );


    const zDistance =
        Math.abs(
            player.position.z -
            obstacle.position.z
        );


    return (
        xDistance < 1.15 &&
        zDistance < 1.35
    );
}


/* =========================
   COIN COLLISION
========================= */

function checkCoinCollision(
    coin
) {

    if (!player) {
        return false;
    }


    const xDistance =
        Math.abs(
            player.position.x -
            coin.position.x
        );


    const zDistance =
        Math.abs(
            player.position.z -
            coin.position.z
        );


    return (
        xDistance < 1.05 &&
        zDistance < 1.25
    );
}


/* =========================
   PLAYER
========================= */

function updatePlayer() {

    if (!player) {
        return;
    }


    const targetX =
        lanePositions[playerLane];


    /*
     * Weiche Bewegung
     * zwischen den Spuren.
     */

    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;
}


/* =========================
   RESIZE
========================= */

function onWindowResize() {

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


/* =========================
   ANIMATION
========================= */

function animate(currentTime) {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            (currentTime - lastTime) / 1000,
            0.05
        );

    lastTime = currentTime;


    /*
     * Während der Pause
     * bewegt sich nichts.
     */

    if (
        typeof gameRunning !==
        "undefined" &&
        gameRunning
    ) {

        updatePlayer();

        updateObstacles(delta);

        updateCoins(delta);
    }


    /*
     * Immer rendern, auch während
     * der Pause.
     */

    if (
        renderer &&
        scene &&
        camera
    ) {

        renderer.render(
            scene,
            camera
        );
    }
}


/* =========================
   START
========================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initGame3D
    );

} else {

    initGame3D();
}
