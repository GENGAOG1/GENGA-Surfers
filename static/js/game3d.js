let scene;
let camera;
let renderer;

let player;
let road;

let laneObjects = [];

let obstacleObjects = [];


/* =========================================
   3D INITIALISIEREN
========================================= */

function init3D() {

    const container =
        document.getElementById("gameCanvas");

    /*
       Szene
    */

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x101820);


    /*
       Kamera

       Wir schauen von hinten
       leicht nach unten auf die Strecke.
    */

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
        -15
    );


    /*
       Renderer
    */

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


    /*
       Licht
    */

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            1.4
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


    /*
       Boden
    */

    createRoad();


    /*
       Spieler
    */

    createPlayer();


    /*
       Erste Blöcke
    */

    createDemoObstacles();


    /*
       Resize
    */

    window.addEventListener(
        "resize",
        resize3D
    );


    /*
       Start rendern
    */

    render3D();
}


/* =========================================
   STRASSE
========================================= */

function createRoad() {

    const geometry =
        new THREE.PlaneGeometry(
            12,
            300
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


    /*
       Plane flach legen
    */

    road.rotation.x =
        -Math.PI / 2;


    /*
       Hinter den Spieler
    */

    road.position.y = 0;

    road.position.z = -120;


    scene.add(
        road
    );


    /*
       Fahrbahn-Markierungen
    */

    for (
        let lane = 0;
        lane < 3;
        lane++
    ) {

        const lineGeometry =
            new THREE.BoxGeometry(
                0.08,
                0.02,
                300
            );

        const lineMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x555555
            });

        const line =
            new THREE.Mesh(
                lineGeometry,
                lineMaterial
            );


        line.position.x =
            -2 +
            lane * 2;


        line.position.y =
            0.02;


        line.position.z =
            -120;


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
   3D BLOCK
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


    /*
       Drei Spuren:

       -2
        0
        2
    */

    obstacle.position.x =
        -2 +
        lane * 2;


    obstacle.position.y =
        0.9;


    obstacle.position.z =
        z;


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
        -20,
        0xff3030
    );

    createObstacle(
        2,
        -35,
        0x00cc66
    );

    createObstacle(
        1,
        -50,
        0xffcc00
    );

    createObstacle(
        0,
        -65,
        0xaa55ff
    );

    createObstacle(
        2,
        -80,
        0xff6600
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
   RENDER
========================================= */

function render3D() {

    requestAnimationFrame(
        render3D
    );


    /*
       Leichte Bewegung der Kamera,
       damit die Szene lebendig wirkt.
    */

    if (player) {

        camera.position.x +=
            (
                player.position.x -
                camera.position.x
            ) * 0.08;
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
