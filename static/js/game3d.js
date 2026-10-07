let scene = null;
let camera = null;
let renderer = null;

let player = null;

let obstacleObjects = [];

let threeReady = false;

let lastTime = performance.now();

const GAME_SPEED = 12;


/* =========================================
   3D INITIALISIEREN
========================================= */

function init3D() {

    console.log("GENGA: Starte 3D...");

    const container =
        document.getElementById("gameCanvas");

    if (!container) {
        console.error("gameCanvas fehlt!");
        return;
    }

    if (typeof THREE === "undefined") {

        console.error(
            "Three.js wurde nicht geladen!"
        );

        container.innerHTML = `
            <div style="
                color:white;
                display:flex;
                align-items:center;
                justify-content:center;
                height:100%;
                text-align:center;
                padding:20px;
            ">
                Three.js konnte nicht geladen werden.
            </div>
        `;

        return;
    }


    /* =====================================
       SZENE
    ===================================== */

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x101820);


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


    /* =====================================
       SPUR-LINIEN
    ===================================== */

    createLaneLine(-1);
    createLaneLine(1);


    /* =====================================
       SPIELER
    ===================================== */

    createPlayer();


    /* =====================================
       TEST-HINDERNISSE
    ===================================== */

    createObstacle(
        0,
        -20,
        0xff3030
    );

    createObstacle(
        2,
        -40,
        0x00cc66
    );

    createObstacle(
        1,
        -60,
        0xffcc00
    );

    createObstacle(
        0,
        -80,
        0xaa55ff
    );

    createObstacle(
        2,
        -100,
        0xff6600
    );


    threeReady = true;

    console.log(
        "GENGA: 3D erfolgreich!"
    );


    requestAnimationFrame(
        animate
    );
}


/* =========================================
   SPURLINIE
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
           Hindernis kommt auf
           den Spieler zu.
        */

        obstacle.position.z +=
            GAME_SPEED * delta;


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
           Hindernis ist hinter
           dem Spieler.
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


    /*
       Sanft zur neuen Spur
    */

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
            (time - lastTime) / 1000,
            0.05
        );


    lastTime =
        time;


    updateObstacles(
        delta
    );


    updatePlayer();


    /*
       Spieler leicht animieren
    */

    if (player && gameRunning) {

        player.rotation.y =
            Math.sin(time * 0.004) * 0.05;
    }


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
