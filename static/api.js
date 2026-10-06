import { Storage } from "./storage.js";

async function req(path, opts = {}) {
  const r = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export const API = {
  async createGuest(name) {
    const data = await req("/api/auth/guest", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    Storage.setUser({ ...data.user, is_guest: true });
    return data;
  },

  async register(email, password, name) {
    const data = await req("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    Storage.setUser({ ...data.user, is_guest: false });
    return data.user;
  },

  async login(email, password) {
    const data = await req("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    Storage.setUser({ ...data.user, is_guest: false });
    return data.user;
  },

  async logout() {
    try { await req("/api/auth/logout", { method: "POST" }); } catch {}
    Storage.clearAll();
  },

  async me() {
    return req("/api/me");
  },

  async pullSave() {
    return req("/api/save");
  },

  async pushSave(save) {
    return req("/api/save", {
      method: "POST",
      body: JSON.stringify(save),
    });
  },

  async leaderboard() {
    return req("/api/leaderboard");
  },

  async bootstrap() {
    try {
      const { user } = await API.me();
      if (user) {
        Storage.setUser(user);
        const save = await API.pullSave();
        if (save) Storage.setSave(save);
        return { user, save, source: "server" };
      }
      // Kein Login serverseitig
      Storage.clearAll();
      return { user: null, save: null, source: "none" };
    } catch (err) {
      // Offline – Cache nutzen
      const cachedUser = Storage.getUser();
      const cachedSave = Storage.getSave();
      return { user: cachedUser, save: cachedSave, source: "cache" };
    }
  },
};
