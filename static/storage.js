const KEY_USER = "genga_user";
const KEY_SAVE = "genga_save";

export const Storage = {
  getUser() {
    try { return JSON.parse(localStorage.getItem(KEY_USER) || "null"); }
    catch { return null; }
  },
  setUser(user) {
    if (user) localStorage.setItem(KEY_USER, JSON.stringify(user));
    else localStorage.removeItem(KEY_USER);
  },

  getSave() {
    try { return JSON.parse(localStorage.getItem(KEY_SAVE) || "null"); }
    catch { return null; }
  },
  setSave(save) {
    if (save) localStorage.setItem(KEY_SAVE, JSON.stringify(save));
  },

  clearAll() {
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(KEY_SAVE);
  },
};

export function defaultSave() {
  return {
    score: 0,
    coins: 0,
    best_score: 0,
    difficulty: "normal",
    upgrades: {},
    updated_at: Math.floor(Date.now() / 1000),
  };
}
