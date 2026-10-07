let scene = null;
let camera = null;
let renderer = null;

let player = null;

let obstacleObjects = [];

let threeReady = false;

let lastTime = performance.now();


/* =========================================
   EINSTELLUNGEN
========================================= */

const GAME_SPEED = 12;

const SPAWN_DISTANCE = -100;

const SPAWN_INTERVAL = 22;

let nextSpawnZ = SPAWN_DISTANCE;


/* =========================================
   3D INITIALISIEREN
========================================= */

function init3D() {

    console.log("GENGA: Starte 3D...");

    const container =
        document.getElementById("gameCanvas");


    if (!container) {

        console.error(
            "gameCanvas fehlt!"
        );

        return;
    }


    if (typeof THREE === "undefined") {

        console.error(
            "Three.js wurde nicht geladen!"
        );

        return;
    }


    /* =====================================
       SZENE
    ===================================== */

    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x101820
        );


    /* =====================================
       KAMERA
    ===================================== */

    camera =
        new THREE.PerspectiveCamera(
            65,
            container.clientWidth /
            container.clientHeight,
            0.1,
            500
        );


    camera.position.set(
        0,
        4,
        8
    );


    camera.lookAt(
        0,
        1,
        -20
    );


    /* =====================================
       RENDERER
    ===================================== */

    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );


    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );


    container.appendChild(
        renderer.domElement
    );


    /* =====================================
       LICHT
    ===================================== */

    const ambientLight =
        new THREE.HemisphereLight(
            0xffffff,
            0x444444,
            2
        );


    scene.add(
        ambientLight
    );


    const directionalLight =
        new THREE.DirectionalLight(
            0xffffff,
            2
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
       STRASSE
    ===================================== */

    createRoad();


    /* =====================================
       SPIELER
    ===================================== */

    createPlayer();


    threeReady = true;


    console.log(
        "GENGA: 3D erfolgreich!"
    );


    /*
       Erste Hindernisse erzeugen.
    */

    resetObstacles();


    requestAnimationFrame(
        animate
    );
}


/* =========================================
   STRASSE
========================================= */

function createRoad() {

    const roadGeometry =
        new THREE.PlaneGeometry(
            10,
            300
        );


    const roadMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x292929
        });


    const road =
        new THREE.Mesh(
            roadGeometry,
            roadMaterial
        );


    road.rotation.x =
        -Math.PI / 2;


    road.position.z =
        -140;


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
            0.05,
            0.03,
            300
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x777777
        });


    const line =
        new THREE.Mesh(
            geometry,
            material
        );


    line.position.set(
        x,
        0.03,
        -140
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
            1,
            1.8,
            1
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x00d9ff
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
   BLOCK ERSTELLEN
========================================= */

function createObstacle(
    lane,
    z,
    color
) {

    const geometry =
        new THREE.BoxGeometry(
            1.8,
            1.8,
            1.8
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


    obstacle.userData.lane =
        lane;


    scene.add(
        obstacle
    );


    obstacleObjects.push(
        obstacle
    );
}


/* =========================================
   ZUFÄLLIGE FARBE
========================================= */

function getRandomColor() {

    const colors = [

        0xff3030,

        0x00cc66,

        0xffcc00,

        0xaa55ff,

        0xff6600,

        0x00bfff,

        0xff4fa3

    ];


    return colors[
        Math.floor(
            Math.random() *
            colors.length
        )
    ];
}


/* =========================================
   NEUE HINDERNIS-REIHE
========================================= */

function spawnObstacleRow(
    z
) {

    /*
       Zufällig bestimmen,
       ob eine oder zwei Spuren
       blockiert werden.
    */

    const lanes = [
        0,
        1,
        2
    ];


    /*
       Mischen
    */

    lanes.sort(
        () => Math.random() - 0.5
    );


    /*
       1 = ein Block
       2 = zwei Blöcke
    */

    const amount =
        Math.random() < 0.65
            ? 1
            : 2;


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        createObstacle(
            lanes[i],
            z,
            getRandomColor()
        );
    }
}


/* =========================================
   HINDERNISSE ZURÜCKSETZEN
========================================= */

function resetObstacles() {

    /*
       Alte entfernen
    */

    obstacleObjects.forEach(
        obstacle => {

            scene.remove(
                obstacle
            );
        }
    );


    obstacleObjects = [];


    /*
       Mehrere Reihen vorbereiten
    */

    nextSpawnZ =
        SPAWN_DISTANCE;


    for (
        let i = 0;
        i < 5;
        i++
    ) {

        spawnObstacleRow(
            nextSpawnZ
        );


        nextSpawnZ +=
            SPAWN_INTERVAL;
    }
}


/* =========================================
   NEUE HINDERNISSE SPAWNEN
========================================= */

function updateSpawning() {

    /*
       Wir schauen nach dem
       weitesten Block.
    */

    let furthestZ =
        -Infinity;


    obstacleObjects.forEach(
        obstacle => {

            if (
                obstacle.position.z >
                furthestZ
            ) {

                furthestZ =
                    obstacle.position.z;
            }
        }
    );


    /*
       Wenn hinten nicht mehr
       genug Hindernisse stehen,
       neue Reihe erzeugen.
    */

    if (
        furthestZ >
        -120
    ) {

        spawnObstacleRow(
            furthestZ - SPAWN_INTERVAL
        );
    }
}


/* =========================================
   HINDERNISSE BEWEGEN
========================================= */

function updateObstacles(
    delta
) {

    if (!gameRunning) {
        return;
    }


    for (
        let i =
            obstacleObjects.length - 1;

        i >= 0;

        i--
    ) {

        const obstacle =
            obstacleObjects[i];


        /*
           Block kommt auf den
           Spieler zu.
        */

        obstacle.position.z +=
            GAME_SPEED *
            delta;


        /*
           Kollision
        */

        if (
            checkCollision(
                obstacle
            )
        ) {

            endGame();

            return;
        }


        /*
           Hinter dem Spieler
        */

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
   SPIELER BEWEGEN
========================================= */

function updatePlayer() {

    if (!player) {
        return;
    }


    const targetX =
        lanePositions[
            playerLane
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

function animate(time) {

    requestAnimationFrame(
        animate
    );


    if (!threeReady) {
        return;
    }


    const delta =
        Math.min(
            (time - lastTime) /
            1000,
            0.05
        );


    lastTime =
        time;


    updateObstacles(
        delta
    );


    updatePlayer();


    renderer.render(
        scene,
        camera
    );
}


/* =========================================
   RESIZE
========================================= */

function resize3D() {

    const container =
        document.getElementById(
            "gameCanvas"
        );


    if (
        !renderer ||
        !camera ||
        !container
    ) {
        return;
    }


    camera.aspect =
        container.clientWidth /
        container.clientHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );
}


window.addEventListener(
    "resize",
    resize3D
);


/* =========================================
   START
========================================= */

init3D();
