/* =========================================
   GENGA SURFER
   3D GAME ENGINE
========================================= */

let scene = null;
let camera = null;
let renderer = null;
let player = null;

let obstacleObjects = [];

let lastTime = performance.now();

const GAME_SPEED = 12;
const SPAWN_INTERVAL = 24;
const SPAWN_DISTANCE = -110;

const lanes = [-2, 0, 2];

const obstacleColors = [
    0xff3333,
    0xff8800,
    0xffff00,
    0x33cc66,
    0x3399ff,
    0xaa44ff
];

/* =========================================
   SZENE ERSTELLEN
========================================= */

function createScene() {
    const container = document.getElementById("gameCanvas");

    if (!container) {
        console.error("GENGA: #gameCanvas nicht gefunden.");
        return;
    }

    console.log("GENGA: Erstelle 3D-Szene...");

    /* -------------------------
       SCENE
    ------------------------- */

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x07111f);

    /* -------------------------
       CAMERA
    ------------------------- */

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(
        70,
        width / height,
        0.1,
        300
    );

    camera.position.set(
        0,
        6,
        12
    );

    camera.lookAt(
        0,
        1,
        -30
    );

    /* -------------------------
       RENDERER
    ------------------------- */

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setSize(
        width,
        height,
        false
    );

    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    console.log("GENGA: Renderer erstellt.");

    /* -------------------------
       LICHT
    ------------------------- */

    const ambientLight = new THREE.AmbientLight(
        0xffffff,
        0.8
    );

    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
        0xffffff,
        1.2
    );

    directionalLight.position.set(
        5,
        10,
        5
    );

    scene.add(directionalLight);

    /* -------------------------
       ROAD
    ------------------------- */

    createRoad();

    /* -------------------------
       PLAYER
    ------------------------- */

    createPlayer();

    /* -------------------------
       OBSTACLES
    ------------------------- */

    resetObstacles();

    /* -------------------------
       RESIZE
    ------------------------- */

    window.addEventListener(
        "resize",
        onWindowResize
    );

    console.log("GENGA: 3D-Szene fertig.");

    animate();
}

/* =========================================
   STRASSE
========================================= */

function createRoad() {

    const roadGeometry = new THREE.PlaneGeometry(
        8,
        300
    );

    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x202733,
        roughness: 0.9
    });

    const road = new THREE.Mesh(
        roadGeometry,
        roadMaterial
    );

    road.rotation.x = -Math.PI / 2;

    road.position.set(
        0,
        0,
        -80
    );

    scene.add(road);

    /* -------------------------
       FAHRBAHN-LINIEN
    ------------------------- */

    createLaneLine(-1);
    createLaneLine(1);
}

/* =========================================
   FAHRBAHN-LINIE
========================================= */

function createLaneLine(x) {

    const geometry = new THREE.PlaneGeometry(
        0.08,
        300
    );

    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff
    });

    const line = new THREE.Mesh(
        geometry,
        material
    );

    line.rotation.x = -Math.PI / 2;

    line.position.set(
        x,
        0.02,
        -80
    );

    scene.add(line);
}

/* =========================================
   SPIELER
========================================= */

function createPlayer() {

    const geometry = new THREE.BoxGeometry(
        1.3,
        1.8,
        1.3
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0x00ccff
    });

    player = new THREE.Mesh(
        geometry,
        material
    );

    player.position.set(
        0,
        0.9,
        3
    );

    scene.add(player);

    console.log("GENGA: Spieler erstellt.");
}

/* =========================================
   HINDERNIS
========================================= */

function createObstacle(
    lane,
    z
) {

    const geometry = new THREE.BoxGeometry(
        1.5,
        1.5,
        1.5
    );

    const color =
        obstacleColors[
            Math.floor(
                Math.random() *
                obstacleColors.length
            )
        ];

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
        lanes[lane],
        0.75,
        z
    );

    scene.add(obstacle);

    obstacleObjects.push(
        obstacle
    );
}

/* =========================================
   HINDERNIS-REIHE
========================================= */

function spawnObstacleRow(z) {

    const random =
        Math.random();

    /* -------------------------
       EIN HINDERNIS
    ------------------------- */

    if (random < 0.5) {

        const lane =
            Math.floor(
                Math.random() * 3
            );

        createObstacle(
            lane,
            z
        );

        return;
    }

    /* -------------------------
       ZWEI HINDERNISSE
    ------------------------- */

    const safeLane =
        Math.floor(
            Math.random() * 3
        );

    for (
        let lane = 0;
        lane < 3;
        lane++
    ) {

        if (
            lane !== safeLane
        ) {

            createObstacle(
                lane,
                z
            );
        }
    }
}

/* =========================================
   HINDERNISSE ZURÜCKSETZEN
========================================= */

function resetObstacles() {

    for (
        const obstacle
        of obstacleObjects
    ) {

        if (
            obstacle.parent
        ) {

            obstacle.parent.remove(
                obstacle
            );
        }
    }

    obstacleObjects = [];

    let z = SPAWN_DISTANCE;

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        spawnObstacleRow(z);

        z -= SPAWN_INTERVAL;
    }

    console.log(
        "GENGA: Hindernisse zurückgesetzt."
    );
}

/* =========================================
   NEUE HINDERNISSE
========================================= */

function updateSpawning() {

    if (
        obstacleObjects.length === 0
    ) {
        return;
    }

    let furthestZ = Infinity;

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
            furthestZ - SPAWN_INTERVAL
        );
    }
}

/* =========================================
   HINDERNISSE BEWEGEN
========================================= */

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

        /* -------------------------
           KOLLISION
        ------------------------- */

        if (
            typeof gameRunning !==
            "undefined" &&
            gameRunning
        ) {

            if (
                checkCollision(
                    player,
                    obstacle
                )
            ) {

                endGame();
            }
        }

        /* -------------------------
           ALTE HINDERNISSE LÖSCHEN
        ------------------------- */

        if (
            obstacle.position.z >
            15
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

    updateSpawning();
}

/* =========================================
   KOLLISION
========================================= */

function checkCollision(
    playerObject,
    obstacle
) {

    if (
        !playerObject ||
        !obstacle
    ) {
        return false;
    }

    const xDistance =
        Math.abs(
            playerObject.position.x -
            obstacle.position.x
        );

    const zDistance =
        Math.abs(
            playerObject.position.z -
            obstacle.position.z
        );

    return (
        xDistance < 1.15 &&
        zDistance < 1.35
    );
}

/* =========================================
   SPIELER BEWEGEN
========================================= */

function updatePlayer() {

    if (!player) {
        return;
    }

    if (
        typeof playerLane ===
        "undefined"
    ) {
        return;
    }

    const targetX =
        lanes[playerLane];

    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;
}

/* =========================================
   ANIMATION
========================================= */

function animate(time) {

    requestAnimationFrame(
        animate
    );

    const delta = Math.min(
        (
            time -
            lastTime
        ) / 1000,
        0.05
    );

    lastTime = time;

    if (
        typeof gameRunning !==
        "undefined" &&
        gameRunning
    ) {

        updateObstacles(
            delta
        );

        updatePlayer();
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

    const container =
        document.getElementById(
            "gameCanvas"
        );

    if (!container) {
        return;
    }

    const width =
        container.clientWidth ||
        window.innerWidth;

    const height =
        container.clientHeight ||
        window.innerHeight;

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(
        width,
        height,
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
            "GENGA: Three.js wurde NICHT geladen."
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
