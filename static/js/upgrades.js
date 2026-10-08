/* =========================================
   GENGA SURFER
   COINS / SHOP / SKINS / UPGRADES
========================================= */

const COIN_KEY =
    "gengaSurferCoins";

const SKIN_KEY =
    "gengaSurferSkins";

const EQUIPPED_SKIN_KEY =
    "gengaSurferEquippedSkin";

const UPGRADE_KEY =
    "gengaSurferUpgrades";

const ACTIVE_UPGRADE_KEY =
    "gengaSurferActiveUpgrade";


/* =========================================
   SKINS
========================================= */

const skins = {

    blue: {
        name: "Standard Blau",
        color: 0x008cff,
        price: 0
    },

    red: {
        name: "Feuer Rot",
        color: 0xff3b30,
        price: 100
    },

    green: {
        name: "Neon Grün",
        color: 0x34c759,
        price: 250
    },

    purple: {
        name: "Cyber Lila",
        color: 0xaf52de,
        price: 500
    },

    yellow: {
        name: "Gold",
        color: 0xffcc00,
        price: 1000
    },

    cyan: {
        name: "Neon Cyan",
        color: 0x00e5ff,
        price: 1500
    },

    pink: {
        name: "Hot Pink",
        color: 0xff2d78,
        price: 2000
    },

    rainbow: {
        name: "Rainbow",
        color: 0xffffff,
        price: 3000
    }
};


/* =========================================
   UPGRADES
========================================= */

const upgradeDefinitions = {

    scoreBoost: {

        name: "Score Boost",

        icon: "⭐",

        description:
            "Erhöht deinen Score.",

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
            "Mehr Münzen pro eingesammelter Münze.",

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
            "Startet den Run schneller.",

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
   COINS
========================================= */

function getCoins() {

    const value =
        Number(
            localStorage.getItem(
                COIN_KEY
            )
        );


    return Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;
}


function setCoins(
    value
) {

    value =
        Math.max(
            0,
            Math.floor(value)
        );


    localStorage.setItem(
        COIN_KEY,
        String(value)
    );


    updateAllCoinDisplays();
}


function addCoins(
    amount
) {

    if (
        !Number.isFinite(amount)
    ) {
        return;
    }


    setCoins(
        getCoins() +
        Math.floor(amount)
    );
}


function spendCoins(
    amount
) {

    if (
        getCoins() < amount
    ) {
        return false;
    }


    setCoins(
        getCoins() - amount
    );


    return true;
}


/* =========================================
   SKINS
========================================= */

function loadOwnedSkins() {

    let data;


    try {

        data =
            JSON.parse(
                localStorage.getItem(
                    SKIN_KEY
                )
            );

    } catch {

        data = null;
    }


    if (
        !Array.isArray(data)
    ) {

        data = ["blue"];
    }


    if (
        !data.includes("blue")
    ) {

        data.push("blue");
    }


    return data;
}


function saveOwnedSkins(
    skinsArray
) {

    localStorage.setItem(
        SKIN_KEY,
        JSON.stringify(
            skinsArray
        )
    );
}


function getEquippedSkin() {

    const skin =
        localStorage.getItem(
            EQUIPPED_SKIN_KEY
        );


    if (
        !skins[skin]
    ) {

        return "blue";
    }


    return skin;
}


function equipSkin(
    skinId
) {

    const owned =
        loadOwnedSkins();


    if (
        !owned.includes(skinId)
    ) {
        return;
    }


    localStorage.setItem(
        EQUIPPED_SKIN_KEY,
        skinId
    );


    applySkinToPlayer();

    renderShop();
}


function buySkin(
    skinId
) {

    const skin =
        skins[skinId];


    if (!skin) {
        return;
    }


    const owned =
        loadOwnedSkins();


    if (
        owned.includes(skinId)
    ) {

        equipSkin(
            skinId
        );

        return;
    }


    if (
        !spendCoins(
            skin.price
        )
    ) {

        showShopMessage(
            "Nicht genug Münzen! 🪙"
        );

        return;
    }


    owned.push(
        skinId
    );


    saveOwnedSkins(
        owned
    );


    equipSkin(
        skinId
    );


    showShopMessage(
        `${skin.name} gekauft! 🎨`
    );
}


/* =========================================
   PLAYER SKIN ANWENDEN
========================================= */

function applySkinToPlayer() {

    if (
        typeof player ===
        "undefined" ||
        !player
    ) {
        return;
    }


    const skin =
        skins[
            getEquippedSkin()
        ];


    if (!skin) {
        return;
    }


    if (
        player.material &&
        player.material.color
    ) {

        player.material.color.setHex(
            skin.color
        );
    }
}


/* =========================================
   UPGRADE DATEN
========================================= */

function loadUpgradeData() {

    let data;


    try {

        data =
            JSON.parse(
                localStorage.getItem(
                    UPGRADE_KEY
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
            typeof data[id] !== "number"
        ) {

            data[id] = 0;
        }
    }


    return data;
}


function saveUpgradeData(
    data
) {

    localStorage.setItem(
        UPGRADE_KEY,
        JSON.stringify(data)
    );
}


function getUpgradeLevel(
    id
) {

    const data =
        loadUpgradeData();


    return data[id] || 0;
}


/* =========================================
   UPGRADE KAUFEN
========================================= */

function buyUpgrade(
    id
) {

    const definition =
        upgradeDefinitions[id];


    if (!definition) {
        return;
    }


    const data =
        loadUpgradeData();


    const currentLevel =
        data[id] || 0;


    if (
        currentLevel >=
        definition.levels.length
    ) {

        return;
    }


    const next =
        definition.levels[
            currentLevel
        ];


    if (
        !spendCoins(
            next.cost
        )
    ) {

        showUpgradeMessage(
            "Nicht genug Münzen! 🪙"
        );

        return;
    }


    data[id] =
        currentLevel + 1;


    saveUpgradeData(
        data
    );


    showUpgradeMessage(
        `${definition.icon} ${definition.name} Level ${currentLevel + 1}!`
    );


    renderUpgrades();
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
    id
) {

    if (
        getUpgradeLevel(id) <= 0
    ) {
        return;
    }


    localStorage.setItem(
        ACTIVE_UPGRADE_KEY,
        id
    );


    renderUpgrades();

    updateMenuActiveUpgrade();
}


function getActiveUpgradeDefinition() {

    const id =
        getActiveUpgrade();


    if (!id) {
        return null;
    }


    const level =
        getUpgradeLevel(id);


    if (level <= 0) {
        return null;
    }


    const definition =
        upgradeDefinitions[id];


    return {

        id: id,

        definition: definition,

        level: level,

        values:
            definition.levels[
                level - 1
            ]
    };
}


/* =========================================
   UPGRADE EFFEKTE
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


    return upgrade.values.multiplier;
}


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


    return upgrade.values.multiplier;
}


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


    return upgrade.values.lives;
}


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


    return upgrade.values.radius;
}


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


    return upgrade.values.speedBonus;
}


/* =========================================
   SHOP RENDERN
========================================= */

function renderShop() {

    const list =
        document.getElementById(
            "skinList"
        );


    if (!list) {
        return;
    }


    const owned =
        loadOwnedSkins();


    const equipped =
        getEquippedSkin();


    list.innerHTML = "";


    for (
        const id of Object.keys(
            skins
        )
    ) {

        const skin =
            skins[id];


        const isOwned =
            owned.includes(id);


        const isEquipped =
            equipped === id;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "skin-card";


        const color =
            "#" +
            skin.color
                .toString(16)
                .padStart(6, "0");


        let buttonText;


        if (isEquipped) {

            buttonText =
                "✓ AUSGERÜSTET";

        } else if (isOwned) {

            buttonText =
                "AUSRÜSTEN";

        } else {

            buttonText =
                `KAUFEN • ${skin.price} 🪙`;
        }


        card.innerHTML = `

            <div
                class="skin-preview"
                style="background:${color}"
            ></div>

            <div class="skin-name">
                ${skin.name}
            </div>

            <div class="skin-price">
                ${
                    skin.price === 0
                        ? "Kostenlos"
                        : skin.price + " 🪙"
                }
            </div>

            <button
                class="skin-button ${
                    isEquipped
                        ? "equipped"
                        : isOwned
                            ? "owned"
                            : ""
                }"
                data-skin="${id}"
            >
                ${buttonText}
            </button>

        `;


        list.appendChild(
            card
        );
    }


    updateAllCoinDisplays();
}


/* =========================================
   UPGRADE RENDERN
========================================= */

function renderUpgrades() {

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


        const maxed =
            level >= maxLevel;


        const activeUpgrade =
            active === id;


        let effect = "";


        if (level > 0) {

            const current =
                definition.levels[
                    level - 1
                ];


            if (
                current.multiplier
            ) {

                effect =
                    `x${current.multiplier}`;
            }


            if (
                current.lives
            ) {

                effect =
                    `${current.lives} ❤️`;
            }


            if (
                current.radius
            ) {

                effect =
                    `${current.radius}m`;
            }


            if (
                current.speedBonus
            ) {

                effect =
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
                        effect
                            ? " • " + effect
                            : ""
                    }
                </div>

            </div>

            <div class="upgrade-actions">

                ${
                    maxed

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
                            data-upgrade-buy="${id}"
                        >
                            KAUFEN
                            <br>
                            ${definition.levels[level].cost} 🪙
                        </button>
                    `
                }

                ${
                    level > 0

                    ? `
                        <button
                            class="upgrade-button activate ${
                                activeUpgrade
                                    ? "selected"
                                    : ""
                            }"
                            data-upgrade-activate="${id}"
                        >
                            ${
                                activeUpgrade
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


    updateAllCoinDisplays();
}


/* =========================================
   COIN DISPLAYS
========================================= */

function updateAllCoinDisplays() {

    const coins =
        getCoins();


    const elements =
        document.querySelectorAll(
            "#menuCoins, #shopCoins, #upgradeCoins, #hudCoins"
        );


    elements.forEach(
        element => {

            element.textContent =
                `🪙 ${coins.toLocaleString("de-DE")}`;
        }
    );
}


/* =========================================
   MENU UPGRADE
========================================= */

function updateMenuActiveUpgrade() {

    const element =
        document.getElementById(
            "menuActiveUpgrade"
        );


    if (!element) {
        return;
    }


    const upgrade =
        getActiveUpgradeDefinition();


    if (!upgrade) {

        element.textContent =
            "Kein Upgrade aktiv";

        return;
    }


    element.textContent =
        `${upgrade.definition.icon} ${upgrade.definition.name} Lv.${upgrade.level}`;
}


/* =========================================
   SHOP MESSAGE
========================================= */

let shopMessageTimer;


function showShopMessage(
    message
) {

    const element =
        document.getElementById(
            "shopCoins"
        );


    if (!element) {
        return;
    }


    const old =
        element.textContent;


    element.textContent =
        message;


    clearTimeout(
        shopMessageTimer
    );


    shopMessageTimer =
        setTimeout(
            () => {

                updateAllCoinDisplays();

            },
            1800
        );
}


/* =========================================
   UPGRADE MESSAGE
========================================= */

let upgradeMessageTimer;


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
        upgradeMessageTimer
    );


    upgradeMessageTimer =
        setTimeout(
            () => {

                element.textContent =
                    "";

            },
            2000
        );
}


/* =========================================
   BUTTONS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderShop();

        renderUpgrades();

        updateAllCoinDisplays();

        updateMenuActiveUpgrade();


        const shopButton =
            document.getElementById(
                "shopButton"
            );


        const upgradeButton =
            document.getElementById(
                "upgradeButton"
            );


        const shopScreen =
            document.getElementById(
                "shopScreen"
            );


        const upgradeScreen =
            document.getElementById(
                "upgradeScreen"
            );


        const closeShop =
            document.getElementById(
                "closeShopButton"
            );


        const closeUpgrade =
            document.getElementById(
                "closeUpgradeButton"
            );


        if (shopButton) {

            shopButton.onclick =
                () => {

                    shopScreen.classList.remove(
                        "hidden"
                    );

                    renderShop();
                };
        }


        if (upgradeButton) {

            upgradeButton.onclick =
                () => {

                    upgradeScreen.classList.remove(
                        "hidden"
                    );

                    renderUpgrades();
                };
        }


        if (closeShop) {

            closeShop.onclick =
                () => {

                    shopScreen.classList.add(
                        "hidden"
                    );
                };
        }


        if (closeUpgrade) {

            closeUpgrade.onclick =
                () => {

                    upgradeScreen.classList.add(
                        "hidden"
                    );
                };
        }
    }
);


/* =========================================
   DELEGATED SHOP / UPGRADE CLICKS
========================================= */

document.addEventListener(
    "click",
    event => {

        const skinButton =
            event.target.closest(
                "[data-skin]"
            );


        if (skinButton) {

            buySkin(
                skinButton.dataset.skin
            );

            return;
        }


        const buyButton =
            event.target.closest(
                "[data-upgrade-buy]"
            );


        if (buyButton) {

            buyUpgrade(
                buyButton.dataset.upgradeBuy
            );

            return;
        }


        const activateButton =
            event.target.closest(
                "[data-upgrade-activate]"
            );


        if (activateButton) {

            setActiveUpgrade(
                activateButton.dataset.upgradeActivate
            );
        }
    }
);
