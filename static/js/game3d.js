/* =========================================
   GENGA SURFER
   3D GAME ENGINE
========================================= */

let scene = null;
let camera = null;
let renderer = null;
let player = null;

let obstacleObjects = [];

let lastTime = 0;


/* =========================================
   EINSTELLUNGEN
========================================= */

const START_SPEED = 12;
const MAX_SPEED = 24;
const SPEED_INCREASE = 0.35;

const SPAWN_INTERVAL = 24;
const SPAWN_DISTANCE = -105;

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


/* =========================================
   HILFSFUNKTIONEN
========================================= */

function randomInt(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


function getRandomColor() {

    return obstacleColors[
        randomInt(
            0,
            obstacleColors.length - 1
        )
    ];
}


/* =========================================
   SZENE ERSTELLEN
========================================= */

function createScene() {

    if (renderer) {
        return;
    }


    const container =
        document.getElementById(
            "gameCanvas"
        );


    if (!container) {

        console.error(
            "GENGA: gameCanvas nicht gefunden."
        );

        return;
    }


    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x07111f
        );


    /* =====================================
       KAMERA
    ===================================== */

    camera =
        new THREE.PerspectiveCamera(
            65,
            window.innerWidth /
                window.innerHeight,
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


    /* =====================================
       RENDERER
    ===================================== */

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference:
                "high-performance"
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight,
        false
    );


    renderer.domElement.style.position =
        "fixed";

    renderer.domElement.style.left =
        "0";

    renderer.domElement.style.top =
        "0";

    renderer.domElement.style.width =
        "100%";

    renderer.domElement.style.height =
        "100%";

    renderer.domElement.style.display =
        "block";

    renderer.domElement.style.touchAction =
        "none";


    container.innerHTML = "";

    container.appendChild(
        renderer.domElement
    );


    /* =====================================
       LICHT
    ===================================== */

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            0.8
        );

    scene.add(
        ambientLight
    );


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

    scene.add(
        directionalLight
    );


    /* =====================================
       SPIELWELT
    ===================================== */

    createRoad();

    createPlayer();

    resetObstacles();


    /* =====================================
       RESIZE
    ===================================== */

    window.addEventListener(
        "resize",
        onWindowResize
    );


    /* =====================================
       LOOP
    ===================================== */

    lastTime =
        performance.now();

    requestAnimationFrame(
        animate
    );
}


/* =========================================
   STRASSE
========================================= */

function createRoad() {

    const geometry =
        new THREE.BoxGeometry(
            8,
            0.2,
            300
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
        -100
    );


    scene.add(
        road
    );


    createLaneLine(-1);

    createLaneLine(1);
}


/* =========================================
   SPUR-LINIEN
========================================= */

function createLaneLine(x) {

    const geometry =
        new THREE.BoxGeometry(
            0.08,
            0.03,
            300
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
        -100
    );


    scene.add(
        line
    );
}


/* =========================================
   SPIELER
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
}


/* =========================================
   HINDERNIS
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
   HINDERNIS-REIHE
========================================= */

function spawnObstacleRow(z) {

    let oneBlock = false;


    if (!lastRowWasOneBlock) {

        oneBlock =
            Math.random() < 0.15;
    }


    /* =====================================
       EINZELNER BLOCK
    ===================================== */

    if (oneBlock) {

        const lane =
            randomInt(
                0,
                2
            );


        createObstacle(
            lane,
            z,
            getRandomColor()
        );


        lastRowWasOneBlock =
            true;


        return;
    }


    /* =====================================
       ZWEI BLÖCKE
    ===================================== */

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
            getRandomColor()
        );
    }


    lastRowWasOneBlock =
        false;
}


/* =========================================
   HINDERNISSE ZURÜCKSETZEN
========================================= */

function resetObstacles() {

    for (
        const obstacle
        of obstacleObjects
    ) {

        scene.remove(
            obstacle
        );
    }


    obstacleObjects = [];


    lastRowWasOneBlock =
        false;


    let spawnZ =
        SPAWN_DISTANCE;


    const firstSafeLane =
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
            lane === firstSafeLane
        ) {

            continue;
        }


        createObstacle(
            lane,
            spawnZ,
            getRandomColor()
        );
    }


    spawnZ -=
        SPAWN_INTERVAL;


    for (
        let i = 1;
        i < 7;
        i++
    ) {

        spawnObstacleRow(
            spawnZ
        );


        spawnZ -=
            SPAWN_INTERVAL;
    }
}


/* =========================================
   SPAWN
========================================= */

function updateSpawning() {

    if (
        obstacleObjects.length === 0
    ) {

        return;
    }


    let furthestZ =
        Infinity;


    for (
        const obstacle
        of obstacleObjects
    ) {

        if (
            obstacle.position.z <
            furthestZ
        ) {

            furthestZ =
                obstacle.position.z;
        }
    }


    if (
        furthestZ > -150
    ) {

        spawnObstacleRow(
            furthestZ -
            SPAWN_INTERVAL
        );
    }
}


/* =========================================
   GESCHWINDIGKEIT
========================================= */

function getCurrentGameSpeed() {

    const currentScore =
        typeof score !== "undefined"
            ? score
            : 0;


    return Math.min(
        START_SPEED +
        currentScore *
        SPEED_INCREASE,
        MAX_SPEED
    );
}


/* =========================================
   HINDERNISSE BEWEGEN
========================================= */

function updateObstacles(delta) {

    const speed =
        getCurrentGameSpeed();


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


        /* =================================
           KOLLISION
        ================================= */

        if (
            typeof gameRunning !==
            "undefined" &&
            gameRunning
        ) {

            if (
                checkCollision(
                    obstacle
                )
            ) {

                if (
                    typeof endGame ===
                    "function"
                ) {

                    endGame();
                }


                return;
            }
        }


        /* =================================
           ALTE BLÖCKE LÖSCHEN
        ================================= */

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
   KOLLISION
========================================= */

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


/* =========================================
   SPIELER
========================================= */

function updatePlayer() {

    if (!player) {

        return;
    }


    const currentLane =
        typeof playerLane !==
        "undefined"
            ? playerLane
            : 1;


    const targetX =
        lanePositions[
            currentLane
        ];


    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;
}


/* =========================================
   ANIMATION
========================================= */

function animate(currentTime) {

    requestAnimationFrame(
        animate
    );


    if (
        !lastTime
    ) {

        lastTime =
            currentTime;
    }


    const delta =
        Math.min(
            (
                currentTime -
                lastTime
            ) / 1000,
            0.05
        );


    lastTime =
        currentTime;


    /*
       WICHTIG:

       Wenn gameRunning false ist,
       bewegt sich nichts.

       Das gilt auch für Pause.
    */

    if (
        typeof gameRunning !==
        "undefined" &&
        gameRunning
    ) {

        updatePlayer();

        updateObstacles(
            delta
        );

        updateSpawning();
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
        window.innerHeight,
        false
    );
}


/* =========================================
   START
========================================= */

function initGame3D() {

    if (
        typeof THREE ===
        "undefined"
    ) {

        console.error(
            "GENGA: Three.js wurde nicht geladen."
        );

        return;
    }


    if (renderer) {

        return;
    }


    createScene();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initGame3D,
        { once: true }
    );

} else {

    initGame3D();
}
