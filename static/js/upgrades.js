/* =========================================
   GENGA SURFER
   UPGRADE SYSTEM
========================================= */

const UPGRADE_STORAGE_KEY =
    "gengaSurferUpgrades";

const COIN_STORAGE_KEY =
    "gengaSurferCoins";

const ACTIVE_UPGRADE_KEY =
    "gengaSurferActiveUpgrade";


/* =========================================
   UPGRADE DEFINITIONEN
========================================= */

const upgradeDefinitions = {

    scoreBoost: {

        name: "Score Boost",

        icon: "⭐",

        description:
            "Erhöht deinen Score-Multiplikator.",

        levels: [
            {
                multiplier: 1.10,
                cost: 300
            },
            {
                multiplier: 1.20,
                cost: 500
            },
            {
                multiplier: 1.35,
                cost: 800
            },
            {
                multiplier: 1.50,
                cost: 1200
            },
            {
                multiplier: 1.75,
                cost: 1800
            }
        ]
    },


    extraLife: {

        name: "Extra Life",

        icon: "❤️",

        description:
            "Überlebt eine Kollision.",

        levels: [
            {
                lives: 1,
                cost: 500
            },
            {
                lives: 2,
                cost: 900
            },
            {
                lives: 3,
                cost: 1500
            }
        ]
    },


    coinMagnet: {

        name: "Coin Magnet",

        icon: "🧲",

        description:
            "Sammelt Münzen aus größerer Entfernung.",

        levels: [
            {
                radius: 1.5,
                cost: 400
            },
            {
                radius: 2.0,
                cost: 700
            },
            {
                radius: 2.7,
                cost: 1100
            },
            {
                radius: 3.5,
                cost: 1700
            }
        ]
    },


    coinBoost: {

        name: "Coin Boost",

        icon: "💰",

        description:
            "Erhöht die Anzahl deiner verdienten Münzen.",

        levels: [
            {
                multiplier: 1.25,
                cost: 450
            },
            {
                multiplier: 1.50,
                cost: 750
            },
            {
                multiplier: 1.75,
                cost: 1200
            },
            {
                multiplier: 2.00,
                cost: 2000
            }
        ]
    },


    speedStart: {

        name: "Speed Start",

        icon: "⚡",

        description:
            "Startet den Run mit höherer Geschwindigkeit.",

        levels: [
            {
                speedBonus: 2,
                cost: 400
            },
            {
                speedBonus: 4,
                cost: 700
            },
            {
                speedBonus: 6,
                cost: 1100
            }
        ]
    }
};


/* =========================================
   DATEN LADEN
========================================= */

function loadUpgradeData() {

    let data;

    try {

        data =
            JSON.parse(
                localStorage.getItem(
                    UPGRADE_STORAGE_KEY
                )
            );

    } catch {

        data = null;
    }


    if (
        !data ||
        typeof data !== "object"
    ) {

        data = {};
    }


    for (
        const id of Object.keys(
            upgradeDefinitions
        )
    ) {

        if (
            typeof data[id] !==
            "number"
        ) {

            data[id] = 0;
        }
    }


    return data;
}


/* =========================================
   SPEICHERN
========================================= */

function saveUpgradeData(
    data
) {

    localStorage.setItem(
        UPGRADE_STORAGE_KEY,
        JSON.stringify(data)
    );
}


/* =========================================
   MÜNZEN
========================================= */

function getCoins() {

    const coins =
        Number(
            localStorage.getItem(
                COIN_STORAGE_KEY
            )
        );


    if (
        !Number.isFinite(coins)
    ) {

        return 0;
    }


    return coins;
}


function setCoins(
    amount
) {

    amount =
        Math.max(
            0,
            Math.floor(amount)
        );


    localStorage.setItem(
        COIN_STORAGE_KEY,
        String(amount)
    );


    updateCoinDisplays();
}


function spendCoins(
    amount
) {

    const coins =
        getCoins();


    if (
        coins < amount
    ) {

        return false;
    }


    setCoins(
        coins - amount
    );


    return true;
}


/* =========================================
   AKTIVES UPGRADE
========================================= */

function getActiveUpgrade() {

    return localStorage.getItem(
        ACTIVE_UPGRADE_KEY
    );
}


function setActiveUpgrade(
    upgradeId
) {

    if (
        !upgradeDefinitions[
            upgradeId
        ]
    ) {

        return;
    }


    localStorage.setItem(
        ACTIVE_UPGRADE_KEY,
        upgradeId
    );


    renderUpgradeMenu();
}


/* =========================================
   UPGRADE LEVEL
========================================= */

function getUpgradeLevel(
    upgradeId
) {

    const data =
        loadUpgradeData();


    return data[
        upgradeId
    ] || 0;
}


/* =========================================
   NÄCHSTES LEVEL KAUFEN
========================================= */

function buyUpgrade(
    upgradeId
) {

    const definition =
        upgradeDefinitions[
            upgradeId
        ];


    if (!definition) {

        return;
    }


    const data =
        loadUpgradeData();


    const currentLevel =
        data[
            upgradeId
        ] || 0;


    /*
     * Schon Max-Level
     */

    if (
        currentLevel >=
        definition.levels.length
    ) {

        return;
    }


    const nextLevel =
        definition.levels[
            currentLevel
        ];


    const price =
        nextLevel.cost;


    if (
        !spendCoins(price)
    ) {

        showUpgradeMessage(
            "Nicht genug Münzen! 🪙"
        );

        return;
    }


    data[
        upgradeId
    ] =
        currentLevel + 1;


    saveUpgradeData(
        data
    );


    showUpgradeMessage(
        `${definition.icon} ${definition.name} Level ${currentLevel + 1} freigeschaltet!`
    );


    renderUpgradeMenu();
}


/* =========================================
   UPGRADE EFFEKT
========================================= */

function getActiveUpgradeLevel() {

    const active =
        getActiveUpgrade();


    if (!active) {

        return 0;
    }


    return getUpgradeLevel(
        active
    );
}


function getActiveUpgradeDefinition() {

    const active =
        getActiveUpgrade();


    if (!active) {

        return null;
    }


    const level =
        getUpgradeLevel(
            active
        );


    if (
        level <= 0
    ) {

        return null;
    }


    const definition =
        upgradeDefinitions[
            active
        ];


    return {

        id: active,

        definition: definition,

        level: level,

        values:
            definition.levels[
                level - 1
            ]
    };
}


/* =========================================
   SCORE MULTIPLIER
========================================= */

function getScoreMultiplier() {

    const upgrade =
        getActiveUpgradeDefinition();


    if (
        !upgrade ||
        upgrade.id !==
        "scoreBoost"
    ) {

        return 1;
    }


    return upgrade.values
        .multiplier;
}


/* =========================================
   COIN MULTIPLIER
========================================= */

function getCoinMultiplier() {

    const upgrade =
        getActiveUpgradeDefinition();


    if (
        !upgrade ||
        upgrade.id !==
        "coinBoost"
    ) {

        return 1;
    }


    return upgrade.values
        .multiplier;
}


/* =========================================
   EXTRA LEBEN
========================================= */

function getExtraLives() {

    const upgrade =
        getActiveUpgradeDefinition();


    if (
        !upgrade ||
        upgrade.id !==
        "extraLife"
    ) {

        return 0;
    }


    return upgrade.values
        .lives;
}


/* =========================================
   COIN MAGNET
========================================= */

function getCoinMagnetRadius() {

    const upgrade =
        getActiveUpgradeDefinition();


    if (
        !upgrade ||
        upgrade.id !==
        "coinMagnet"
    ) {

        return 0;
    }


    return upgrade.values
        .radius;
}


/* =========================================
   START SPEED BONUS
========================================= */

function getStartSpeedBonus() {

    const upgrade =
        getActiveUpgradeDefinition();


    if (
        !upgrade ||
        upgrade.id !==
        "speedStart"
    ) {

        return 0;
    }


    return upgrade.values
        .speedBonus;
}


/* =========================================
   UPGRADE MENÜ ERSTELLEN
========================================= */

function createUpgradeMenu() {

    if (
        document.getElementById(
            "upgradeMenu"
        )
    ) {

        return;
    }


    const menu =
        document.createElement(
            "div"
        );


    menu.id =
        "upgradeMenu";


    menu.innerHTML = `

        <div class="upgrade-header">

            <h2>
                UPGRADES
            </h2>

            <div
                id="upgradeCoinDisplay"
                class="upgrade-coins"
            >
                🪙 0
            </div>

        </div>

        <div
            id="upgradeMessage"
            class="upgrade-message"
        ></div>

        <div
            id="upgradeList"
            class="upgrade-list"
        ></div>

    `;


    /*
     * Vor dem Hauptmenü einfügen.
     */

    const startScreen =
        document.getElementById(
            "startScreen"
        );


    if (startScreen) {

        startScreen.appendChild(
            menu
        );

    } else {

        document.body.appendChild(
            menu
        );
    }


    renderUpgradeMenu();
}


/* =========================================
   UPGRADE MENÜ RENDERN
========================================= */

function renderUpgradeMenu() {

    const list =
        document.getElementById(
            "upgradeList"
        );


    if (!list) {

        return;
    }


    const data =
        loadUpgradeData();


    const active =
        getActiveUpgrade();


    list.innerHTML = "";


    for (
        const id of Object.keys(
            upgradeDefinitions
        )
    ) {

        const definition =
            upgradeDefinitions[id];


        const level =
            data[id] || 0;


        const maxLevel =
            definition.levels.length;


        const isMax =
            level >= maxLevel;


        const isActive =
            active === id;


        let nextText;


        if (isMax) {

            nextText =
                "MAX LEVEL";

        } else {

            nextText =
                `${definition.levels[level].cost} 🪙`;
        }


        let effectText =
            "";


        if (
            level > 0
        ) {

            const current =
                definition.levels[
                    level - 1
                ];


            if (
                current.multiplier
            ) {

                effectText =
                    `x${current.multiplier}`;
            }


            if (
                current.lives
            ) {

                effectText =
                    `${current.lives} Leben`;
            }


            if (
                current.radius
            ) {

                effectText =
                    `${current.radius}m Radius`;
            }


            if (
                current.speedBonus
            ) {

                effectText =
                    `+${current.speedBonus} Speed`;
            }
        }


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "upgrade-card";


        card.innerHTML = `

            <div class="upgrade-icon">
                ${definition.icon}
            </div>

            <div class="upgrade-info">

                <div class="upgrade-name">
                    ${definition.name}
                </div>

                <div class="upgrade-description">
                    ${definition.description}
                </div>

                <div class="upgrade-level">
                    Level ${level}/${maxLevel}
                    ${
                        effectText
                            ? ` • ${effectText}`
                            : ""
                    }
                </div>

            </div>

            <div class="upgrade-actions">

                ${
                    isMax

                    ? `
                        <button
                            class="upgrade-button max"
                            disabled
                        >
                            MAX
                        </button>
                    `

                    : `
                        <button
                            class="upgrade-button buy"
                            data-upgrade="${id}"
                        >
                            KAUFEN
                            <br>
                            ${nextText}
                        </button>
                    `
                }

                ${
                    level > 0

                    ? `
                        <button
                            class="upgrade-button activate ${
                                isActive
                                    ? "selected"
                                    : ""
                            }"
                            data-activate="${id}"
                        >
                            ${
                                isActive
                                    ? "✓ AKTIV"
                                    : "AKTIVIEREN"
                            }
                        </button>
                    `

                    : ""
                }

            </div>
        `;


        list.appendChild(
            card
        );
    }


    updateCoinDisplays();
}


/* =========================================
   COIN DISPLAY
========================================= */

function updateCoinDisplays() {

    const coins =
        getCoins();


    const elements =
        document.querySelectorAll(
            "#upgradeCoinDisplay, .coin-display"
        );


    elements.forEach(
        element => {

            element.textContent =
                `🪙 ${coins.toLocaleString(
                    "de-DE"
                )}`;
        }
    );
}


/* =========================================
   MESSAGE
========================================= */

let upgradeMessageTimeout;


function showUpgradeMessage(
    message
) {

    const element =
        document.getElementById(
            "upgradeMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        message;


    clearTimeout(
        upgradeMessageTimeout
    );


    upgradeMessageTimeout =
        setTimeout(
            () => {

                element.textContent =
                    "";

            },
            2500
        );
}


/* =========================================
   BUTTON EVENTS
========================================= */

document.addEventListener(
    "click",
    event => {

        const buyButton =
            event.target.closest(
                "[data-upgrade]"
            );


        if (buyButton) {

            buyUpgrade(
                buyButton.dataset.upgrade
            );

            return;
        }


        const activateButton =
            event.target.closest(
                "[data-activate]"
            );


        if (activateButton) {

            setActiveUpgrade(
                activateButton.dataset.activate
            );
        }
    }
);


/* =========================================
   START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createUpgradeMenu();

        updateCoinDisplays();
    }
);
