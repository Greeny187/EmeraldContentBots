/**
 * Emerald DevDashboard Configuration
 * Kopiere diese Datei zu: frontend/js/config.js
 */

const DASHBOARD_CONFIG = {
  // API Endpoints
  api: {
    base: process.env.API_BASE || '/api',
    timeout: 10000, // ms
  },

  // Authentication
  auth: {
    tokenKey: 'auth_token',
    refreshInterval: 3600000, // 1 hour
  },

  // Telegram
  telegram: {
    botUsername: 'your_bot_username',
    loginUrl: 'https://telegram.org/js/telegram-widget.js?22',
  },

  // EMRD Token
  token: {
    name: 'Emerald Token',
    symbol: 'EMRD',
    decimals: 9,
    tonContract: 'EQDkjqMPPCLYN2xUQp_mWMFt3zPxUgcLIEMCDe-RDHfx2Gsp',
    links: {
      dedust: 'https://dedust.io/swap/TON/EQDkjqMPPCLYN2xUQp_mWMFt3zPxUgcLIEMCDe-RDHfx2Gsp',
      tonviewer: 'https://tonviewer.com/EQDkjqMPPCLYN2xUQp_mWMFt3zPxUgcLIEMCDe-RDHfx2Gsp',
      tonscan: 'https://tonscan.org/address/EQDkjqMPPCLYN2xUQp_mWMFt3zPxUgcLIEMCDe-RDHfx2Gsp',
    }
  },

  // NEAR Protocol
  near: {
    rpc: 'https://rpc.mainnet.near.org',
    mainAccount: 'emeraldcontent.near',
    explorerUrl: 'https://explorer.near.org',
  },

  // TON Blockchain
  ton: {
    network: 'mainnet',
    endpoint: 'https://toncenter.com/api/v2/',
    explorerUrl: 'https://tonscan.org',
  },

  // UI Settings
  ui: {
    theme: localStorage.getItem('dashboard_theme') || 'dark',
    refreshInterval: parseInt(localStorage.getItem('refresh_interval') || '30') * 1000,
    itemsPerPage: 50,
    animationsEnabled: true,
  },

  // Feature Flags
  features: {
    showBotStats: true,
    showTokenTracking: true,
    showModeration: true,
    showPayments: true,
    showAnalytics: true,
    allowUserManagement: true,
    allowBotCreation: true,
    allowAdCreation: true,
  },

  // Roles & Permissions
  roles: {
    owner: {
      level: 100,
      permissions: ['*'] // All permissions
    },
    admin: {
      level: 50,
      permissions: ['manage_bots', 'manage_ads', 'manage_users', 'view_analytics', 'manage_flags']
    },
    dev: {
      level: 10,
      permissions: ['view_analytics', 'manage_bots']
    },
    user: {
      level: 1,
      permissions: ['view_dashboard']
    }
  },

  // API Cache Settings
  cache: {
    enabled: true,
    duration: 300000, // 5 minutes
    keys: {
      userProfile: 'cache_profile',
      overview: 'cache_overview',
      bots: 'cache_bots',
      statistics: 'cache_stats',
    }
  },

  // Translations (i18n)
  translations: {
    de: {
      'nav.overview': '📊 Overview',
      'nav.bots': '🤖 Bots',
      'nav.statistics': '📈 Statistiken',
      'nav.wallets': '💰 Wallets',
      'nav.users': '👥 Users',
      'nav.ads': '📢 Ads',
      'nav.flags': '🚩 Feature Flags',
      'nav.settings': '⚙️ Einstellungen',
      'stat.users': 'Benutzer',
      'stat.bots': 'Bots',
      'stat.ads': 'Ads',
      'stat.events': 'Token Events',
      'btn.add': '➕ Hinzufügen',
      'btn.save': '💾 Speichern',
      'btn.delete': '🗑️ Löschen',
      'btn.refresh': '🔄 Aktualisieren',
    },
    en: {
      'nav.overview': '📊 Overview',
      'nav.bots': '🤖 Bots',
      'nav.statistics': '📈 Statistics',
      'nav.wallets': '💰 Wallets',
      'nav.users': '👥 Users',
      'nav.ads': '📢 Ads',
      'nav.flags': '🚩 Feature Flags',
      'nav.settings': '⚙️ Settings',
      'stat.users': 'Users',
      'stat.bots': 'Bots',
      'stat.ads': 'Ads',
      'stat.events': 'Token Events',
      'btn.add': '➕ Add',
      'btn.save': '💾 Save',
      'btn.delete': '🗑️ Delete',
      'btn.refresh': '🔄 Refresh',
    }
  },

  // Notifications
  notifications: {
    enabled: true,
    position: 'top-right',
    duration: 3000,
  },

  // Analytics & Tracking
  analytics: {
    enabled: false, // Set to true for Google Analytics
    trackPageViews: true,
    trackEvents: true,
  },

  // Development Settings
  debug: {
    enabled: false,
    logApiCalls: false,
    logErrors: true,
    verboseLogging: false,
  }
};

// Export für Node/ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DASHBOARD_CONFIG;
}

// Global variable
window.__DASHBOARD_CONFIG__ = DASHBOARD_CONFIG;
