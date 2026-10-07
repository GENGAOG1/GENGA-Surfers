let scene;
let camera;
let renderer;

let player;
let road;

let laneObjects = [];
let obstacleObjects = [];

let worldSpeed = 0.35;


/* =========================================
   3D INITIALISIEREN
========================================= */

function init3D() {

    const container =
        document.getElementById("gameCanvas");

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x101820);


    /* Kamera */

    camera =
        new THREE.PerspectiveCamera(
            65,
            container.clientWidth /
            container.clientHeight,
            0.1,
            1000
        );

    camera.position.set(
        0,
        5,
        10
    );

    camera.lookAt(
        0,
        1,
        -20
    );


    /* Renderer */

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


    /* Licht */

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            1.5
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
        12,
        8
    );

    scene.add(
        directionalLight
    );


    createRoad();

    createPlayer();

    createDemoObstacles();


    window.addEventListener(
        "resize",
        resize3D
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
            color: 0x202020
        });

    road =
        new THREE.Mesh(
            geometry,
            material
        );

    road.rotation.x =
        -Math.PI / 2;

    road.position.y = 0;

    road.position.z = -180;

    scene.add(
        road
    );


    /*
       Spur-Trennlinien
    */

    for (
        let lane = 0;
        lane < 2;
        lane++
    ) {

        const geometry =
            new THREE.BoxGeometry(
                0.08,
                0.03,
                400
            );

        const material =
            new THREE.MeshStandardMaterial({
                color: 0x666666
            });

        const line =
            new THREE.Mesh(
                geometry,
                material
            );

        line.position.x =
            -1 +
            lane * 2;

        line.position.y =
            0.02;

        line.position.z =
            -180;

        scene.add(
            line
        );

        laneObjects.push(
            line
        );
    }
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
   HINDERNIS
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
        -2 +
        lane * 2;

    obstacle.position.y =
        0.9;

    obstacle.position.z =
        z;


    /*
       Zusätzliche Informationen
       für die Spielphysik.
    */

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
   TEST-HINDERNISSE
========================================= */

function createDemoObstacles() {

    createObstacle(
        0,
        -25,
        0xff3030
    );

    createObstacle(
        2,
        -50,
        0x00cc66
    );

    createObstacle(
        1,
        -75,
        0xffcc00
    );

    createObstacle(
        0,
        -100,
        0xaa55ff
    );

    createObstacle(
        2,
        -125,
        0xff6600
    );
}


/* =========================================
   HINDERNISSE BEWEGEN
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


        /*
           Die Hindernisse kommen
           auf den Spieler zu.

           Der Spieler selbst bleibt
           ungefähr an derselben Position.
        */

        obstacle.position.z +=
            worldSpeed * delta;


        /*
           Kollision prüfen
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
           Hindernis ist hinter dem Spieler.
        */

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


    /*
       Abstand in X und Z.

       Dadurch muss der Spieler
       wirklich auf derselben Spur
       sein.
    */

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
        xDistance < 1.0 &&
        zDistance < 1.2
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
        !camera ||
        !renderer
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
   RENDER LOOP
========================================= */

let lastRenderTime =
    performance.now();


function render3D(time) {

    requestAnimationFrame(
        render3D
    );


    const delta =
        Math.min(
            (time - lastRenderTime) / 16.67,
            3
        );


    lastRenderTime =
        time;


    /*
       Hindernisse bewegen.
    */

    updateObstacles(
        delta
    );


    /*
       Spieler folgt weich
       seiner Spur.
    */

    if (player) {

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


    renderer.render(
        scene,
        camera
    );
}


/* =========================================
   START
========================================= */

init3D();
