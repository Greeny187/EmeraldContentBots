// Dashboard Configuration
const API_BASE = window.__DASHBOARD_CONFIG__?.api?.base || '/api';
const REFRESH_INTERVAL = window.__DASHBOARD_CONFIG__?.ui?.refreshInterval || 30000;

let currentUser = null;
let authToken = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  authToken = localStorage.getItem('auth_token');
  
  if (!authToken) {
    window.location.href = '/';
    return;
  }

  try {
    // Verify auth token
    await fetch(`${API_BASE}/auth/check`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(r => {
      if (!r.ok) throw new Error('Not authenticated');
    });

    // Load user data
    await loadUserProfile();
    await refreshOverview();

    // Auto-refresh
    setInterval(refreshOverview, REFRESH_INTERVAL);
  } catch (e) {
    console.error('Auth failed:', e);
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  }
});

// API Helper
async function apiCall(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Load User Profile
async function loadUserProfile() {
  try {
    const data = await apiCall('/me');
    currentUser = data;

    const userBox = document.getElementById('userBox');
    const profile = data.profile || {};
    const img = profile.photo_url ? `<img src="${profile.photo_url}" alt="Avatar">` : '';

    userBox.innerHTML = `
      ${img}
      <div class="user-info">
        <div class="user-name">@${profile.username || profile.id}</div>
        <div class="user-role">${data.role} • ${data.tier}</div>
      </div>
    `;
  } catch (e) {
    console.error('Failed to load user:', e);
  }
}

// Tab Navigation
function showTab(tabName) {
  // Hide all
  document.querySelectorAll('.content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));

  // Show selected
  const tab = document.getElementById(tabName);
  if (tab) {
    tab.classList.add('active');
    event.target.classList.add('active');
  }

  // Load tab-specific data
  switch (tabName) {
    case 'bots':
      loadBots();
      break;
    case 'statistics':
      loadStatistics();
      break;
    case 'wallets':
      loadWallets();
      break;
    case 'users':
      loadUsers();
      break;
    case 'ads':
      loadAds();
      break;
    case 'flags':
      loadFlags();
      break;
  }
}

// Overview
async function refreshOverview() {
  try {
    const data = await apiCall('/metrics/overview');
    document.getElementById('stat_users').textContent = data.users_total;
    document.getElementById('stat_bots').textContent = data.bots_active;
    document.getElementById('stat_ads').textContent = data.ads_active;
    document.getElementById('stat_events').textContent = data.token_events_total || 0;
  } catch (e) {
    console.error('Failed to load overview:', e);
  }
}

// Bots Management
async function loadBots() {
  try {
    const data = await apiCall('/bots');
    const botsList = document.getElementById('botsList');
    
    if (!data.bots || data.bots.length === 0) {
      botsList.innerHTML = '<p style="text-align: center; color: #cbd5e1;">No bots yet</p>';
      return;
    }

    botsList.innerHTML = data.bots.map(bot => `
      <div class="list-item">
        <div>
          <div class="item-title">🤖 ${bot.name}</div>
          <div class="item-desc">${bot.slug}${bot.description ? ' • ' + bot.description : ''}</div>
        </div>
        <span class="item-badge ${bot.is_active ? '' : 'inactive'}">
          ${bot.is_active ? '✓ Active' : '○ Inactive'}
        </span>
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load bots:', e);
    document.getElementById('botsList').innerHTML = `<div class="error-box">Error: ${e.message}</div>`;
  }
}

async function addBot() {
  const name = document.getElementById('botName').value.trim();
  const slug = document.getElementById('botSlug').value.trim();
  const description = document.getElementById('botDesc').value.trim() || null;

  if (!name || !slug) {
    alert('Name and slug are required');
    return;
  }

  try {
    await apiCall('/bots', {
      method: 'POST',
      body: JSON.stringify({ name, slug, description, is_active: true })
    });

    alert('✓ Bot created successfully');
    closeModal('addBotModal');
    loadBots();
    refreshOverview();
  } catch (e) {
    alert('✗ Error: ' + e.message);
  }
}

// Statistics
async function loadStatistics() {
  try {
    // System Health
    const health = await apiCall('/system/health');
    document.getElementById('sys_status').textContent = health.status === 'operational' ? '✓ Operational' : '✗ Degraded';
    document.getElementById('sys_uptime').textContent = health.uptime_percent + '%';
    document.getElementById('sys_db').textContent = '✓ ' + health.database;
    document.getElementById('sys_response').textContent = health.response_time_ms + 'ms';

    // Bot Activity
    const botActivity = await apiCall('/analytics/bot-activity');
    const botChart = document.getElementById('botActivityChart');
    if (botActivity.bot_activity && botActivity.bot_activity.length > 0) {
      botChart.innerHTML = botActivity.bot_activity.map(b => `
        <div class="list-item">
          <div>
            <div class="item-title">🤖 ${b.slug}</div>
            <div class="item-desc">Events: ${b.events || 0}</div>
          </div>
          <div style="width: 150px; height: 30px; background: rgba(16,185,129,0.1); border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${Math.min((b.events || 0) / 100, 1) * 100}%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
          </div>
        </div>
      `).join('');
    }

    // Moderation Stats
    const modStats = await apiCall('/moderation/stats');
    document.getElementById('mod_spam').textContent = modStats.spam_detected || 0;
    document.getElementById('mod_deleted').textContent = modStats.messages_deleted || 0;
    document.getElementById('mod_banned').textContent = modStats.users_banned || 0;

    // Payment Stats
    const payStats = await apiCall('/payment/stats');
    document.getElementById('pay_revenue').textContent = '$' + (payStats.total_revenue_usd || 0).toFixed(2);
    document.getElementById('pay_transactions').textContent = payStats.transactions_total || 0;
    document.getElementById('pay_avg').textContent = '$' + (payStats.avg_transaction || 0).toFixed(2);
  } catch (e) {
    console.error('Failed to load statistics:', e);
  }
}

// Wallets & Token Management
async function loadWallets() {
  try {
    // Load EMRD Token Info
    const emrd = await apiCall('/token/emrd');
    const emrdHTML = `
      <div class="stat-card">
        <div class="stat-label">💰 Price</div>
        <div class="stat-value">$${emrd.price_usd.toFixed(4)}<span class="stat-unit">USD</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">📊 Market Cap</div>
        <div class="stat-value">$${(emrd.market_cap / 1000000).toFixed(2)}M</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">👥 Holders</div>
        <div class="stat-value">${emrd.holders}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🔄 Supply</div>
        <div class="stat-value">${(emrd.circulating_supply / 1000000).toFixed(0)}M<span class="stat-unit">EMRD</span></div>
      </div>
      <div style="margin-top: 12px; padding: 8px; background: rgba(51,65,85,0.3); border-radius: 8px; font-family: monospace; font-size: 11px; word-break: break-all;">
        ${emrd.contract}
      </div>
    `;
    document.getElementById('emrdInfo').innerHTML = emrdHTML;

    // Setup buttons
    document.getElementById('btnDeDust').onclick = () => window.open(emrd.links.dedust, '_blank');
    document.getElementById('btnTonScan').onclick = () => window.open(emrd.links.tonscan, '_blank');

    // Load wallet data
    const data = await apiCall('/wallets');

    // Display watch accounts
    const watchHTML = data.watch.map(w => `
      <div class="list-item">
        <div>
          <div class="item-title">${w.label}</div>
          <div class="item-desc">${w.chain.toUpperCase()}: ${w.account_id.substring(0, 20)}...</div>
        </div>
      </div>
    `).join('');

    document.getElementById('watchAccounts').innerHTML = watchHTML || '<p style="text-align: center; color: #cbd5e1;">No watch accounts</p>';

    // Load NEAR and TON info
    if (data.me && data.me.near_account_id) {
      document.getElementById('nearAccount').value = data.me.near_account_id;
    }
    if (data.me && data.me.ton_address) {
      document.getElementById('tonAddress').value = data.me.ton_address;
    }
  } catch (e) {
    console.error('Failed to load wallets:', e);
  }
}

async function loadEmrdHolders() {
  try {
    const data = await apiCall('/token/holders?limit=20');
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'holdersModal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-close" onclick="document.getElementById('holdersModal').remove()">✕</div>
        <div class="modal-title">🟢 Top EMRD Holders</div>
        <table style="width: 100%; font-size: 12px;">
          <thead>
            <tr>
              <th>Address</th>
              <th>Balance</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            ${data.holders.map(h => `
              <tr>
                <td><code style="font-size: 10px;">${h.ton_address ? h.ton_address.substring(0, 15) + '...' : 'N/A'}</code></td>
                <td>${(h.balance / 1000000).toFixed(2)}M</td>
                <td>${(h.percentage || 0).toFixed(2)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

async function loadEmrdTransactions() {
  try {
    const data = await apiCall('/token/transactions?limit=30');
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'txModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-height: 80vh;">
        <div class="modal-close" onclick="document.getElementById('txModal').remove()">✕</div>
        <div class="modal-title">📜 EMRD Transactions</div>
        <table style="width: 100%; font-size: 11px;">
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>From</th>
              <th>To</th>
            </tr>
          </thead>
          <tbody>
            ${data.transactions.map(tx => `
              <tr>
                <td>${tx.type}</td>
                <td>${(tx.amount / 1000000).toFixed(2)}M</td>
                <td><code style="font-size: 9px;">${tx.from_address ? tx.from_address.substring(0, 10) : 'N/A'}</code></td>
                <td><code style="font-size: 9px;">${tx.to_address ? tx.to_address.substring(0, 10) : 'N/A'}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

async function loadNearAccount() {
  const account = document.getElementById('nearAccount').value.trim();
  if (!account) {
    alert('Enter a NEAR account');
    return;
  }

  try {
    const data = await apiCall(`/near/account/overview?account_id=${encodeURIComponent(account)}`);
    
    document.getElementById('nearStats').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Balance</div>
        <div class="stat-value">${parseFloat(data.near.amount_near).toFixed(2)}<span class="stat-unit">NEAR</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Locked</div>
        <div class="stat-value">${parseFloat(data.near.locked_near).toFixed(2)}<span class="stat-unit">NEAR</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Storage</div>
        <div class="stat-value">${(data.near.storage_usage / 1024).toFixed(2)}<span class="stat-unit">KB</span></div>
      </div>
    `;
  } catch (e) {
    alert('✗ Error: ' + e.message);
  }
}

async function saveTonAddress() {
  const address = document.getElementById('tonAddress').value.trim();
  if (!address) {
    alert('Enter a TON address');
    return;
  }

  try {
    await apiCall('/wallets/ton', {
      method: 'POST',
      body: JSON.stringify({ address })
    });

    alert('✓ TON address saved');
  } catch (e) {
    alert('✗ Error: ' + e.message);
  }
}

// Users Management
async function loadUsers() {
  try {
    const data = await apiCall('/tiers');
    const usersList = document.getElementById('usersList');

    if (!data.users || data.users.length === 0) {
      usersList.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users</td></tr>';
      return;
    }

    usersList.innerHTML = data.users.map(u => {
      const createdAt = new Date(u.created_at).toLocaleDateString();
      return `
        <tr>
          <td>${u.username ? '@' + u.username : u.telegram_id}</td>
          <td><code>${u.role}</code></td>
          <td><code>${u.tier}</code></td>
          <td>${createdAt}</td>
          <td>
            <select onchange="changeTier(${u.telegram_id}, this.value)">
              <option value="free" ${u.tier === 'free' ? 'selected' : ''}>free</option>
              <option value="pro" ${u.tier === 'pro' ? 'selected' : ''}>pro</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    console.error('Failed to load users:', e);
  }
}

async function changeTier(telegramId, tier) {
  try {
    await apiCall('/tiers', {
      method: 'POST',
      body: JSON.stringify({ telegram_id: telegramId, tier })
    });
    alert('✓ Tier updated');
  } catch (e) {
    alert('✗ Error: ' + e.message);
  }
}

// Ads Management
async function loadAds() {
  try {
    const data = await apiCall('/ads');
    const adsList = document.getElementById('adsList');

    if (!data.ads || data.ads.length === 0) {
      adsList.innerHTML = '<p style="text-align: center; color: #cbd5e1;">No ads</p>';
      return;
    }

    adsList.innerHTML = data.ads.map(ad => `
      <div class="list-item">
        <div>
          <div class="item-title">📢 ${ad.name}</div>
          <div class="item-desc">${ad.placement} • ${ad.bot_slug || 'all bots'}</div>
          <div class="item-desc" style="margin-top: 4px; font-size: 11px;">${ad.content.substring(0, 80)}...</div>
        </div>
        <span class="item-badge ${ad.is_active ? '' : 'inactive'}">
          ${ad.is_active ? '✓ Active' : '○ Inactive'}
        </span>
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load ads:', e);
  }
}

async function addAd() {
  const name = document.getElementById('adName').value.trim();
  const placement = document.getElementById('adPlacement').value;
  const content = document.getElementById('adContent').value.trim();

  if (!name || !content) {
    alert('Name and content are required');
    return;
  }

  try {
    await apiCall('/ads', {
      method: 'POST',
      body: JSON.stringify({
        name,
        placement,
        content,
        is_active: true
      })
    });

    alert('✓ Ad created');
    closeModal('addAdModal');
    loadAds();
  } catch (e) {
    alert('✗ Error: ' + e.message);
  }
}

// Feature Flags
async function loadFlags() {
  try {
    const data = await apiCall('/feature-flags');
    const flagsList = document.getElementById('flagsList');

    if (!data.flags || data.flags.length === 0) {
      flagsList.innerHTML = '<p style="text-align: center; color: #cbd5e1;">No flags</p>';
      return;
    }

    flagsList.innerHTML = data.flags.map(f => `
      <div class="list-item">
        <div>
          <div class="item-title">${f.key}</div>
          <div class="item-desc">${f.description || 'No description'}</div>
          <div class="item-desc" style="margin-top: 4px; font-size: 11px;"><code>${JSON.stringify(f.value).substring(0, 100)}...</code></div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load flags:', e);
  }
}

async function addFlag() {
  const key = document.getElementById('flagKey').value.trim();
  const value = document.getElementById('flagValue').value.trim();
  const description = document.getElementById('flagDesc').value.trim();

  if (!key || !value) {
    alert('Key and value are required');
    return;
  }

  try {
    const parsedValue = JSON.parse(value);
    await apiCall('/feature-flags', {
      method: 'POST',
      body: JSON.stringify({ key, value: parsedValue, description })
    });

    alert('✓ Flag created');
    closeModal('addFlagModal');
    loadFlags();
  } catch (e) {
    alert('✗ Error: ' + e.message);
  }
}

// Modal Management
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Settings
function changeTheme(theme) {
  localStorage.setItem('dashboard_theme', theme);
  if (theme === 'light') {
    document.body.style.filter = 'invert(1) hue-rotate(180deg)';
  } else {
    document.body.style.filter = 'none';
  }
}

function saveSettings() {
  const interval = document.getElementById('refreshInterval').value;
  localStorage.setItem('refresh_interval', interval);
  alert('✓ Settings saved');
}

// Logout
function logout() {
  localStorage.removeItem('auth_token');
  window.location.href = '/';
}

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(m => {
      m.classList.remove('active');
    });
  }
});
