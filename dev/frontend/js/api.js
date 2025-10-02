const API = {
  base: () => window.__CONFIG__.API_BASE,
  token: null,
  setToken(t) { this.token = t; localStorage.setItem("emerald_token", t); },
  loadToken() { this.token = localStorage.getItem("emerald_token"); },
  headers() {
    const h = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = "Bearer " + this.token;
    return h;
  },
  async get(path) {
    const res = await fetch(this.base() + path, { headers: this.headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(this.base() + path, { method: "POST", headers: this.headers(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async put(path, body) {
    const res = await fetch(this.base() + path, { method: "PUT", headers: this.headers(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};