// ============================================================================
// EMERALD DEVDASHBOARD - Main App
// ============================================================================

// Dynamische Backend-URL basierend auf Environment
const API_BASE = (() => {
  // Im Development: Backend auf Port 8080 (wenn Frontend auf 8000)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const port = window.location.port === '8000' ? 8080 : window.location.port;
    return `http://localhost:${port}/devdash`;
  }
  // In Production: gleiche Domain
  return window.location.origin + '/devdash';
})();

const BOT_USERNAME = 'EmeraldContentBot';
const TOKEN_KEY = 'emerald_devdash_token';

console.log('🚀 DevDashboard initialized');
console.log('📡 API_BASE:', API_BASE);
console.log('🤖 BOT_USERNAME:', BOT_USERNAME);

const app = {
  user: null,
  token: null,
  stats: {},

  // ========== INIT ==========
  async init() {
    console.log('⏳ Initializing app...');
    this.token = localStorage.getItem(TOKEN_KEY);
    console.log('🔑 Token from storage:', this.token ? 'Found' : 'Not found');
    
    if (this.token) {
      try {
        await this.verifyToken();
        this.showMainUI();
        await this.loadDashboard();
      } catch (e) {
        console.error('Token verification failed:', e);
        this.showLoginUI();
      }
    } else {
      this.showLoginUI();
    }

    this.setupEventListeners();
  },

  // ========== AUTH ==========
  async verifyToken() {
    const res = await this.fetch('/auth/check');
    if (!res.ok) throw new Error('Token invalid');
    return await res.json();
  },

  showLoginUI() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
    this.mountTelegramWidget();
  },

  showMainUI() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
  },

  mountTelegramWidget() {
    const slot = document.getElementById('tgLoginSlot');
    slot.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-userpic', 'true');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'handleTelegramAuthCallback');
    slot.appendChild(script);
  },

  async handleTelegramAuth(user) {
    console.log('🔐 Telegram Auth Callback received:', user);
    try {
      const res = await fetch(API_BASE + '/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      console.log('📡 Server response status:', res.status);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`Auth failed: ${res.status} - ${errData.error || 'Unknown error'}`);
      }
      const data = await res.json();
      console.log('✅ Auth successful, token received');
      
      localStorage.setItem(TOKEN_KEY, data.access_token);
      this.token = data.access_token;
      
      this.showMainUI();
      await this.loadDashboard();
    } catch (e) {
      console.error('❌ Login error:', e);
      alert('Login fehlgeschlagen: ' + e.message);
    }
  },

  // ========== API ==========
  async fetch(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    return fetch(API_BASE + path, {
      ...options,
      headers
    });
  },

  async get(path) {
    const res = await this.fetch(path);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  },

  async post(path, data) {
    const res = await this.fetch(path, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  },

  async put(path, data) {
    const res = await this.fetch(path, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  },

  async delete(path) {
    const res = await this.fetch(path, { method: 'DELETE' });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  },

  // ========== DASHBOARD ==========
  async loadDashboard() {
    try {
      const me = await this.get('/me');
      this.user = me;
      this.renderUserBox(me);

      const overview = await this.get('/metrics/overview');
      this.stats = overview;
      this.renderStats(overview);

      const events = await this.get('/token-events?limit=20');
      this.renderTokenEvents(events.events);

      // Load other tabs
      await this.loadBots();
      await this.loadUsers();
      await this.loadAds();
    } catch (e) {
      console.error('Dashboard load error:', e);
      alert('Fehler beim Laden des Dashboards');
    }
  },

  renderUserBox(me) {
    const box = document.getElementById('userBox');
    const profile = me.profile || {};
    const img = profile.photo_url ? `<img src="${profile.photo_url}">` : '';
    box.innerHTML = `
      ${img}
      <div class="user-info">
        <div class="user-name">@${profile.username || 'User'}</div>
        <div class="user-role">${me.role} • ${me.tier}</div>
      </div>
    `;
  },

  renderStats(overview) {
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = `
      <div class="stat-box">
        <div class="label">Benutzer</div>
        <div class="value">${overview.users_total || 0}</div>
      </div>
      <div class="stat-box">
        <div class="label">Werbungen (aktiv)</div>
        <div class="value">${overview.ads_active || 0}</div>
      </div>
      <div class="stat-box">
        <div class="label">Bots (aktiv)</div>
        <div class="value">${overview.bots_active || 0}</div>
      </div>
      <div class="stat-box">
        <div class="label">Token Events</div>
        <div class="value">${overview.token_events_total || 0}</div>
      </div>
    `;
  },

  renderTokenEvents(events) {
    const list = document.getElementById('tokenEventsList');
    if (!events || events.length === 0) {
      list.innerHTML = '<div class="empty-state">Keine Events</div>';
      return;
    }

    const html = `
      <table>
        <thead>
          <tr>
            <th>Zeit</th>
            <th>Typ</th>
            <th>Menge</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          ${events.slice(0, 10).map(e => `
            <tr>
              <td>${new Date(e.happened_at).toLocaleString('de-DE')}</td>
              <td><span class="badge badge-success">${e.kind}</span></td>
              <td>${parseFloat(e.amount).toFixed(2)}</td>
              <td>${e.unit}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    list.innerHTML = html;
  },

  // ========== BOTS ==========
  async loadBots() {
    try {
      const data = await this.get('/bots');
      const bots = data.bots || data;
      this.renderBots(bots);

      const metrics = await this.get('/bots/metrics');
      this.renderBotMetrics(metrics.bots);
    } catch (e) {
      console.error('Load bots error:', e);
    }
  },

  renderBots(bots) {
    const list = document.getElementById('botsList');
    if (!bots || bots.length === 0) {
      list.innerHTML = '<div class="empty-state">Keine Bots</div>';
      return;
    }

    list.innerHTML = bots.map(b => `
      <div class="item-card">
        <h4>🤖 ${b.username || b.title || 'Bot'}</h4>
        <p>${b.title || b.description || 'Keine Beschreibung'}</p>
        <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center;">
          <span class="badge ${b.is_active ? 'badge-success' : 'badge-danger'}">
            ${b.is_active ? 'Aktiv' : 'Inaktiv'}
          </span>
          ${b.endpoint_count ? `<span class="badge badge-warning">${b.endpoint_count} Endpoints</span>` : ''}
        </div>
      </div>
    `).join('');
  },

  renderBotMetrics(metrics) {
    const card = document.getElementById('botMetricsCard');
    const content = document.getElementById('botMetricsContent');
    
    if (!metrics || metrics.length === 0) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    content.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Bot</th>
            <th>Endpoints</th>
            <th>Status</th>
            <th>Letzte Health-Check</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.map(m => `
            <tr>
              <td>${m.username}</td>
              <td>${m.endpoint_count || 0}</td>
              <td><span class="badge ${m.is_active ? 'badge-success' : 'badge-danger'}">${m.is_active ? 'Online' : 'Offline'}</span></td>
              <td>${m.last_health_check ? new Date(m.last_health_check).toLocaleString('de-DE') : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  showAddBotForm() {
    this.showModal('Neuer Bot', `
      <div class="form-group">
        <label>Bot-Name</label>
        <input type="text" id="botName" placeholder="z.B. Content Bot">
      </div>
      <div class="form-group">
        <label>Slug (eindeutig)</label>
        <input type="text" id="botSlug" placeholder="z.B. content-bot">
      </div>
      <div class="form-group">
        <label>Titel</label>
        <input type="text" id="botTitle" placeholder="Anzeigename">
      </div>
      <button onclick="app.createBot()" style="width: 100%; margin-top: 20px;">Erstellen</button>
    `);
  },

  async createBot() {
    const name = document.getElementById('botName')?.value;
    const slug = document.getElementById('botSlug')?.value;
    const title = document.getElementById('botTitle')?.value;

    if (!name || !slug) {
      alert('Name und Slug erforderlich');
      return;
    }

    try {
      await this.post('/bots', { username: slug, title: title || name, is_active: true });
      alert('Bot erstellt!');
      this.closeModal();
      await this.loadBots();
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  },

  // ========== USERS ==========
  async loadUsers() {
    try {
      const data = await this.get('/users');
      const users = data.users || data;
      this.renderUsers(users);
    } catch (e) {
      console.error('Load users error:', e);
    }
  },

  renderUsers(users) {
    const table = document.getElementById('usersTable');
    const tbody = table?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          ${u.photo_url ? `<img src="${u.photo_url}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; vertical-align: middle;">` : ''}
          <strong>${u.first_name || u.username || 'User'}</strong>
        </td>
        <td>${u.telegram_id}</td>
        <td><span class="badge badge-warning">${u.role || 'user'}</span></td>
        <td><span class="badge badge-success">${u.tier || 'free'}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString('de-DE')}</td>
        <td>
          <button class="btn-secondary" onclick="app.showUserTierForm(${u.telegram_id}, '${u.tier}')">Tier ändern</button>
        </td>
      </tr>
    `).join('');
  },

  showUserTierForm(tgId, currentTier) {
    this.showModal('Tier ändern', `
      <div class="form-group">
        <label>Neuer Tier</label>
        <select id="tierSelect">
          <option value="free" ${currentTier === 'free' ? 'selected' : ''}>Free</option>
          <option value="pro" ${currentTier === 'pro' ? 'selected' : ''}>Pro</option>
          <option value="enterprise" ${currentTier === 'enterprise' ? 'selected' : ''}>Enterprise</option>
        </select>
      </div>
      <button onclick="app.changeTier(${tgId})" style="width: 100%; margin-top: 20px;">Speichern</button>
    `);
  },

  async changeTier(tgId) {
    const tier = document.getElementById('tierSelect')?.value;
    if (!tier) return;

    try {
      await this.post('/users/tier', { telegram_id: tgId, tier });
      alert('Tier aktualisiert');
      this.closeModal();
      await this.loadUsers();
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  },

  // ========== ADS ==========
  async loadAds() {
    try {
      const data = await this.get('/ads');
      const ads = data.ads || data;
      this.renderAds(ads);
    } catch (e) {
      console.error('Load ads error:', e);
    }
  },

  renderAds(ads) {
    const list = document.getElementById('adsList');
    if (!ads || ads.length === 0) {
      list.innerHTML = '<div class="empty-state">Keine Werbungen</div>';
      return;
    }

    list.innerHTML = ads.map(a => `
      <div class="item-card">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <h4>📢 ${a.name}</h4>
          <span class="badge ${a.is_active ? 'badge-success' : 'badge-danger'}">
            ${a.is_active ? 'Aktiv' : 'Inaktiv'}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 10px;">
          Platzierung: <strong>${a.placement}</strong>
          ${a.bot_slug ? `• Bot: <strong>${a.bot_slug}</strong>` : ''}
        </p>
        <div class="code-block" style="max-height: 150px; overflow: hidden; text-overflow: ellipsis;">${a.content}</div>
        <div class="btn-group" style="margin-top: 10px;">
          <button class="btn-secondary" onclick="app.showEditAdForm(${a.id})">Bearbeiten</button>
          <button class="btn-danger" onclick="app.deleteAd(${a.id})">Löschen</button>
        </div>
      </div>
    `).join('');
  },

  showCreateAdForm() {
    this.showModal('Neue Werbung', `
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="adName" placeholder="z.B. Winter Promotion">
      </div>
      <div class="form-group">
        <label>Platzierung</label>
        <select id="adPlacement">
          <option value="header">Header</option>
          <option value="sidebar">Sidebar</option>
          <option value="in-bot">In Bot</option>
          <option value="story">Story</option>
          <option value="inline">Inline</option>
        </select>
      </div>
      <div class="form-group">
        <label>Inhalt (Text/HTML/JSON)</label>
        <textarea id="adContent" placeholder="Werbeinhalt..."></textarea>
      </div>
      <div class="form-group">
        <label>Bot-Slug (optional)</label>
        <input type="text" id="adBotSlug" placeholder="z.B. content-bot">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="adActive" checked>
          Aktiv
        </label>
      </div>
      <button onclick="app.createAd()" style="width: 100%; margin-top: 20px;">Erstellen</button>
    `);
  },

  async createAd() {
    const name = document.getElementById('adName')?.value;
    const placement = document.getElementById('adPlacement')?.value;
    const content = document.getElementById('adContent')?.value;
    const botSlug = document.getElementById('adBotSlug')?.value || null;
    const isActive = document.getElementById('adActive')?.checked;

    if (!name || !content) {
      alert('Name und Inhalt erforderlich');
      return;
    }

    try {
      await this.post('/ads', {
        name,
        placement,
        content,
        bot_slug: botSlug,
        is_active: isActive
      });
      alert('Werbung erstellt!');
      this.closeModal();
      await this.loadAds();
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  },

  showEditAdForm(adId) {
    // Placeholder for edit functionality
    alert('Edit Ad: ' + adId);
  },

  async deleteAd(adId) {
    if (!confirm('Wirklich löschen?')) return;
    try {
      await this.delete(`/ads/${adId}`);
      alert('Werbung gelöscht');
      await this.loadAds();
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  },

  // ========== TOKEN EVENTS ==========
  showCreateEventForm() {
    this.showModal('Neues Token Event', `
      <div class="form-group">
        <label>Typ</label>
        <select id="eventKind">
          <option value="mint">Mint</option>
          <option value="burn">Burn</option>
          <option value="reward">Reward</option>
          <option value="fee">Fee</option>
          <option value="redeem">Redeem</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      <div class="form-group">
        <label>Menge</label>
        <input type="number" id="eventAmount" placeholder="z.B. 100" step="0.01">
      </div>
      <div class="form-group">
        <label>Unit</label>
        <input type="text" id="eventUnit" value="EMRLD">
      </div>
      <div class="form-group">
        <label>Notiz</label>
        <input type="text" id="eventNote" placeholder="Optional">
      </div>
      <button onclick="app.createTokenEvent()" style="width: 100%; margin-top: 20px;">Erstellen</button>
    `);
  },

  async createTokenEvent() {
    const kind = document.getElementById('eventKind')?.value;
    const amount = parseFloat(document.getElementById('eventAmount')?.value);
    const unit = document.getElementById('eventUnit')?.value || 'EMRLD';
    const note = document.getElementById('eventNote')?.value;

    if (!kind || !amount || isNaN(amount)) {
      alert('Typ und Menge erforderlich');
      return;
    }

    try {
      await this.post('/token-events', { kind, amount, unit, note });
      alert('Event erstellt!');
      this.closeModal();
      await this.loadDashboard();
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  },

  // ========== WALLETS ==========
  async setTonAddress() {
    const address = document.getElementById('tonInput')?.value;
    if (!address) {
      alert('Adresse erforderlich');
      return;
    }

    try {
      await this.post('/wallets/ton', { address });
      alert('TON Adresse gespeichert');
      await this.loadWallets();
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  },

  async loadWallets() {
    try {
      const data = await this.get('/wallets');
      if (data.me?.ton_address) {
        document.getElementById('tonInput').value = data.me.ton_address;
      }
    } catch (e) {
      console.error('Load wallets error:', e);
    }
  },

  // ========== UI ==========
  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      });
    });
  },

  switchTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => {
      el.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tab)?.classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  },

  showModal(title, content) {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modalContent');
    
    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3>${title}</h3>
        <button onclick="app.closeModal()" style="background: none; border: none; color: #cbd5e1; font-size: 24px; cursor: pointer;">×</button>
      </div>
      <div>${content}</div>
    `;
    
    overlay.style.display = 'block';
    modal.style.display = 'block';
  },

  closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('modalContent').style.display = 'none';
  },

  async refreshAll() {
    await this.loadDashboard();
  },

  async refreshUsers() {
    await this.loadUsers();
  },

  async refreshAds() {
    await this.loadAds();
  },

  async refreshBots() {
    await this.loadBots();
  },

  showDevPanel() {
    alert('Dev Panel - Weitere Features folgen');
  }
};

// ========== GLOBAL HANDLER FOR TELEGRAM WIDGET ==========
// Diese globale Funktion wird vom Telegram Widget aufgerufen
function handleTelegramAuthCallback(user) {
  console.log('🌍 Global callback triggered with user:', user);
  app.handleTelegramAuth(user);
}

// ========== INIT ==========
window.app = app;
window.addEventListener('DOMContentLoaded', () => app.init());
