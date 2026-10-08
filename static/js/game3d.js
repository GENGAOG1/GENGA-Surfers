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

/* =========================================
   GAME SETTINGS
========================================= */

const START_SPEED = 10;
const MAX_SPEED = 28;

/* Wie schnell die Geschwindigkeit steigt */
const SPEED_INCREASE = 0.7;

const SPAWN_INTERVAL = 22;
const SPAWN_DISTANCE = -85;

const lanes = [-2, 0, 2];

const obstacleColors = [
    0xff3333,
    0xff8800,
    0xffff00,
    0x33cc66,
    0x3399ff,
    0xaa44ff
];

/* Aktuelle Geschwindigkeit */
let currentSpeed = START_SPEED;

/* Zeit seit Spielstart */
let gameTime = 0;

/* =========================================
   SZENE ERSTELLEN
========================================= */

function createScene() {

    const container =
        document.getElementById("gameCanvas");

    if (!container) {
        console.error(
            "GENGA: #gameCanvas nicht gefunden."
        );
        return;
    }

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x07111f);

    /* =====================================
       KAMERA
    ===================================== */

    const width =
        container.clientWidth ||
        window.innerWidth;

    const height =
        container.clientHeight ||
        window.innerHeight;

    camera =
        new THREE.PerspectiveCamera(
            68,
            width / height,
            0.1,
            250
        );

    /*
       Deutlich näher als vorher.
       Dadurch wirken Hindernisse größer
       und kommen früher ins Blickfeld.
    */

    camera.position.set(
        0,
        4.2,
        8
    );

    /*
       Kamera bleibt komplett statisch.
       Kein Wackeln durch Kamera-Bewegung.
    */

    camera.lookAt(
        0,
        0.8,
        -30
    );

    /* =====================================
       RENDERER
    ===================================== */

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );

    renderer.setSize(
        width,
        height,
        false
    );

    renderer.domElement.style.display =
        "block";

    renderer.domElement.style.width =
        "100%";

    renderer.domElement.style.height =
        "100%";

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
            0.9
        );

    scene.add(
        ambientLight
    );

    const directionalLight =
        new THREE.DirectionalLight(
            0xffffff,
            1.3
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

    animate();
}

/* =========================================
   STRASSE
========================================= */

function createRoad() {

    const roadGeometry =
        new THREE.PlaneGeometry(
            8,
            260
        );

    const roadMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x30394b,
            roughness: 0.95
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
        -90
    );

    scene.add(
        road
    );

    /* Fahrbahnlinien */

    createLaneLine(-1);
    createLaneLine(1);
}

/* =========================================
   FAHRBAHNLINIE
========================================= */

function createLaneLine(x) {

    const geometry =
        new THREE.PlaneGeometry(
            0.07,
            260
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        });

    const line =
        new THREE.Mesh(
            geometry,
            material
        );

    line.rotation.x =
        -Math.PI / 2;

    line.position.set(
        x,
        0.025,
        -90
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
            1.25,
            1.8,
            1.25
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x00dfff,
            roughness: 0.65
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
   HINDERNIS ERSTELLEN
========================================= */

function createObstacle(
    lane,
    z
) {

    const geometry =
        new THREE.BoxGeometry(
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
            color: color,
            roughness: 0.7
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

    const random =
        Math.random();

    /*
       50 %:
       nur ein Hindernis
    */

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

    /*
       50 %:
       zwei Hindernisse,
       eine Spur bleibt frei
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

    /*
       Geschwindigkeit zurücksetzen
    */

    currentSpeed =
        START_SPEED;

    gameTime = 0;

    /*
       Erste Hindernisse näher
       beim Spieler verteilen.
    */

    let z =
        SPAWN_DISTANCE;

    for (
        let i = 0;
        i < 9;
        i++
    ) {

        spawnObstacleRow(z);

        z -= SPAWN_INTERVAL;
    }
}

/* =========================================
   GESCHWINDIGKEIT
========================================= */

function updateSpeed(delta) {

    gameTime += delta;

    /*
       Geschwindigkeit steigt langsam
       und kontinuierlich.

       Beispiel:

       Start: 10
       nach 10 Sek.: ~17
       nach 20 Sek.: ~24
       Maximum: 28
    */

    currentSpeed =
        Math.min(
            START_SPEED +
            gameTime *
            SPEED_INCREASE,
            MAX_SPEED
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

        /*
           Die Geschwindigkeit wird
           automatisch größer.
        */

        obstacle.position.z +=
            currentSpeed *
            delta;

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
                    player,
                    obstacle
                )
            ) {

                endGame();
            }
        }

        /* =================================
           ALTE HINDERNISSE ENTFERNEN
        ================================= */

        if (
            obstacle.position.z >
            16
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

    /*
       Ruhige, weiche Bewegung
       ohne Kamera-Wackeln.
    */

    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.16;
}

/* =========================================
   ANIMATION
========================================= */

function animate(time) {

    requestAnimationFrame(
        animate
    );

    const delta =
        Math.min(
            (
                time -
                lastTime
            ) / 1000,
            0.05
        );

    lastTime =
        time;

    if (
        typeof gameRunning !==
        "undefined" &&
        gameRunning
    ) {

        updateSpeed(
            delta
        );

        updateObstacles(
            delta
        );

        updatePlayer();
    }

    /*
       Kamera wird NICHT verändert.
       Dadurch bleibt das Bild stabil.
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
   INITIALISIERUNG
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
