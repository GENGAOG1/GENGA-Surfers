let scene = null;
let camera = null;
let renderer = null;

let player = null;

let threeReady = false;


/* ==============================
   3D INITIALISIEREN
============================== */

function init3D() {

    console.log("GENGA: Starte 3D...");

    const container =
        document.getElementById("gameCanvas");

    if (!container) {
        console.error("gameCanvas fehlt!");
        return;
    }

    if (typeof THREE === "undefined") {

        console.error("Three.js wurde nicht geladen!");

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


    /* ==========================
       SZENE
    ========================== */

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x101820);


    /* ==========================
       KAMERA
    ========================== */

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


    /* ==========================
       RENDERER
    ========================== */

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


    /* ==========================
       LICHT
    ========================== */

    const light =
        new THREE.HemisphereLight(
            0xffffff,
            0x444444,
            2
        );

    scene.add(light);


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


    /* ==========================
       BODEN
    ========================== */

    const floorGeometry =
        new THREE.PlaneGeometry(
            12,
            200
        );

    const floorMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x292929
        });

    const floor =
        new THREE.Mesh(
            floorGeometry,
            floorMaterial
        );

    floor.rotation.x =
        -Math.PI / 2;

    floor.position.z =
        -80;

    scene.add(floor);


    /* ==========================
       SPIELER
    ========================== */

    const playerGeometry =
        new THREE.BoxGeometry(
            1,
            1.8,
            1
        );

    const playerMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x00d9ff
        });

    player =
        new THREE.Mesh(
            playerGeometry,
            playerMaterial
        );

    player.position.set(
        0,
        0.9,
        3
    );

    scene.add(player);


    /* ==========================
       TEST-BLOCK
    ========================== */

    const obstacleGeometry =
        new THREE.BoxGeometry(
            1.8,
            1.8,
            1.8
        );

    const obstacleMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xff3030
        });

    const obstacle =
        new THREE.Mesh(
            obstacleGeometry,
            obstacleMaterial
        );

    obstacle.position.set(
        0,
        0.9,
        -15
    );

    scene.add(obstacle);


    threeReady = true;

    console.log("GENGA: 3D erfolgreich!");

    animate();
}


/* ==============================
   ANIMATION
============================== */

function animate() {

    requestAnimationFrame(
        animate
    );

    if (player) {

        player.rotation.y +=
            0.01;
    }

    renderer.render(
        scene,
        camera
    );
}


/* ==============================
   RESIZE
============================== */

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


/* ==============================
   START
============================== */

init3D();
