
const SAVE_KEY = "gengaSurferSaveV2";
const RUN_SAVE_KEY = "gengaSurferCurrentRun";

const skinDefinitions = {
  blue:   { name: "Blau",   color: 0x2496ff, price: 0 },
  green:  { name: "Grün",   color: 0x35d07f, price: 250 },
  red:    { name: "Rot",    color: 0xff4c55, price: 500 },
  purple: { name: "Lila",   color: 0xa56bff, price: 750 },
  gold:   { name: "Gold",   color: 0xffc928, price: 1000 }
};

const upgradeDefinitions = {
  scoreBoost: {
    name: "Score-Boost",
    description: "1,5-fache Punkte für einen Run.",
    price: 400
  },
  extraLife: {
    name: "Extra-Leben",
    description: "Übersteht einmal eine Kollision.",
    price: 600
  }
};

const defaultSave = {
  coins: 0,
  ownedSkins: ["blue"],
  selectedSkin: "blue",
  upgrades: { scoreBoost: 0, extraLife: 0 },
  activeUpgrades: { scoreBoost: false, extraLife: false },
  bestScore: 0
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(defaultSave);

    const old = JSON.parse(raw);
    return {
      ...structuredClone(defaultSave),
      ...old,
      coins: Math.max(0, Number(old.coins) || 0),
      ownedSkins: Array.isArray(old.ownedSkins) ? old.ownedSkins : ["blue"],
      upgrades: { ...defaultSave.upgrades, ...(old.upgrades || {}) },
      activeUpgrades: { ...defaultSave.activeUpgrades, ...(old.activeUpgrades || {}) },
      bestScore: Math.max(0, Number(old.bestScore) || 0)
    };
  } catch (error) {
    console.warn("Spielstand konnte nicht gelesen werden:", error);
    return structuredClone(defaultSave);
  }
}

let saveData = loadSave();

let runModifiers = {
  scoreMultiplier: 1,
  extraLife: false,
  extraLifeUsed: false
};

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.warn("Spielstand konnte nicht gespeichert werden:", error);
  }
}

function getCoins() {
  return saveData.coins;
}

function addCoins(amount) {
  saveData.coins += Math.max(0, Math.floor(amount));
  saveGame();
  updateCoinDisplays();
}

function spendCoins(amount) {
  if (saveData.coins < amount) return false;
  saveData.coins -= amount;
  saveGame();
  updateCoinDisplays();
  return true;
}

function updateCoinDisplays() {
  ["coinCount", "menuCoinCount", "shopCoins"].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = saveData.coins;
  });
}

function getSelectedSkinColor() {
  const skin = skinDefinitions[saveData.selectedSkin] || skinDefinitions.blue;
  return skin.color;
}

function buySkin(id) {
  const skin = skinDefinitions[id];
  if (!skin) return;

  if (saveData.ownedSkins.includes(id)) {
    saveData.selectedSkin = id;
  } else {
    if (!spendCoins(skin.price)) {
      showPowerupMessage("Nicht genug Münzen!");
      return;
    }
    saveData.ownedSkins.push(id);
    saveData.selectedSkin = id;
  }

  saveGame();
  if (typeof applyPlayerSkin === "function") applyPlayerSkin();
  updateShop();
}

function buyUpgrade(id) {
  const upgrade = upgradeDefinitions[id];
  if (!upgrade || !spendCoins(upgrade.price)) {
    showPowerupMessage("Nicht genug Münzen!");
    return;
  }

  saveData.upgrades[id] = (Number(saveData.upgrades[id]) || 0) + 1;
  saveGame();
  updateShop();
  showPowerupMessage(upgrade.name + " gekauft!");
}

function toggleUpgrade(id) {
  if (!upgradeDefinitions[id]) return;

  const charges = Number(saveData.upgrades[id]) || 0;
  if (charges <= 0 && !saveData.activeUpgrades[id]) {
    showPowerupMessage("Kaufe zuerst eine Ladung!");
    return;
  }

  saveData.activeUpgrades[id] = !saveData.activeUpgrades[id];
  saveGame();
  updateShop();
}

function prepareRunUpgrades() {
  const result = {
    scoreMultiplier: 1,
    extraLife: false,
    extraLifeUsed: false
  };

  if (saveData.activeUpgrades.scoreBoost && saveData.upgrades.scoreBoost > 0) {
    result.scoreMultiplier = 1.5;
    saveData.upgrades.scoreBoost--;
    if (saveData.upgrades.scoreBoost <= 0) saveData.activeUpgrades.scoreBoost = false;
  }

  if (saveData.activeUpgrades.extraLife && saveData.upgrades.extraLife > 0) {
    result.extraLife = true;
    saveData.upgrades.extraLife--;
    if (saveData.upgrades.extraLife <= 0) saveData.activeUpgrades.extraLife = false;
  }

  runModifiers = result;
  saveGame();
  updateShop();
  return result;
}

function consumeExtraLife() {
  if (!runModifiers.extraLife || runModifiers.extraLifeUsed) return false;
  runModifiers.extraLifeUsed = true;
  showPowerupMessage("Extra-Leben benutzt!");
  return true;
}

function showPowerupMessage(message) {
  const box = document.getElementById("powerupInfo");
  const text = document.getElementById("powerupText");
  if (!box || !text) return;

  text.textContent = message;
  box.classList.remove("hidden");

  clearTimeout(showPowerupMessage.timer);
  showPowerupMessage.timer = setTimeout(() => {
    box.classList.add("hidden");
  }, 1800);
}

function updateShop() {
  updateCoinDisplays();
  renderSkins();
  renderUpgrades();
}

function renderSkins() {
  const container = document.getElementById("skinItems");
  if (!container) return;
  container.replaceChildren();

  Object.entries(skinDefinitions).forEach(([id, skin]) => {
    const owned = saveData.ownedSkins.includes(id);
    const selected = saveData.selectedSkin === id;
    const card = document.createElement("div");
    card.className = "shopItem";

    const preview = document.createElement("div");
    preview.className = "skinPreview";
    preview.style.background = "#" + skin.color.toString(16).padStart(6, "0");

    const title = document.createElement("h4");
    title.textContent = skin.name;

    const description = document.createElement("p");
    description.textContent = owned ? "Freigeschaltet" : `${skin.price} Münzen`;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = selected ? "Ausgewählt" : owned ? "Auswählen" : `Kaufen · ${skin.price}`;
    button.disabled = selected;

    button.addEventListener("click", () => buySkin(id));

    card.append(preview, title, description, button);
    container.append(card);
  });
}

function renderUpgrades() {
  const container = document.getElementById("upgradeItems");
  if (!container) return;
  container.replaceChildren();

  Object.entries(upgradeDefinitions).forEach(([id, upgrade]) => {
    const charges = Number(saveData.upgrades[id]) || 0;
    const active = Boolean(saveData.activeUpgrades[id]);

    const card = document.createElement("div");
    card.className = "upgradeItem" + (active ? " activeUpgrade" : "");

    const title = document.createElement("h4");
    title.textContent = upgrade.name;

    const description = document.createElement("p");
    description.textContent = upgrade.description;

    const charge = document.createElement("span");
    charge.className = "charge";
    charge.textContent = `Ladungen: ${charges}`;

    const buy = document.createElement("button");
    buy.type = "button";
    buy.textContent = `Kaufen · ${upgrade.price} 🪙`;
    buy.addEventListener("click", () => buyUpgrade(id));

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = active ? "Deaktivieren" : "Vor Run aktivieren";
    toggle.disabled = charges <= 0 && !active;
    toggle.addEventListener("click", () => toggleUpgrade(id));

    card.append(title, description, charge, buy, toggle);
    container.append(card);
  });
}

window.addEventListener("pagehide", saveGame);
