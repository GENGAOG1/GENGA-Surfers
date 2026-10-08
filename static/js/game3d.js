/* =========================================
   GENGA SURFER
   3D GAME
========================================= */

let scene;

let camera;

let renderer;

let player;

let obstacleObjects = [];

let coinObjects = [];


/* =========================================
   SETTINGS
========================================= */

const lanePositions =
    [-2, 0, 2];


const obstacleColors = [

    0xff3b30,

    0xff9500,

    0xffcc00,

    0x34c759,

    0x007aff,

    0xaf52de
];


const BASE_SPEED = 12;

const MAX_SPEED = 28;

const SPEED_INCREASE =
    0.35;


const SPAWN_INTERVAL = 24;

const SPAWN_DISTANCE = -120;


/* =========================================
   STATE
========================================= */

let currentGameSpeed =
    BASE_SPEED;

let nextSpawnZ =
    SPAWN_DISTANCE;


let lastTime = 0;


/* =========================================
   RANDOM
========================================= */

function randomInt(
    min,
    max
) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


function randomColor() {

    return obstacleColors[
        randomInt(
            0,
            obstacleColors.length - 1
        )
    ];
}


/* =========================================
   SCENE
========================================= */

function createScene() {

    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x07111f
        );


    camera =
        new THREE.PerspectiveCamera(
            65,
            window.innerWidth /
            window.innerHeight,
            0.1,
            300
        );


    /*
     * Etwas weiter entfernt
     * als vorher.
     */

    camera.position.set(
        0,
        6.2,
        11.5
    );


    camera.lookAt(
        0,
        0.8,
        -25
    );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true
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


    const container =
        document.getElementById(
            "gameCanvas"
        );


    if (container) {

        container.innerHTML = "";

        container.appendChild(
            renderer.domElement
        );
    }


    /* Licht */

    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            0.75
        );


    scene.add(
        ambient
    );


    const directional =
        new THREE.DirectionalLight(
            0xffffff,
            1
        );


    directional.position.set(
        5,
        12,
        5
    );


    scene.add(
        directional
    );


    createRoad();

    createPlayer();

    resetObstacles();

    resetCoins();


    window.addEventListener(
        "resize",
        onWindowResize
    );


    animate();
}


/* =========================================
   ROAD
========================================= */

function createRoad() {

    const geometry =
        new THREE.BoxGeometry(
            8,
            0.2,
            350
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x252525
        });


    const road =
        new THREE.Mesh(
            geometry,
            material
        );


    road.position.set(
        0,
        0,
        -120
    );


    scene.add(
        road
    );


    createLaneLine(
        -1
    );


    createLaneLine(
        1
    );
}


function createLaneLine(
    x
) {

    const geometry =
        new THREE.BoxGeometry(
            0.08,
            0.03,
            350
        );


    const material =
        new THREE.MeshBasicMaterial({
            color: 0x777777
        });


    const line =
        new THREE.Mesh(
            geometry,
            material
        );


    line.position.set(
        x,
        0.12,
        -120
    );


    scene.add(
        line
    );
}


/* =========================================
   PLAYER
========================================= */

function createPlayer() {

    const geometry =
        new THREE.BoxGeometry(
            1.2,
            1.8,
            1.2
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x008cff
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


    scene.add(
        player
    );


    /*
     * Aktuellen Skin anwenden.
     */

    if (
        typeof applySkinToPlayer ===
        "function"
    ) {

        applySkinToPlayer();
    }
}


/* =========================================
   OBSTACLE
========================================= */

function createObstacle(
    lane,
    z,
    color
) {

    const geometry =
        new THREE.BoxGeometry(
            1.35,
            1.8,
            1.35
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: color
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


    scene.add(
        obstacle
    );


    obstacleObjects.push(
        obstacle
    );
}


/* =========================================
   SPAWN ROW
========================================= */

function spawnObstacleRow(
    z
) {

    /*
     * 30 % = nur ein Block.
     *
     * Aber niemals mehrere
     * Single Rows direkt
     * hintereinander.
     */

    const previousWasSingle =
        window.previousSingleRow === true;


    let oneBlock =
        Math.random() < 0.30;


    if (
        previousWasSingle
    ) {

        oneBlock = false;
    }


    if (oneBlock) {

        const lane =
            randomInt(
                0,
                2
            );


        createObstacle(
            lane,
            z,
            randomColor()
        );


        window.previousSingleRow =
            true;


        return;
    }


    /*
     * Zwei Blöcke.
     *
     * Eine Spur bleibt frei.
     */

    const safeLane =
        randomInt(
            0,
            2
        );


    for (
        let lane = 0;
        lane < 3;
        lane++
    ) {

        if (
            lane === safeLane
        ) {
            continue;
        }


        createObstacle(
            lane,
            z,
            randomColor()
        );
    }


    window.previousSingleRow =
        false;
}


/* =========================================
   RESET OBSTACLES
========================================= */

function resetObstacles() {

    for (
        const obstacle of
        obstacleObjects
    ) {

        scene.remove(
            obstacle
        );
    }


    obstacleObjects =
        [];


    window.previousSingleRow =
        false;


    nextSpawnZ =
        SPAWN_DISTANCE;


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        spawnObstacleRow(
            nextSpawnZ
        );


        nextSpawnZ -=
            SPAWN_INTERVAL;
    }
}


/* =========================================
   SPAWN UPDATE
========================================= */

function updateSpawning() {

    if (
        nextSpawnZ > -180
    ) {

        spawnObstacleRow(
            nextSpawnZ
        );


        nextSpawnZ -=
            SPAWN_INTERVAL;
    }
}


/* =========================================
   OBSTACLE UPDATE
========================================= */

function updateObstacles(
    delta
) {

    for (
        let i =
            obstacleObjects.length - 1;
        i >= 0;
        i--
    ) {

        const obstacle =
            obstacleObjects[i];


        obstacle.position.z +=
            currentGameSpeed *
            delta;


        if (
            typeof gameRunning !==
            "undefined" &&
            gameRunning &&
            !gamePaused
        ) {

            if (
                checkCollision(
                    obstacle
                )
            ) {

                endGame();

                return;
            }
        }


        if (
            obstacle.position.z >
            12
        ) {

            scene.remove(
                obstacle
            );


            obstacleObjects.splice(
                i,
                1
            );
        }
    }
}


/* =========================================
   COLLISION
========================================= */

function checkCollision(
    obstacle
) {

    if (!player) {

        return false;
    }


    const x =
        Math.abs(
            player.position.x -
            obstacle.position.x
        );


    const z =
        Math.abs(
            player.position.z -
            obstacle.position.z
        );


    return (
        x < 1.15 &&
        z < 1.35
    );
}


/* =========================================
   PLAYER
========================================= */

function updatePlayer() {

    if (!player) {

        return;
    }


    const lane =
        typeof playerLane !==
        "undefined"
            ? playerLane
            : 1;


    const targetX =
        lanePositions[lane];


    /*
     * Kein Wackeln:
     * feste Interpolation.
     */

    player.position.x =
        THREE.MathUtils.lerp(
            player.position.x,
            targetX,
            0.25
        );
}


function resetPlayer() {

    if (!player) {
        return;
    }


    const lane =
        typeof playerLane !==
        "undefined"
            ? playerLane
            : 1;


    player.position.set(
        lanePositions[lane],
        0.9,
        3
    );


    player.rotation.set(
        0,
        0,
        0
    );


    currentGameSpeed =
        BASE_SPEED;


    if (
        typeof applySkinToPlayer ===
        "function"
    ) {

        applySkinToPlayer();
    }
}


/* =========================================
   COINS
========================================= */

function createCoin(
    lane,
    z
) {

    const geometry =
        new THREE.CylinderGeometry(
            0.38,
            0.38,
            0.14,
            24
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            metalness: 0.7,
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
        1.1,
        z
    );


    scene.add(
        coin
    );


    coinObjects.push(
        coin
    );
}


/* =========================================
   COIN ROW
========================================= */

function spawnCoinRow(
    z
) {

    const lane =
        randomInt(
            0,
            2
        );


    createCoin(
        lane,
        z
    );
}


/* =========================================
   RESET COINS
========================================= */

function resetCoins() {

    for (
        const coin of
        coinObjects
    ) {

        scene.remove(
            coin
        );
    }


    coinObjects =
        [];


    /*
     * Münzen weit nach hinten.
     */

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        spawnCoinRow(
            -20 -
            i * 13
        );
    }
}


/* =========================================
   COIN UPDATE
========================================= */

function updateCoins(
    delta
) {

    for (
        let i =
            coinObjects.length - 1;
        i >= 0;
        i--
    ) {

        const coin =
            coinObjects[i];


        coin.position.z +=
            currentGameSpeed *
            delta;


        coin.rotation.z +=
            delta * 4;


        /*
         * Magnet
         */

        let magnetRadius = 0;


        if (
            typeof getCoinMagnetRadius ===
            "function"
        ) {

            magnetRadius =
                getCoinMagnetRadius();
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


        if (
            magnetRadius > 0 &&
            xDistance <
                magnetRadius &&
            zDistance <
                magnetRadius
        ) {

            coin.position.x =
                THREE.MathUtils.lerp(
                    coin.position.x,
                    player.position.x,
                    0.15
                );
        }


        /*
         * Einsammeln
         */

        if (
            xDistance < 1.0 &&
            zDistance < 1.25
        ) {

            scene.remove(
                coin
            );


            coinObjects.splice(
                i,
                1
            );


            if (
                typeof collectCoin ===
                "function"
            ) {

                collectCoin();
            }


            continue;
        }


        /*
         * Alte Münzen löschen
         */

        if (
            coin.position.z >
            12
        ) {

            scene.remove(
                coin
            );


            coinObjects.splice(
                i,
                1
            );
        }
    }


    /*
     * Immer neue Münzen erzeugen.
     */

    if (
        coinObjects.length < 14
    ) {

        let furthest =
            Infinity;


        for (
            const coin of
            coinObjects
        ) {

            if (
                coin.position.z <
                furthest
            ) {

                furthest =
                    coin.position.z;
            }
        }


        if (
            furthest === Infinity
        ) {

            furthest = -30;
        }


        spawnCoinRow(
            furthest - 13
        );
    }
}


/* =========================================
   CLEAR NEARBY OBSTACLES
========================================= */

function clearNearbyObstacles() {

    for (
        let i =
            obstacleObjects.length - 1;
        i >= 0;
        i--
    ) {

        const obstacle =
            obstacleObjects[i];


        if (
            obstacle.position.z > -30
        ) {

            scene.remove(
                obstacle
            );


            obstacleObjects.splice(
                i,
                1
            );
        }
    }
}


/* =========================================
   SPEED
========================================= */

function updateSpeed(
    delta
) {

    if (
        currentGameSpeed <
        MAX_SPEED
    ) {

        currentGameSpeed +=
            SPEED_INCREASE *
            delta;
    }


    /*
     * Upgrade Speed Start
     */

    if (
        typeof getStartSpeedBonus ===
        "function"
    ) {

        /*
         * Bonus wird nur beim
         * Start angewendet.
         * Deshalb nicht hier.
         */
    }
}


/* =========================================
   ANIMATION
========================================= */

function animate(
    currentTime = 0
) {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            (currentTime -
                lastTime) /
                1000,
            0.05
        );


    lastTime =
        currentTime;


    if (
        typeof gameRunning !==
        "undefined" &&
        gameRunning &&
        !gamePaused
    ) {

        updatePlayer();

        updateObstacles(
            delta
        );

        updateCoins(
            delta
        );

        updateSpawning();

        updateSpeed(
            delta
        );
    }


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


/* =========================================
   RESIZE
========================================= */

function onWindowResize() {

    if (
        !camera ||
        !renderer
    ) {
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


/* =========================================
   START
========================================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            typeof THREE ===
            "undefined"
        ) {

            console.error(
                "Three.js wurde nicht geladen."
            );

            return;
        }


        createScene();
    }
);
