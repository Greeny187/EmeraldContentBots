/**
 * Story Sharing Dashboard
 * Leaderboard & Analytics für Story-Sharing
 */

class StoryDashboard {
  constructor(apiBase = '/api') {
    this.apiBase = apiBase;
    this.currentTab = 'leaderboard';
  }

  /**
   * Initialize dashboard
   */
  async init(containerId = 'story_dashboard') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; gap:8px; margin-bottom:16px; border-bottom:1px solid var(--ring); padding-bottom:12px">
        <button class="pill active" data-dashboard-tab="leaderboard" style="font-weight:600">🏆 Leaderboard</button>
        <button class="pill" data-dashboard-tab="myshares" style="font-weight:600">📊 Meine Shares</button>
        <button class="pill" data-dashboard-tab="stats" style="font-weight:600">📈 Statistiken</button>
      </div>
      <div id="dashboard_content">Lädt...</div>
    `;

    // Setup tab switching
    container.querySelectorAll('[data-dashboard-tab]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tab = e.target.dataset.dashboardTab;
        this.switchTab(tab, container);
      });
    });

    // Load leaderboard by default
    await this.switchTab('leaderboard', container);
  }

  /**
   * Switch dashboard tab
   */
  async switchTab(tab, container) {
    this.currentTab = tab;

    // Update button states
    container.querySelectorAll('[data-dashboard-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dashboardTab === tab);
    });

    // Load content
    const content = container.querySelector('#dashboard_content');
    content.innerHTML = '<div style="text-align:center">Lädt...</div>';

    let html = '';
    try {
      if (tab === 'leaderboard') {
        html = await this.loadLeaderboard();
      } else if (tab === 'myshares') {
        html = await this.loadUserShares();
      } else if (tab === 'stats') {
        html = await this.loadStats();
      }
      content.innerHTML = html;
    } catch (error) {
      console.error('Dashboard error:', error);
      content.innerHTML = '<p class="hint" style="color:var(--danger)">Fehler beim Laden</p>';
    }
  }

  /**
   * Load leaderboard
   */
  async loadLeaderboard(days = 7, limit = 15) {
    try {
      const response = await fetch(
        `${this.apiBase}/stories/top?days=${days}&limit=${limit}`
      );
      const data = await response.json();

      if (!data.success || !data.shares) {
        return '<p class="hint">Keine Shares vorhanden</p>';
      }

      let html = `
        <div style="display:flex; gap:6px; margin-bottom:12px; font-size:12px; color:var(--muted)">
          <button data-days="7" style="background:var(--brand); color:#08140f; border:none; border-radius:6px; padding:4px 10px; cursor:pointer; font-weight:600">7 Tage</button>
          <button data-days="30" style="background:transparent; border:1px solid var(--ring); border-radius:6px; padding:4px 10px; cursor:pointer">30 Tage</button>
          <button data-days="90" style="background:transparent; border:1px solid var(--ring); border-radius:6px; padding:4px 10px; cursor:pointer">90 Tage</button>
        </div>
      `;

      data.shares.forEach((share, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        const convRate = share.conversion_rate ? (share.conversion_rate * 100).toFixed(1) : '0.0';

        html += `
          <div class="item" style="background:rgba(34, 197, 94, ${0.05 + idx * 0.02})">
            <div class="left">
              <div class="title">${medal} ${share.group_name || 'Gruppe'}</div>
              <div class="hint">
                👁️ ${share.clicks} Clicks | 🔄 ${share.conversions} Konversionen | 
                <span style="color:var(--brand); font-weight:600">${convRate}% Rate</span>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:600; color:var(--brand)">+${share.total_rewards} Pts</div>
              <div class="hint" style="font-size:11px">${new Date(share.shared_at).toLocaleDateString('de-DE')}</div>
            </div>
          </div>
        `;
      });

      // Add event listeners for day buttons
      setTimeout(() => {
        document.querySelectorAll('[data-days]').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const days = parseInt(e.target.dataset.days);
            const content = document.querySelector('#dashboard_content');
            content.innerHTML = await this.loadLeaderboard(days, limit);
          });
        });
      }, 0);

      return html;

    } catch (error) {
      console.error('Leaderboard error:', error);
      return '<p class="hint" style="color:var(--danger)">Fehler beim Laden des Leaderboards</p>';
    }
  }

  /**
   * Load user's own shares
   */
  async loadUserShares() {
    try {
      const tg = window.Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;

      if (!user) {
        return '<p class="hint">User nicht gefunden. Bitte in Telegram verwenden.</p>';
      }

      const response = await fetch(
        `${this.apiBase}/stories/user/${user.id}?limit=20`
      );
      const data = await response.json();

      if (!data.success || !data.shares || data.shares.length === 0) {
        return '<p class="hint">Du hast noch keine Shares erstellt.</p>';
      }

      let html = `
        <div style="font-size:12px; color:var(--muted); margin-bottom:12px">
          Insgesamt: ${data.shares.length} Shares | 
          ∑ ${data.shares.reduce((a, s) => a + s.clicks, 0)} Clicks | 
          ∑ ${data.shares.reduce((a, s) => a + s.conversions, 0)} Konversionen
        </div>
      `;

      data.shares.forEach(share => {
        const convRate = share.clicks > 0 
          ? ((share.conversions / share.clicks) * 100).toFixed(1) 
          : '0.0';

        html += `
          <div class="item">
            <div class="left">
              <div class="title">${share.story_template || 'Unknown'} Share</div>
              <div class="hint">
                👁️ ${share.clicks} | 🔄 ${share.conversions} | ${convRate}% Conv.
              </div>
              <div class="hint" style="font-family:monospace; word-break:break-all; margin-top:4px">
                t.me/emerald_bot?start=story_${share.id}
              </div>
            </div>
            <div style="text-align:right">
              <button class="btn small" data-copy-link="${share.id}" style="display:block; margin-top:4px">
                📋 Link
              </button>
            </div>
          </div>
        `;
      });

      // Add copy listeners
      setTimeout(() => {
        document.querySelectorAll('[data-copy-link]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const shareId = e.target.dataset.copyLink;
            const link = `t.me/emerald_bot?start=story_${shareId}`;
            navigator.clipboard.writeText(link);
            e.target.textContent = '✅ Kopiert';
            setTimeout(() => { e.target.textContent = '📋 Link'; }, 2000);
          });
        });
      }, 0);

      return html;

    } catch (error) {
      console.error('User shares error:', error);
      return '<p class="hint" style="color:var(--danger)">Fehler beim Laden deiner Shares</p>';
    }
  }

  /**
   * Load general statistics
   */
  async loadStats() {
    try {
      // Get top shares data
      const response = await fetch(`${this.apiBase}/stories/top?days=7&limit=100`);
      const data = await response.json();

      if (!data.success || !data.shares) {
        return '<p class="hint">Keine Daten verfügbar</p>';
      }

      const shares = data.shares || [];
      const totalShares = shares.length;
      const totalClicks = shares.reduce((a, s) => a + (s.clicks || 0), 0);
      const totalConversions = shares.reduce((a, s) => a + (s.conversions || 0), 0);
      const avgConvRate = totalClicks > 0 
        ? ((totalConversions / totalClicks) * 100).toFixed(1) 
        : '0.0';
      const totalRewards = shares.reduce((a, s) => a + (s.total_rewards || 0), 0);

      const html = `
        <div class="grid">
          <div class="item" style="background:rgba(34, 197, 94, 0.1); border-color:var(--brand)">
            <div class="left">
              <div class="title">📈 Aktive Shares (7d)</div>
              <div style="font-size:24px; font-weight:800; color:var(--brand); margin-top:8px">${totalShares}</div>
            </div>
          </div>
          <div class="item" style="background:rgba(34, 197, 94, 0.1); border-color:var(--brand)">
            <div class="left">
              <div class="title">👁️ Gesamt Clicks</div>
              <div style="font-size:24px; font-weight:800; color:var(--brand); margin-top:8px">${totalClicks}</div>
            </div>
          </div>
          <div class="item" style="background:rgba(34, 197, 94, 0.1); border-color:var(--brand)">
            <div class="left">
              <div class="title">🔄 Konversionen</div>
              <div style="font-size:24px; font-weight:800; color:var(--brand); margin-top:8px">${totalConversions}</div>
            </div>
          </div>
          <div class="item" style="background:rgba(34, 197, 94, 0.1); border-color:var(--brand)">
            <div class="left">
              <div class="title">📊 Konversionsrate</div>
              <div style="font-size:24px; font-weight:800; color:var(--brand); margin-top:8px">${avgConvRate}%</div>
            </div>
          </div>
        </div>

        <div class="sep" style="margin:16px 0"></div>
        <h4 style="margin:12px 0 8px">Top 5 Performer (7 Tage)</h4>
        <div class="list">
          ${shares.slice(0, 5).map((s, i) => `
            <div class="item">
              <div class="left">
                <div class="title">${i + 1}. ${s.group_name || 'Gruppe'}</div>
                <div class="hint">👁️ ${s.clicks} | 🔄 ${s.conversions} | 🎁 +${s.total_rewards} Punkte</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="sep" style="margin:16px 0"></div>
        <div class="item" style="background:rgba(34, 197, 94, 0.15)">
          <div class="left">
            <div class="title">💰 Rewards diesen Monat</div>
            <div style="font-size:18px; font-weight:800; color:var(--brand); margin-top:4px">
              +${totalRewards} Punkte distribuiert
            </div>
            <div class="hint" style="margin-top:4px">≈ ${(totalRewards / 100).toFixed(2)} EMRD Tokens</div>
          </div>
        </div>
      `;

      return html;

    } catch (error) {
      console.error('Stats error:', error);
      return '<p class="hint" style="color:var(--danger)">Fehler beim Laden der Statistiken</p>';
    }
  }
}

// Export for use in HTML
window.StoryDashboard = StoryDashboard;
