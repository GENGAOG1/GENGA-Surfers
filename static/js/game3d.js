/* =========================================
   GENGA SURFER
   GAME 3D
========================================= */


let scene;
let camera;
let renderer;
let player;


/* =========================================
   OBJEKTE
========================================= */

let obstacleObjects = [];
let coinObjects = [];


/* =========================================
   GAME SETTINGS
========================================= */

const BASE_GAME_SPEED = 12;
const MAX_GAME_SPEED = 28;

const SPAWN_INTERVAL = 24;
const SPAWN_DISTANCE = -110;

const lanePositions = [
    -2,
    0,
    2
];


const obstacleColors = [
    0xff3b30,
    0xff9500,
    0xffcc00,
    0x34c759,
    0x007aff,
    0xaf52de
];


/* =========================================
   TIME
========================================= */

let lastTime = 0;

let gameDistance = 0;


/* =========================================
   SPAWN STATE
========================================= */

let lastSafeLane = -1;

let lastWasSingleBlock = false;

let nextSpawnZ = SPAWN_DISTANCE;


/* =========================================
   HILFSFUNKTIONEN
========================================= */

function randomInt(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


function getRandomColor() {

    return obstacleColors[
        randomInt(
            0,
            obstacleColors.length - 1
        )
    ];
}


function shuffleArray(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];
    }

    return array;
}


/* =========================================
   AKTUELLE GESCHWINDIGKEIT
========================================= */

function getGameSpeed() {

    /*
     * Geschwindigkeit steigt langsam
     * mit der zurückgelegten Strecke.
     */

    const speedIncrease =
        Math.min(
            gameDistance * 0.015,
            MAX_GAME_SPEED -
            BASE_GAME_SPEED
        );

    return BASE_GAME_SPEED +
        speedIncrease;
}


/* =========================================
   SZENE ERSTELLEN
========================================= */

function createScene() {

    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x07111f
        );


    /*
     * Kamera
     */

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
        5.8,
        11
    );


    camera.lookAt(
        0,
        0.8,
        -22
    );


    /*
     * Renderer
     */

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


    /* =====================================
       LICHT
    ===================================== */

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            0.75
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


    /* =====================================
       OBJEKTE
    ===================================== */

    createRoad();

    createPlayer();

    resetObstacles();

    resetCoins();


    /*
     * Resize
     */

    window.addEventListener(
        "resize",
        onWindowResize
    );


    /*
     * Animation starten
     */

    requestAnimationFrame(
        animate
    );
}


/* =========================================
   STRASSE
========================================= */

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


/* =========================================
   SPUR-LINIEN
========================================= */

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


/* =========================================
   SPIELER
========================================= */

function createPlayer() {

    const geometry =
        new THREE.BoxGeometry(
            1.2,
            1.8,
            1.2
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x007aff
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


    /*
     * Ausgewählten Skin anwenden.
     */

    if (
        typeof applySelectedSkin ===
        "function"
    ) {

        applySelectedSkin();
    }
}


/* =========================================
   SPIELER ZURÜCKSETZEN
========================================= */

function resetPlayer() {

    if (!player) {

        return;
    }


    player.position.set(
        0,
        0.9,
        3
    );


    player.rotation.set(
        0,
        0,
        0
    );


    if (
        typeof playerLane !==
        "undefined"
    ) {

        player.position.x =
            lanePositions[
                playerLane
            ];
    }


    if (
        typeof applySelectedSkin ===
        "function"
    ) {

        applySelectedSkin();
    }
}


/* =========================================
   HINDERNIS ERSTELLEN
========================================= */

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


/* =========================================
   HINDERNIS-REIHE
========================================= */

function spawnObstacleRow(z) {

    /*
     * Meistens zwei Blöcke.
     *
     * Manchmal nur ein Block.
     *
     * Einzelne Blöcke dürfen nicht
     * ständig hintereinander kommen.
     */

    let spawnSingle =
        Math.random() < 0.28;


    if (
        lastWasSingleBlock
    ) {

        spawnSingle = false;
    }


    /*
     * Bei einer Einzelreihe:
     * zufällige Spur.
     */

    if (spawnSingle) {

        const blockLane =
            randomInt(
                0,
                2
            );


        createObstacle(
            blockLane,
            z,
            getRandomColor()
        );


        lastWasSingleBlock =
            true;


        lastSafeLane = -1;


        return;
    }


    /*
     * Zwei Blöcke.
     *
     * Eine Spur bleibt frei.
     */


    let safeLane =
        randomInt(
            0,
            2
        );


    /*
     * Nicht immer dieselbe Spur
     * frei lassen.
     */

    if (
        safeLane ===
        lastSafeLane
    ) {

        const alternatives = [
            0,
            1,
            2
        ].filter(
            lane =>
                lane !==
                lastSafeLane
        );


        safeLane =
            alternatives[
                randomInt(
                    0,
                    alternatives.length - 1
                )
            ];
    }


    /*
     * Blöcke erzeugen.
     */

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


    lastSafeLane =
        safeLane;


    lastWasSingleBlock =
        false;
}


/* =========================================
   HINDERNISSE ZURÜCKSETZEN
========================================= */

function resetObstacles() {

    for (
        const obstacle of
        obstacleObjects
    ) {

        scene.remove(
            obstacle
        );
    }


    obstacleObjects = [];


    gameDistance = 0;


    lastSafeLane = -1;

    lastWasSingleBlock = false;


    nextSpawnZ =
        SPAWN_DISTANCE;


    /*
     * Reihen nach hinten verteilen.
     */

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        spawnObstacleRow(
            nextSpawnZ
        );


        nextSpawnZ -=
            SPAWN_INTERVAL;
    }
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


    /*
     * Der hinterste Block.
     */

    let furthestZ =
        Infinity;


    for (
        const obstacle of
        obstacleObjects
    ) {

        if (
            obstacle.position.z <
            furthestZ
        ) {

            furthestZ =
                obstacle.position.z;
        }
    }


    /*
     * Neue Reihe erzeugen,
     * sobald genug Platz entstanden ist.
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

function updateObstacles(
    delta
) {

    const speed =
        getGameSpeed();


    for (
        let i =
            obstacleObjects.length - 1;
        i >= 0;
        i--
    ) {

        const obstacle =
            obstacleObjects[i];


        obstacle.position.z +=
            speed *
            delta;


        /*
         * Kollision nur während
         * des laufenden Spiels.
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
         * Strecke erhöhen.
         */

        if (
            obstacle.position.z >
            -5
        ) {

            /*
             * Wird nicht hier gezählt,
             * damit jeder Block nicht
             * mehrfach Strecke erzeugt.
             */
        }


        /*
         * Alte Blöcke entfernen.
         */

        if (
            obstacle.position.z >
            12
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


    const currentLane =
        typeof playerLane !==
        "undefined"
            ? playerLane
            : 1;


    const targetX =
        lanePositions[
            currentLane
        ];


    /*
     * Sanft zur Spur bewegen.
     */

    player.position.x +=
        (
            targetX -
            player.position.x
        ) * 0.18;
}


/* =========================================
   MÜNZE ERSTELLEN
========================================= */

function createCoin(
    lane,
    z
) {

    const geometry =
        new THREE.CylinderGeometry(
            0.45,
            0.45,
            0.14,
            24
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            metalness: 0.7,
            roughness: 0.25
        });


    const coin =
        new THREE.Mesh(
            geometry,
            material
        );


    coin.rotation.z =
        Math.PI / 2;


    coin.position.set(
        lanePositions[lane],
        1.2,
        z
    );


    scene.add(
        coin
    );


    coinObjects.push(
        coin
    );
}


/* =========================================
   MÜNZEN ZURÜCKSETZEN
========================================= */

function resetCoins() {

    for (
        const coin of
        coinObjects
    ) {

        scene.remove(
            coin
        );
    }


    coinObjects = [];


    /*
     * Viele Münzen über die Strecke
     * verteilen.
     */

    let z =
        SPAWN_DISTANCE - 8;


    for (
        let i = 0;
        i < 35;
        i++
    ) {

        /*
         * Nicht jedes Mal Münzen.
         */

        if (
            Math.random() < 0.82
        ) {

            const lane =
                randomInt(
                    0,
                    2
                );


            createCoin(
                lane,
                z
            );
        }


        z -=
            randomInt(
                7,
                11
            );
    }
}


/* =========================================
   MÜNZEN BEWEGEN
========================================= */

function updateCoins(
    delta
) {

    const speed =
        getGameSpeed();


    for (
        let i =
            coinObjects.length - 1;
        i >= 0;
        i--
    ) {

        const coin =
            coinObjects[i];


        coin.position.z +=
            speed *
            delta;


        /*
         * Münze drehen.
         */

        coin.rotation.y +=
            delta * 5;


        /*
         * Kollision mit Spieler.
         */

        if (
            typeof gameRunning !==
            "undefined" &&
            gameRunning
        ) {

            if (
                checkCoinCollision(
                    coin
                )
            ) {

                if (
                    typeof addCoin ===
                    "function"
                ) {

                    addCoin();
                }


                scene.remove(
                    coin
                );


                coinObjects.splice(
                    i,
                    1
                );


                continue;
            }
        }


        /*
         * Alte Münzen entfernen.
         */

        if (
            coin.position.z >
            12
        ) {

            scene.remove(
                coin
            );


            coinObjects.splice(
                i,
                1
            );
        }
    }
}


/* =========================================
   MÜNZEN NACHSPAWNEN
========================================= */

function updateCoinSpawning() {

    /*
     * Wenn zu wenige Münzen auf
     * der Strecke sind, neue erzeugen.
     */

    if (
        coinObjects.length >= 12
    ) {

        return;
    }


    let furthestZ =
        Infinity;


    for (
        const coin of
        coinObjects
    ) {

        if (
            coin.position.z <
            furthestZ
        ) {

            furthestZ =
                coin.position.z;
        }
    }


    /*
     * Falls keine Münzen mehr
     * vorhanden sind.
     */

    if (
        furthestZ === Infinity
    ) {

        furthestZ =
            -80;
    }


    /*
     * Neue Münze.
     */

    const lane =
        randomInt(
            0,
            2
        );


    createCoin(
        lane,
        furthestZ - 12
    );
}


/* =========================================
   MÜNZEN-KOLLISION
========================================= */

function checkCoinCollision(
    coin
) {

    if (!player) {

        return false;
    }


    const xDistance =
        Math.abs(
            player.position.x -
            coin.position.x
        );


    const zDistance =
        Math.abs(
            player.position.z -
            coin.position.z
        );


    return (
        xDistance < 1.05 &&
        zDistance < 1.25
    );
}


/* =========================================
   GESAMTSTRECKE
========================================= */

function updateDistance(
    delta
) {

    if (
        typeof gameRunning ===
        "undefined" ||
        !gameRunning
    ) {

        return;
    }


    gameDistance +=
        getGameSpeed() *
        delta;
}


/* =========================================
   ANIMATION
========================================= */

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
     * Nur bewegen, wenn das
     * Spiel tatsächlich läuft.
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

        updateCoins(
            delta
        );

        updateSpawning();

        updateCoinSpawning();

        updateDistance(
            delta
        );
    }


    /*
     * Immer rendern.
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


    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}


/* =========================================
   START
========================================= */

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
