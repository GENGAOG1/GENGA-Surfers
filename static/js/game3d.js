/* =========================================
   GENGA SURFER
   3D ENGINE
========================================= */


let scene = null;

let camera = null;

let renderer = null;

let player = null;


let obstacleObjects = [];


let threeReady = false;


let lastTime =
    performance.now();


/* =========================================
   EINSTELLUNGEN
========================================= */


/*
   Geschwindigkeit der Blöcke
*/

const GAME_SPEED = 12;


/*
   Abstand zwischen Reihen
*/

const SPAWN_INTERVAL = 24;


/*
   Erste Spawn-Position
*/

const SPAWN_DISTANCE = -110;


/*
   Nächste Spawn-Position
*/

let nextSpawnZ =
    SPAWN_DISTANCE;


/*
   Letzte freie Spur.

   Dadurch vermeiden wir,
   dass ständig dasselbe Muster kommt.
*/

let lastSafeLane = -1;


/* =========================================
   FARBEN
========================================= */

const obstacleColors = [

    0xff3030,

    0x00cc66,

    0xffcc00,

    0xaa55ff,

    0xff6600,

    0x00aaff,

    0xff4fa3

];


/* =========================================
   3D INITIALISIEREN
========================================= */

function init3D() {

    console.log(
        "GENGA: Starte 3D..."
    );


    const container =
        document.getElementById(
            "gameCanvas"
        );


    if (!container) {

        console.error(
            "gameCanvas fehlt!"
        );

        return;
    }


    if (
        typeof THREE ===
        "undefined"
    ) {

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

            window.devicePixelRatio ||
            1,

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
       Hindernisse vorbereiten
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


    /*
       Zwei Linien teilen
       die drei Spuren.
    */

    createLaneLine(-1);

    createLaneLine(1);
}


/* =========================================
   SPUR-LINIE
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

    return obstacleColors[

        Math.floor(

            Math.random() *
            obstacleColors.length

        )

    ];
}


/* =========================================
   ZUFÄLLIGE ZAHL
========================================= */

function randomInt(

    min,

    max

) {

    return Math.floor(

        Math.random() *
        (max - min + 1)

    ) + min;
}


/* =========================================
   SPURN MISCHEN
========================================= */

function shuffleArray(array) {

    const result =
        [...array];


    for (

        let i =
            result.length - 1;

        i > 0;

        i--

    ) {

        const j =
            Math.floor(

                Math.random() *
                (i + 1)

            );


        [
            result[i],
            result[j]

        ] = [

            result[j],
            result[i]

        ];

    }


    return result;
}


/* =========================================
   NEUE HINDERNIS-REIHE
========================================= */

function spawnObstacleRow(z) {

    /*
       Drei mögliche Spuren
    */

    const shuffledLanes =
        shuffleArray([

            0,
            1,
            2

        ]);


    /*
       55 % Wahrscheinlichkeit
       für einen Block.

       45 % für zwei Blöcke.

       NIEMALS drei!
    */

    let blockCount;


    if (
        Math.random() < 0.55
    ) {

        blockCount = 1;

    } else {

        blockCount = 2;

    }


    /*
       Bei zwei Blöcken:
       Eine Spur bleibt frei.
    */

    let safeLane;


    if (
        blockCount === 2
    ) {

        /*
           Die freie Spur darf nicht
           dieselbe wie vorher sein,
           wenn es vermeidbar ist.
        */

        const possibleSafeLanes =
            shuffledLanes.filter(

                lane =>
                    lane !==
                    lastSafeLane

            );


        if (
            possibleSafeLanes.length > 0
        ) {

            safeLane =
                possibleSafeLanes[
                    randomInt(

                        0,

                        possibleSafeLanes.length - 1

                    )
                ];

        } else {

            safeLane =
                shuffledLanes[0];

        }


        lastSafeLane =
            safeLane;


        /*
           Alle anderen beiden
           Spuren bekommen einen Block.
        */

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

                    z,

                    getRandomColor()

                );

            }

        }

    } else {

        /*
           Nur EIN Block.

           Die freie Spur wird zufällig
           gewählt.
        */

        let blockedLane;


        /*
           Verhindern, dass derselbe
           Block zu oft auf derselben
           Spur erscheint.
        */

        const possibleBlockedLanes =
            shuffledLanes.filter(

                lane =>
                    lane !==
                    lastSafeLane

            );


        if (
            possibleBlockedLanes.length > 0
        ) {

            blockedLane =
                possibleBlockedLanes[

                    randomInt(

                        0,

                        possibleBlockedLanes.length - 1

                    )

                ];

        } else {

            blockedLane =
                shuffledLanes[0];

        }


        /*
           Die beiden anderen Spuren
           sind sicher.
        */

        lastSafeLane =
            shuffledLanes.find(

                lane =>
                    lane !==
                    blockedLane

            );


        createObstacle(

            blockedLane,

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
       Alte Blöcke löschen
    */

    obstacleObjects.forEach(

        obstacle => {

            if (scene) {

                scene.remove(
                    obstacle
                );

            }

        }

    );


    obstacleObjects = [];


    /*
       Spawn-System zurücksetzen
    */

    nextSpawnZ =
        SPAWN_DISTANCE;


    lastSafeLane =
        -1;


    /*
       Mehrere Reihen vorbereiten
    */

    for (

        let i = 0;

        i < 6;

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
   NEUE REIHEN ERZEUGEN
========================================= */

function updateSpawning() {

    /*
       Die weiteste vorhandene
       Hindernis-Reihe suchen.
    */

    let furthestZ =
        Infinity;


    obstacleObjects.forEach(

        obstacle => {

            if (

                obstacle.position.z <
                furthestZ

            ) {

                furthestZ =
                    obstacle.position.z;

            }

        }

    );


    /*
       Falls nicht genug Hindernisse
       in der Entfernung vorhanden sind,
       eine neue Reihe erzeugen.
    */

    if (

        furthestZ >
        -150

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
           Hindernis kommt
           auf den Spieler zu.
        */

        obstacle.position.z +=

            GAME_SPEED *
            delta;


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


    /*
       Zielposition der aktuellen Spur
    */

    const targetX =

        lanePositions[
            playerLane
        ];


    /*
       Sanft zur neuen Spur bewegen
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

            (

                time -
                lastTime

            ) / 1000,

            0.05

        );


    lastTime =
        time;


    /*
       Blöcke bewegen
    */

    updateObstacles(
        delta
    );


    /*
       Spieler bewegen
    */

    updatePlayer();


    /*
       Leichte Bewegung
    */

    if (

        player &&
        gameRunning

    ) {

        player.rotation.y =

            Math.sin(

                time *
                0.004

            ) * 0.05;

    }


    /*
       Rendern
    */

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
