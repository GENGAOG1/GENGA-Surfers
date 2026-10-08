let scene;
let camera;
let renderer;
let player;

let obstacleObjects = [];

const GAME_SPEED = 12;
const SPAWN_INTERVAL = 24;
const SPAWN_DISTANCE = -110;

const lanePositions = [-2, 0, 2];

const obstacleColors = [
    0xff3b30,
    0xff9500,
    0xffcc00,
    0x34c759,
    0x007aff,
    0xaf52de
];

let lastTime = 0;


/* =========================
   HILFSFUNKTIONEN
========================= */

function randomInt(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function getRandomColor() {
    return obstacleColors[
        randomInt(0, obstacleColors.length - 1)
    ];
}


/* =========================
   SZENE ERSTELLEN
========================= */

function createScene() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x07111f);


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
        5,
        9
    );

    camera.lookAt(
        0,
        0,
        -20
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

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            0.7
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


    createRoad();

    createPlayer();

    resetObstacles();


    window.addEventListener(
        "resize",
        onWindowResize
    );


    animate();
}


/* =========================
   STRASSE
========================= */

function createRoad() {

    const roadGeometry =
        new THREE.BoxGeometry(
            8,
            0.2,
            300
        );

    const roadMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x252525
        });

    const road =
        new THREE.Mesh(
            roadGeometry,
            roadMaterial
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


/* =========================
   SPUR-LINIEN
========================= */

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


/* =========================
   SPIELER
========================= */

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


/* =========================
   HINDERNIS ERSTELLEN
========================= */

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


/* =========================
   HINDERNIS-REIHE
========================= */

function spawnObstacleRow(z) {

    /*
        50 %:
        Nur 1 Block
    */

    const oneBlock =
        Math.random() < 0.5;


    if (oneBlock) {

        const blockLane =
            randomInt(0, 2);

        createObstacle(
            blockLane,
            z,
            getRandomColor()
        );

        return;
    }


    /*
        50 %:
        2 Blöcke

        Eine Spur bleibt frei.
        Die freie Spur darf
        wiederholt werden.
    */

    const safeLane =
        randomInt(0, 2);


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
}


/* =========================
   HINDERNISSE ZURÜCKSETZEN
========================= */

function resetObstacles() {

    for (
        const obstacle of obstacleObjects
    ) {

        scene.remove(
            obstacle
        );
    }

    obstacleObjects = [];


    /*
        Reihen weit nach hinten
        verteilen.
    */

    let spawnZ =
        SPAWN_DISTANCE;


    for (
        let i = 0;
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


/* =========================
   NEUE REIHEN
========================= */

function updateSpawning() {

    if (
        obstacleObjects.length === 0
    ) {
        return;
    }


    let furthestZ =
        Infinity;


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


    if (
        furthestZ > -150
    ) {

        spawnObstacleRow(
            furthestZ -
            SPAWN_INTERVAL
        );
    }
}


/* =========================
   HINDERNISSE BEWEGEN
========================= */

function updateObstacles(delta) {

    for (
        let i =
            obstacleObjects.length - 1;
        i >= 0;
        i--
    ) {

        const obstacle =
            obstacleObjects[i];


        obstacle.position.z +=
            GAME_SPEED * delta;


        /*
            Nur während des Spiels
            Kollision prüfen.
        */

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


        /*
            Alte Blöcke entfernen.
        */

        if (
            obstacle.position.z >
            10
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


/* =========================
   KOLLISION
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
   SPIELER BEWEGEN
========================= */

function updatePlayer() {

    if (!player) {
        return;
    }


    /*
        playerLane kommt
        aus game.js / controls.js.
    */

    const currentLane =
        typeof playerLane !==
        "undefined"
            ? playerLane
            : 1;


    const targetX =
        lanePositions[currentLane];


    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.2;
}


/* =========================
   ANIMATION
========================= */

function animate(
    currentTime = 0
) {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            (currentTime - lastTime) /
                1000,
            0.05
        );


    lastTime =
        currentTime;


    /*
        3D-Bewegung nur,
        wenn das Spiel läuft.
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


/* =========================
   RESIZE
========================= */

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


/* =========================
   START DER 3D-SZENE
========================= */

/*
    Wichtig:
    Die 3D-Szene wird erst nach
    dem Laden der Seite gestartet.

    Der Spielen-Button bleibt
    vollständig unter der Kontrolle
    von game.js.
*/

window.addEventListener(
    "DOMContentLoaded",
    function () {

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
