window.App = (function() {
  const tabsEl = document.getElementById("tabs");
  const sections = ["overview","metrics","bots","tiers","ads","flags","settings"];
  const btns = document.querySelectorAll("button.tab");
  let chart;

  function showTab(name) {
    sections.forEach(s => document.getElementById(s).classList.add("hidden"));
    document.getElementById(name).classList.remove("hidden");
    btns.forEach(b => b.classList.remove("ring-1","ring-emerald-400/50"));
    document.querySelector(`[data-tab="${name}"]`).classList.add("ring-1","ring-emerald-400/50");
  }

  async function initUI() {
    btns.forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
    document.getElementById("btnAddBot").addEventListener("click", addBotPrompt);
    document.getElementById("btnAddAd").addEventListener("click", addAdPrompt);
    document.getElementById("btnAddFlag").addEventListener("click", addFlagPrompt);
    document.getElementById("btnLoadAds").addEventListener("click", fetchAds);
    document.getElementById("btnLoadSettings").addEventListener("click", fetchSettings);
    document.getElementById("btnAddSetting").addEventListener("click", addSettingPrompt);
    const mk = document.getElementById("metricKey"); if (mk) mk.addEventListener("change", drawChart);
  }

  function setUserBox(me) {
    const el = document.getElementById("userBox");
    const u = me.user || {};
    const img = u.photo_url ? `<img src="${u.photo_url}" class="w-7 h-7 rounded-full object-cover"/>` : "";
    el.innerHTML = `<div class="flex items-center gap-2">${img}<span>@${u.username || u.id} • ${me.role} • ${me.tier}</span></div>`;
  }

  async function fetchOverview() {
    const o = await API.get("/metrics/overview");
    if (document.getElementById("statUsers")) document.getElementById("statUsers").textContent = o.users_total;
    if (document.getElementById("statAds")) document.getElementById("statAds").textContent = o.ads_active;
    if (document.getElementById("statBots")) document.getElementById("statBots").textContent = o.bots_active;
  }

  async function fetchBots() {
    const list = document.getElementById("botsList");
    if (!list) return;
    list.innerHTML = "";
    const bots = await API.get("/bots");
    bots.forEach(b => {
      const card = document.createElement("div");
      card.className = "glass rounded-xl p-3 flex items-center justify-between";
      card.innerHTML = `<div>
        <div class="font-medium">${b.name}</div>
        <div class="text-xs text-slate-400">${b.slug}${b.description ? " – " + b.description : ""}</div>
      </div>
      <div class="text-xs px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40">${b.is_active ? "active" : "inactive"}</div>`;
      list.appendChild(card);
    });
  }

  async function addBotPrompt() {
    const name = prompt("Bot Name?");
    if (!name) return;
    const slug = prompt("Slug (unique, z. B. content-bot)?");
    if (!slug) return;
    const description = prompt("Beschreibung (optional)?") || null;
    await API.post("/bots", { name, slug, description, is_active: true });
    await fetchBots();
    alert("Bot hinzugefügt: " + name);
  }

  async function fetchTiers() {
    const list = document.getElementById("tiersList");
    if (!list) return;
    list.innerHTML = "";
    const rows = await API.get("/tiers");
    rows.forEach(r => {
      const item = document.createElement("div");
      item.className = "glass rounded-xl p-3 flex items-center justify-between";
      item.innerHTML = `<div>
        <div class="font-medium">@${r.username || r.telegram_id}</div>
        <div class="text-xs text-slate-400">${r.role} • ${r.tier}</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="text-xs px-2 py-1 rounded bg-slate-500/10 border border-slate-400/30" data-action="free">Free</button>
        <button class="text-xs px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40" data-action="pro">Pro</button>
      </div>`;
      item.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", async () => {
          await API.post("/tiers", { telegram_id: r.telegram_id, tier: btn.dataset.action });
          await fetchTiers();
        });
      });
      list.appendChild(item);
    });
  }

  async function fetchAds() {
    const list = document.getElementById("adsList");
    if (!list) return;
    list.innerHTML = "";
    const slug = document.getElementById("adsBotSlug").value || null;
    const path = slug ? `/ads?bot_slug=${encodeURIComponent(slug)}` : "/ads";
    const ads = await API.get(path);
    ads.forEach(a => {
      const card = document.createElement("div");
      card.className = "glass rounded-xl p-3";
      card.innerHTML = `<div class="flex items-center justify-between">
        <div class="font-medium">${a.name}${a.bot_slug ? ` <span class='text-xs text-slate-400'>(${a.bot_slug})</span>` : ""}</div>
        <div class="text-xs px-2 py-1 rounded ${a.is_active ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-slate-500/20 border border-slate-400/40"}">${a.is_active ? "active" : "inactive"}</div>
      </div>
      <div class="text-xs text-slate-400 mt-1">Placement: ${a.placement}</div>
      <pre class="text-xs mt-2 whitespace-pre-wrap">${a.content}</pre>`;
      list.appendChild(card);
    });
  }

  async function addAdPrompt() {
    const name = prompt("Name der Werbung?");
    if (!name) return;
    const placement = prompt("Placement (header|sidebar|in-bot|story|inline)?", "header");
    if (!placement) return;
    const content = prompt("Inhalt (Text/HTML/JSON)?");
    if (content == null) return;
    const bot_slug = prompt("Bot-Slug (optional für Targeting)?") || null;
    await API.post("/ads", { name, placement, content, is_active: true, bot_slug });
    await fetchAds();
  }

  async function fetchFlags() {
    const list = document.getElementById("flagsList");
    if (!list) return;
    list.innerHTML = "";
    const flags = await API.get("/feature-flags");
    flags.forEach(f => {
      const card = document.createElement("div");
      card.className = "glass rounded-xl p-3";
      card.innerHTML = `<div class="font-medium">${f.key}</div>
        <pre class="text-xs mt-1 whitespace-pre-wrap">${JSON.stringify(f.value, null, 2)}</pre>
        <div class="text-xs text-slate-400 mt-1">${f.description || ""}</div>`;
      list.appendChild(card);
    });
  }

  async function fetchSettings() {
    const scope = document.getElementById("settingsScope").value || "global";
    const list = document.getElementById("settingsList");
    if (!list) return;
    list.innerHTML = "";
    const rows = await API.get(`/settings?scope=${encodeURIComponent(scope)}`);
    rows.forEach(r => {
      const card = document.createElement("div");
      card.className = "glass rounded-xl p-3";
      card.innerHTML = `<div class="font-medium">${r.key}</div>
        <pre class="text-xs mt-1 whitespace-pre-wrap">${JSON.stringify(r.value, null, 2)}</pre>
        <div class="text-xs text-slate-400 mt-1">Scope: ${r.scope}</div>`;
      list.appendChild(card);
    });
  }

  async function drawChart() {
    if (!window.Chart) return;
    const mk = document.getElementById("metricKey");
    if (!mk) return;
    const key = mk.value;
    const data = await API.get("/metrics/timeseries?days=14");
    const series = data[key] || [];
    const labels = series.map(x => x.date);
    const values = series.map(x => x.value);
    const ctx = document.getElementById("metricChart").getContext("2d");
    if (window._chart) window._chart.destroy();
    window._chart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets: [{ label: key, data: values, tension: 0.35 }] },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  async function initAfterLogin() {
    const tabsEl = document.getElementById("tabs");
    tabsEl.classList.remove("hidden");
    showTab("overview");

    const me = await API.get("/me");
    setUserBox(me);

    await Promise.all([
      fetchOverview(),
      fetchBots(),
      fetchTiers(),
      fetchAds(),
      fetchFlags(),
      fetchSettings()
    ]);

    await drawChart();
  }

  async function boot() {
    await initUI();
    if (API.token) {
      try {
        document.getElementById("loginCard").classList.add("hidden");
        await initAfterLogin();
      } catch {
        localStorage.removeItem("emerald_token");
        location.reload();
      }
    }
  }

  return { boot, initAfterLogin };
})();

window.addEventListener("DOMContentLoaded", window.App.boot);