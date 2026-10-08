/* =========================================================
   GENGA SURFER
   SHOP / SKINS / UPGRADES / SAVE
========================================================= */

const SAVE_KEY = "gengaSurferSaveV2";
const RUN_SAVE_KEY = "gengaSurferCurrentRun";

const defaultSave = {
  coins: 0,

  ownedSkins: ["blue"],
  selectedSkin: "blue",

  upgrades: {
    scoreBoost: 0,
    extraLife: 0
  },

  activeUpgrades: {
    scoreBoost: false,
    extraLife: false
  },

  bestScore: 0
};

const skinDefinitions = {
  blue: {
    name: "Blue",
    color: 0x2196f3,
    cost: 0
  },

  green: {
    name: "Green",
    color: 0x32d583,
    cost: 250
  },

  red: {
    name: "Red",
    color: 0xff4d5a,
    cost: 500
  },

  purple: {
    name: "Purple",
    color: 0xa66cff,
    cost: 750
  },

  gold: {
    name: "Gold",
    color: 0xffc83d,
    cost: 1000
  }
};

const upgradeDefinitions = {
  scoreBoost: {
    name: "Score Boost",
    description: "Du bekommst für die Laufzeit 1,5x Score.",
    cost: 400
  },

  extraLife: {
    name: "Extra Life",
    description: "Der erste Zusammenstoß beendet den Run nicht.",
    cost: 600
  }
};

let saveData = loadSave();

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);

    if (!raw) {
      return structuredClone(defaultSave);
    }

    const loaded = JSON.parse(raw);

    return {
      coins: Number(loaded.coins) || 0,

      ownedSkins:
        Array.isArray(loaded.ownedSkins) && loaded.ownedSkins.length
          ? loaded.ownedSkins
          : ["blue"],

      selectedSkin:
        loaded.selectedSkin && skinDefinitions[loaded.selectedSkin]
          ? loaded.selectedSkin
          : "blue",

      upgrades: {
        scoreBoost: Number(loaded.upgrades?.scoreBoost) || 0,
        extraLife: Number(loaded.upgrades?.extraLife) || 0
      },

      activeUpgrades: {
        scoreBoost: Boolean(loaded.activeUpgrades?.scoreBoost),
        extraLife: Boolean(loaded.activeUpgrades?.extraLife)
      },

      bestScore: Number(loaded.bestScore) || 0
    };
  } catch (error) {
    console.warn("Save konnte nicht geladen werden:", error);
    return structuredClone(defaultSave);
  }
}

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(saveData)
    );
  } catch (error) {
    console.warn("Save konnte nicht gespeichert werden:", error);
  }
}

function getCoins() {
  return saveData.coins;
}

function addCoins(amount) {
  amount = Math.max(0, Math.floor(amount));

  saveData.coins += amount;

  saveGame();
  updateCoinDisplays();
}

function spendCoins(amount) {
  amount = Math.max(0, Math.floor(amount));

  if (saveData.coins < amount) {
    return false;
  }

  saveData.coins -= amount;

  saveGame();
  updateCoinDisplays();

  return true;
}

function updateCoinDisplays() {
  const elements = [
    document.getElementById("coinCount"),
    document.getElementById("menuCoinCount"),
    document.getElementById("shopCoins")
  ];

  elements.forEach(element => {
    if (element) {
      element.textContent = saveData.coins;
    }
  });
}

function getSelectedSkinColor() {
  const skin =
    skinDefinitions[saveData.selectedSkin] ||
    skinDefinitions.blue;

  return skin.color;
}

function getSelectedSkinId() {
  return saveData.selectedSkin;
}

function buySkin(id) {
  const skin = skinDefinitions[id];

  if (!skin) {
    return;
  }

  if (saveData.ownedSkins.includes(id)) {
    saveData.selectedSkin = id;

    saveGame();
    updateShop();

    if (typeof applyPlayerSkin === "function") {
      applyPlayerSkin();
    }

    return;
  }

  if (!spendCoins(skin.cost)) {
    return;
  }

  saveData.ownedSkins.push(id);
  saveData.selectedSkin = id;

  saveGame();

  updateShop();

  if (typeof applyPlayerSkin === "function") {
    applyPlayerSkin();
  }
}

function buyUpgrade(id) {
  const upgrade = upgradeDefinitions[id];

  if (!upgrade) {
    return;
  }

  if (!spendCoins(upgrade.cost)) {
    return;
  }

  saveData.upgrades[id]++;

  saveGame();
  updateShop();
}

function toggleUpgrade(id) {
  if (!saveData.upgrades[id]) {
    return;
  }

  saveData.activeUpgrades[id] =
    !saveData.activeUpgrades[id];

  saveGame();
  updateShop();
}

function prepareRunUpgrades() {
  const modifiers = {
    scoreMultiplier: 1,
    extraLife: false,
    extraLifeUsed: false
  };

  if (
    saveData.activeUpgrades.scoreBoost &&
    saveData.upgrades.scoreBoost > 0
  ) {
    modifiers.scoreMultiplier = 1.5;

    saveData.upgrades.scoreBoost--;

    saveData.activeUpgrades.scoreBoost = false;
  }

  if (
    saveData.activeUpgrades.extraLife &&
    saveData.upgrades.extraLife > 0
  ) {
    modifiers.extraLife = true;

    saveData.upgrades.extraLife--;

    saveData.activeUpgrades.extraLife = false;
  }

  saveGame();
  updateShop();

  return modifiers;
}

function consumeExtraLife() {
  if (
    typeof runModifiers === "undefined" ||
    !runModifiers.extraLife ||
    runModifiers.extraLifeUsed
  ) {
    return false;
  }

  runModifiers.extraLifeUsed = true;

  showPowerupMessage("EXTRA LIFE!");

  return true;
}

function updateShop() {
  updateCoinDisplays();

  renderSkins();
  renderUpgrades();
}

function renderSkins() {
  const container = document.getElementById("skinItems");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  Object.entries(skinDefinitions).forEach(([id, skin]) => {
    const owned = saveData.ownedSkins.includes(id);
    const selected = saveData.selectedSkin === id;

    const item = document.createElement("div");
    item.className = "shopItem";

    const color =
      "#" + skin.color.toString(16).padStart(6, "0");

    let buttonText = "";

    if (selected) {
      buttonText = "AUSGEWÄHLT";
    } else if (owned) {
      buttonText = "AUSWÄHLEN";
    } else {
      buttonText = `🪙 ${skin.cost} KAUFEN`;
    }

    item.innerHTML = `
      <div
        class="skinPreview"
        style="background:#${skin.color
          .toString(16)
          .padStart(6, "0")}"
      ></div>

      <h4>${skin.name}</h4>

      <p>
        ${owned ? "Besitzt du bereits." : `Preis: ${skin.cost} Coins`}
      </p>

      <button
        data-skin="${id}"
        ${selected ? "disabled" : ""}
      >
        ${buttonText}
      </button>
    `;

    container.appendChild(item);
  });

  container
    .querySelectorAll("[data-skin]")
    .forEach(button => {
      button.addEventListener("click", () => {
        buySkin(button.dataset.skin);
      });
    });
}

function renderUpgrades() {
  const container = document.getElementById("upgradeItems");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  Object.entries(upgradeDefinitions).forEach(([id, upgrade]) => {
    const charges = saveData.upgrades[id] || 0;
    const active = saveData.activeUpgrades[id];

    const item = document.createElement("div");

    item.className =
      "upgradeItem" +
      (active ? " activeUpgrade" : "");

    item.innerHTML = `
      <h4>${upgrade.name}</h4>

      <p>
        ${upgrade.description}
      </p>

      <span class="charge">
        Anzahl: ${charges}
      </span>

      <button data-buy-upgrade="${id}">
        🪙 ${upgrade.cost} KAUFEN
      </button>

      <button
        data-toggle-upgrade="${id}"
        ${charges <= 0 ? "disabled" : ""}
      >
        ${
          active
            ? "✓ AKTIVIERT"
            : "AKTIVIEREN"
        }
      </button>
    `;

    container.appendChild(item);
  });

  container
    .querySelectorAll("[data-buy-upgrade]")
    .forEach(button => {
      button.addEventListener("click", () => {
        buyUpgrade(button.dataset.buyUpgrade);
      });
    });

  container
    .querySelectorAll("[data-toggle-upgrade]")
    .forEach(button => {
      button.addEventListener("click", () => {
        toggleUpgrade(button.dataset.toggleUpgrade);
      });
    });
}

function showPowerupMessage(text) {
  const box = document.getElementById("powerupInfo");
  const textElement = document.getElementById("powerupText");

  if (!box || !textElement) {
    return;
  }

  textElement.textContent = text;

  box.classList.remove("hidden");

  clearTimeout(showPowerupMessage.timeout);

  showPowerupMessage.timeout =
    setTimeout(() => {
      box.classList.add("hidden");
    }, 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  updateShop();
  updateCoinDisplays();
});

window.addEventListener("pagehide", () => {
  saveGame();
});
