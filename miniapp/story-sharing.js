/**
 * Story Sharing UI Components
 * Integration für die Emerald Miniapp
 */

class StorySharing {
  constructor(apiBase = '/api') {
    this.apiBase = apiBase;
    this.templates = {};
    this.currentShare = null;
  }

  /**
   * Initialize story sharing UI
   */
  async init() {
    try {
      // Load templates
      const response = await fetch(`${this.apiBase}/stories/templates`);
      const data = await response.json();
      
      if (data.success) {
        this.templates = data.templates;
        this.setupEventListeners();
        return true;
      }
    } catch (error) {
      console.error('Story sharing init error:', error);
    }
    return false;
  }

  /**
   * Setup event listeners for story buttons
   */
  setupEventListeners() {
    // Story action buttons
    const shareButtons = document.querySelectorAll('[data-story-action]');
    shareButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.storyAction;
        this.handleStoryAction(action, btn);
      });
    });
  }

  /**
   * Handle story action (from button click)
   */
  async handleStoryAction(template, button) {
    try {
      // Get Telegram WebApp context
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        alert('Diese Funktion funktioniert nur in Telegram');
        return;
      }

      const user = tg.initDataUnsafe?.user;
      if (!user) {
        alert('User Informationen nicht verfügbar');
        return;
      }

      // Create story share
      const share = await this.createShare(
        user.id,
        0, // chat_id (wird in content bot gesetzt)
        template,
        document.querySelector('[data-group-name]')?.dataset.groupName || 'Meine Gruppe'
      );

      if (!share) {
        alert('Fehler beim Erstellen des Story-Shares');
        return;
      }

      // Show share UI
      this.showShareUI(share, template, user.first_name);

    } catch (error) {
      console.error('Story action error:', error);
      alert('Ein Fehler ist aufgetreten');
    }
  }

  /**
   * Create a story share
   */
  async createShare(userId, chatId, template, groupName) {
    try {
      const response = await fetch(`${this.apiBase}/stories/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          chat_id: chatId,
          template: template,
          group_name: groupName
        })
      });

      const data = await response.json();
      return data.success ? data.share : null;

    } catch (error) {
      console.error('Create share error:', error);
      return null;
    }
  }

  /**
   * Show share UI modal
   */
  showShareUI(share, template, userName) {
    const modal = this.createShareModal(share, template, userName);
    document.body.appendChild(modal);
    
    // Setup modal close
    modal.querySelector('[data-close]')?.addEventListener('click', () => {
      modal.remove();
    });

    // Setup share buttons
    modal.querySelector('[data-share-story]')?.addEventListener('click', () => {
      this.shareStory(share, template);
      modal.remove();
    });

    modal.querySelector('[data-copy-link]')?.addEventListener('click', () => {
      navigator.clipboard.writeText(share.referral_link);
      alert('✅ Link kopiert!');
    });
  }

  /**
   * Create share modal HTML
   */
  createShareModal(share, template, userName) {
    const style = this.templates.find(t => t.id === template) || {};
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: var(--panel);
        border: 1px solid var(--ring);
        border-radius: 16px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: var(--shadow);
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
          <h2 style="margin:0; font-size:20px; color:var(--brand)">${style.emoji} ${style.title}</h2>
          <button data-close style="
            background: transparent;
            border: none;
            color: var(--text);
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
          ">×</button>
        </div>

        <p style="color:var(--muted); margin:0 0 16px">${style.description}</p>

        <div style="
          background: rgba(16, 199, 160, 0.1);
          border: 1px solid rgba(16, 199, 160, 0.3);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 16px;
          word-break: break-all;
        ">
          <div style="font-size:12px; color:var(--muted); margin-bottom:6px">🔗 Dein Link:</div>
          <code style="color:var(--brand); font-family:monospace">${share.referral_link}</code>
        </div>

        <div style="display:flex; gap:8px; margin-bottom:16px">
          <button data-copy-link style="
            flex: 1;
            padding: 10px;
            border: 1px solid var(--ring);
            background: transparent;
            color: var(--text);
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">📋 Link Kopieren</button>
          <button data-share-story style="
            flex: 1;
            padding: 10px;
            border: none;
            background: var(--brand);
            color: #08140f;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">✨ Story teilen</button>
        </div>

        <div style="font-size:12px; color:var(--muted); background:var(--ring); padding:10px; border-radius:8px">
          💚 Du erhältst <strong>${style.reward_points} Punkte</strong> für das Teilen!<br>
          Für jede neue Person, die sich anmeldet: <strong>100 Punkte</strong> Bonus!
        </div>
      </div>
    `;

    return modal;
  }

  /**
   * Share story via Telegram
   */
  async shareStory(share, template) {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    try {
      // Generate share text
      const text = this.generateShareText(share, template);
      
      // In a real scenario, you would:
      // 1. Generate an image with generate_share_card
      // 2. Share via Telegram WebApp
      // 3. Track the share

      // For now, copy to clipboard and show instruction
      navigator.clipboard.writeText(text);
      
      tg.showPopup({
        title: '✨ Story-Link bereit!',
        message: 'Link wurde kopiert. Du kannst ihn jetzt in einer Story teilen oder an Freunde schreiben.',
        buttons: [
          {
            id: 'ok',
            type: 'ok',
            text: 'Verstanden!'
          }
        ]
      });

      // Track share
      this.trackShare(share.share_id);

    } catch (error) {
      console.error('Share story error:', error);
    }
  }

  /**
   * Generate share text
   */
  generateShareText(share, template) {
    const templates = {
      'group_bot': '✨ Ich nutze Emerald um meine Gruppe zu automatisieren! Schau dir das an: ',
      'stats': '📊 Schau dir meine Gruppen-Statistiken an mit Emerald: ',
      'content': '📝 Mit Emerald Content kann ich automatische Posts erstellen: ',
      'emrd_rewards': '💎 Ich verdiene EMRD Rewards mit Emerald: ',
      'affiliate': '🔥 Meine Gruppe wird mit Emerald gemanagt - probier es aus: '
    };

    const baseText = templates[template] || 'Schau dir Emerald an: ';
    return baseText + share.referral_link;
  }

  /**
   * Track story share
   */
  async trackShare(shareId) {
    try {
      const tg = window.Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;

      await fetch(`${this.apiBase}/stories/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          share_id: shareId,
          visitor_id: user?.id || 0,
          source: 'shared'
        })
      });
    } catch (error) {
      console.error('Track share error:', error);
    }
  }

  /**
   * Load user's story shares
   */
  async loadUserShares(userId, limit = 5) {
    try {
      const response = await fetch(
        `${this.apiBase}/stories/user/${userId}?limit=${limit}`
      );
      const data = await response.json();
      return data.success ? data.shares : [];
    } catch (error) {
      console.error('Load user shares error:', error);
      return [];
    }
  }

  /**
   * Load top stories
   */
  async loadTopStories(days = 7, limit = 10) {
    try {
      const response = await fetch(
        `${this.apiBase}/stories/top?days=${days}&limit=${limit}`
      );
      const data = await response.json();
      return data.success ? data.shares : [];
    } catch (error) {
      console.error('Load top stories error:', error);
      return [];
    }
  }

  /**
   * Display story stats
   */
  async showStoryStats(shareId) {
    try {
      const response = await fetch(`${this.apiBase}/stories/stats/${shareId}`);
      const data = await response.json();
      
      if (data.success) {
        const stats = data.stats;
        return {
          clicks: stats.clicks,
          conversions: stats.conversions,
          conversionRate: stats.conversion_rate.toFixed(1),
          sharedAt: new Date(stats.shared_at).toLocaleDateString('de-DE')
        };
      }
    } catch (error) {
      console.error('Get stats error:', error);
    }
    return null;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  const storySharing = new StorySharing('/api');
  await storySharing.init();
  window.storySharing = storySharing; // Make available globally
});

export default StorySharing;
