let scene;
let camera;
let renderer;

let player;
let road;

let obstacleObjects = [];

let worldSpeed = 0.35;

let threeReady = false;


/* =========================================
   3D START
========================================= */

function init3D() {

    console.log("GENGA Surfer: 3D wird gestartet...");


    if (typeof THREE === "undefined") {

        console.error(
            "Three.js konnte nicht geladen werden."
        );

        return;
    }


    const container =
        document.getElementById("gameCanvas");


    if (!container) {

        console.error(
            "gameCanvas wurde nicht gefunden."
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
        5,
        10
    );


    camera.lookAt(
        0,
        1,
        -25
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


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    container.appendChild(
        renderer.domElement
    );


    /* =====================================
       LICHT
    ===================================== */

    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            1.5
        );

    scene.add(
        ambient
    );


    const sunlight =
        new THREE.DirectionalLight(
            0xffffff,
            2
        );

    sunlight.position.set(
        5,
        12,
        10
    );

    scene.add(
        sunlight
    );


    /* =====================================
       WELT
    ===================================== */

    createRoad();

    createPlayer();

    createDemoObstacles();


    /* =====================================
       RESIZE
    ===================================== */

    window.addEventListener(
        "resize",
        resize3D
    );


    threeReady = true;


    console.log(
        "GENGA Surfer: 3D erfolgreich gestartet."
    );


    render3D();
}


/* =========================================
   STRASSE
========================================= */

function createRoad() {

    const geometry =
        new THREE.PlaneGeometry(
            10,
            400
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x292929
        });


    road =
        new THREE.Mesh(
            geometry,
            material
        );


    road.rotation.x =
        -Math.PI / 2;


    road.position.set(
        0,
        0,
        -180
    );


    scene.add(
        road
    );


    /*
       Seiten der Strecke
    */

    createSide(
        -6,
        0x151515
    );

    createSide(
        6,
        0x151515
    );


    /*
       Spurbegrenzungen
    */

    createLaneLine(-1);

    createLaneLine(1);
}


/* =========================================
   SEITEN
========================================= */

function createSide(
    x,
    color
) {

    const geometry =
        new THREE.BoxGeometry(
            1.5,
            0.2,
            400
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: color
        });


    const side =
        new THREE.Mesh(
            geometry,
            material
        );


    side.position.set(
        x,
        0.1,
        -180
    );


    scene.add(
        side
    );
}


/* =========================================
   SPURLINIE
========================================= */

function createLaneLine(x) {

    const geometry =
        new THREE.BoxGeometry(
            0.06,
            0.03,
            400
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
        -180
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
            1.1,
            1.6,
            1.1
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
        0.8,
        5
    );


    scene.add(
        player
    );
}


/* =========================================
   BLOCK
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


    obstacle.position.x =
        lanePositions[lane];


    obstacle.position.y =
        0.9;


    obstacle.position.z =
        z;


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
   TEST-BLÖCKE
========================================= */

function createDemoObstacles() {

    createObstacle(
        0,
        -25,
        0xff3030
    );


    createObstacle(
        2,
        -45,
        0x00cc66
    );


    createObstacle(
        1,
        -65,
        0xffcc00
    );


    createObstacle(
        0,
        -85,
        0xaa55ff
    );


    createObstacle(
        2,
        -105,
        0xff6600
    );
}


/* =========================================
   BEWEGUNG
========================================= */

function updateObstacles(delta) {

    if (!gameRunning) {
        return;
    }


    for (
        let i = obstacleObjects.length - 1;
        i >= 0;
        i--
    ) {

        const obstacle =
            obstacleObjects[i];


        obstacle.position.z +=
            worldSpeed * delta;


        if (
            checkCollision(
                obstacle
            )
        ) {

            endGame();

            return;
        }


        if (
            obstacle.position.z > 15
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
        xDistance < 1.2 &&
        zDistance < 1.4
    );
}


/* =========================================
   3D UPDATE
========================================= */

function update3D(delta) {

    if (!threeReady) {
        return;
    }


    if (gameRunning) {

        updateObstacles(
            delta
        );
    }


    if (player) {

        const targetX =
            lanePositions[
                playerLane
            ];


        player.position.x +=
            (
                targetX -
                player.position.x
            ) * 0.15;
    }
}


/* =========================================
   RENDER
========================================= */

let previousTime =
    performance.now();


function render3D(time) {

    requestAnimationFrame(
        render3D
    );


    const delta =
        Math.min(
            (time - previousTime) /
            16.67,
            3
        );


    previousTime =
        time;


    update3D(
        delta
    );


    if (renderer && scene && camera) {

        renderer.render(
            scene,
            camera
        );
    }
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
        !camera ||
        !renderer ||
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


/* =========================================
   START
========================================= */

init3D();
