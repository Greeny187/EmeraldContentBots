/**
 * Emerald DAO Mini App - JavaScript
 * Vollständige API-Integration mit Telegram WebApp und Blockchain
 */

// ============================================================================
// KONFIGURATION
// ============================================================================

const CONFIG = {
    apiBaseUrl: typeof window.location !== 'undefined' ? 
        window.location.origin.replace(/:\d+$/, ':8000') : 
        'http://localhost:8000',
    apiPrefix: '/api/dao',
    updateInterval: 30000, // 30 Sekunden
    contractAddress: process.env.DAO_CONTRACT || '',
    jettonMasterAddress: process.env.EMRD_TOKEN || ''
};

// Initialize Telegram WebApp
let WebApp = null;
let tgUser = null;

if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    WebApp = Telegram.WebApp;
    WebApp.ready();
    tgUser = WebApp.initDataUnsafe?.user || null;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
    currentUser: tgUser?.id || localStorage.getItem('dao_user_id') || null,
    proposals: [],
    treasury: {
        balance: 0,
        transactions: []
    },
    votingPower: {
        total: 0,
        emrdBalance: 0,
        delegated: 0,
        received: 0
    },
    delegations: [],
    userVotes: new Map(),
    isLoading: false
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatNumber(num) {
    if (!num) return '0';
    return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(num);
}

function showError(message) {
    const container = document.querySelector('[id*="Message"]') || document.body;
    const errorEl = document.createElement('div');
    errorEl.className = 'error';
    errorEl.textContent = '❌ ' + message;
    container.insertBefore(errorEl, container.firstChild);
    setTimeout(() => errorEl.remove(), 5000);
    console.error('Error:', message);
}

function showSuccess(message) {
    const container = document.querySelector('[id*="Message"]') || document.body;
    const successEl = document.createElement('div');
    successEl.className = 'success';
    successEl.textContent = '✅ ' + message;
    container.insertBefore(successEl, container.firstChild);
    setTimeout(() => successEl.remove(), 3000);
    console.log('Success:', message);
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function apiCall(endpoint, method = 'POST', data = {}) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const url = `${CONFIG.apiBaseUrl}${CONFIG.apiPrefix}${endpoint}`;
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        showError(error.message || 'API Fehler');
        return null;
    }
}

// ============================================================================
// DATA LOADING FUNCTIONS
// ============================================================================

async function loadProposals() {
    state.isLoading = true;
    const result = await apiCall('/proposals', 'POST', {});
    
    if (result?.proposals) {
        state.proposals = result.proposals;
        renderProposals();
    }
    state.isLoading = false;
}

async function loadVotingPower() {
    if (!state.currentUser) return;

    const result = await apiCall('/voting-power', 'POST', {
        user_id: state.currentUser
    });

    if (result?.details) {
        state.votingPower = {
            total: result.details.total_power || 0,
            emrdBalance: result.details.emrd_balance || 0,
            delegated: result.details.delegated_power || 0,
            received: result.details.received_delegations || 0
        };
        renderVotingPower();
    } else if (result?.voting_power !== undefined) {
        state.votingPower.total = result.voting_power;
        renderVotingPower();
    }
}

async function loadTreasury() {
    const balanceResult = await apiCall('/treasury/balance', 'POST', {});
    const txResult = await apiCall('/treasury/transactions', 'POST', { limit: 10 });

    if (balanceResult?.balance !== undefined) {
        state.treasury.balance = balanceResult.balance;
    }
    
    if (txResult?.transactions) {
        state.treasury.transactions = txResult.transactions;
    }

    renderTreasury();
}

async function loadDelegations() {
    if (!state.currentUser) return;

    const result = await apiCall('/delegations', 'POST', {
        user_id: state.currentUser
    });

    if (result?.delegations) {
        state.delegations = result.delegations;
        renderDelegations();
    }
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function renderVotingPower() {
    const powerEl = document.getElementById('votingPower');
    const detailsEl = document.getElementById('votingDetails');
    const balanceEl = document.getElementById('vpBalance');
    const delegatedEl = document.getElementById('vpDelegated');
    const receivedEl = document.getElementById('vpReceived');

    if (powerEl) {
        const power = Math.floor(state.votingPower.total);
        powerEl.textContent = `${formatNumber(power)} EMRD`;
    }

    if (balanceEl) {
        balanceEl.textContent = `${formatNumber(state.votingPower.emrdBalance)} EMRD`;
    }
    if (delegatedEl) {
        delegatedEl.textContent = `${formatNumber(state.votingPower.delegated)}`;
    }
    if (receivedEl) {
        receivedEl.textContent = `${formatNumber(state.votingPower.received)}`;
    }

    if (detailsEl && state.votingPower.received > 0) {
        detailsEl.style.display = 'flex';
    }
}

function renderProposals() {
    const container = document.getElementById('proposalsList');
    const spinner = document.getElementById('proposalsSpinner');

    if (!container) return;

    if (state.proposals.length === 0) {
        container.innerHTML = '<div class="loading">Keine aktiven Proposals vorhanden.</div>';
        if (spinner) spinner.parentElement.remove();
        return;
    }

    container.innerHTML = state.proposals.map(prop => `
        <div class="proposal-item">
            <div class="proposal-header">
                <div>
                    <div class="proposal-title">${escapeHtml(prop.title)}</div>
                    <span class="proposal-status status-${prop.status}">
                        ${prop.status === 'active' ? '🟢 Aktiv' : '🔴 Geschlossen'}
                    </span>
                </div>
            </div>
            
            <div class="proposal-desc">${escapeHtml(prop.description || '')}</div>
            
            <div class="proposal-meta">
                <span>📊 Typ: <strong>${translateProposalType(prop.type)}</strong></span>
                <span>🗳️ Votes: <strong>${prop.votes || 0}</strong></span>
            </div>

            ${prop.stats ? `
                <div class="vote-progress">
                    <div class="vote-for" style="flex: ${prop.stats.percentage_for / 100};"></div>
                    <div class="vote-against" style="flex: ${prop.stats.percentage_against / 100};"></div>
                </div>
                
                <div class="vote-stats">
                    <div class="vote-stat">
                        <div style="font-size: 11px;">JA</div>
                        <div class="vote-stat-value">${formatNumber(prop.stats.votes_for)}</div>
                        <div style="font-size: 11px; opacity: 0.7;">${prop.stats.percentage_for.toFixed(1)}%</div>
                    </div>
                    <div class="vote-stat">
                        <div style="font-size: 11px;">NEIN</div>
                        <div class="vote-stat-value">${formatNumber(prop.stats.votes_against)}</div>
                        <div style="font-size: 11px; opacity: 0.7;">${prop.stats.percentage_against.toFixed(1)}%</div>
                    </div>
                    <div class="vote-stat">
                        <div style="font-size: 11px;">Voters</div>
                        <div class="vote-stat-value">${prop.stats.total_voters || 0}</div>
                        <div style="font-size: 11px; opacity: 0.7;">Teilnehmer</div>
                    </div>
                </div>
            ` : ''}

            ${prop.status === 'active' ? `
                <div class="vote-bar">
                    <button class="vote-option for" onclick="castVote('${prop.id}', 'for')">
                        👍 JA ABSTIMMEN
                    </button>
                    <button class="vote-option against" onclick="castVote('${prop.id}', 'against')">
                        👎 NEIN ABSTIMMEN
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');

    if (spinner) spinner.parentElement.remove();
}

function renderTreasury() {
    const balanceEl = document.getElementById('treasuryBalance');
    const listEl = document.getElementById('transactionsList');

    if (balanceEl) {
        balanceEl.textContent = `${formatNumber(state.treasury.balance)} EMRD`;
    }

    if (listEl) {
        if (state.treasury.transactions.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine Transaktionen</div>';
            return;
        }

        listEl.innerHTML = `
            <div style="margin-bottom: 12px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--emerald-primary);">
                    📋 Letzte Transaktionen
                </div>
                ${state.treasury.transactions.map(tx => `
                    <div style="padding: 12px; background: rgba(0, 208, 132, 0.05); border: 1px solid rgba(0, 208, 132, 0.3); border-radius: 8px; margin-bottom: 8px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span>
                                ${tx.type === 'deposit' ? '➕' : '➖'} 
                                ${tx.type === 'deposit' ? 'Einzahlung' : 'Auszahlung'}
                            </span>
                            <span style="font-weight: 700; color: var(--emerald-primary);">
                                ${tx.type === 'deposit' ? '+' : '-'}${formatNumber(tx.amount)} EMRD
                            </span>
                        </div>
                        <div style="opacity: 0.7; font-size: 12px;">
                            ${tx.destination || 'Treasury'}
                        </div>
                        <div style="opacity: 0.5; font-size: 11px; margin-top: 4px;">
                            ${new Date(tx.created_at).toLocaleString('de-DE')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function renderDelegations() {
    const listEl = document.getElementById('delegationsList');
    
    if (!listEl) return;

    if (state.delegations.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Keine aktiven Delegationen</div>';
        return;
    }

    listEl.innerHTML = `
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--emerald-primary);">
            🤝 Deine Delegationen
        </div>
        <div class="delegations-list">
            ${state.delegations.map(del => `
                <div class="delegation-item">
                    <div class="delegation-info">
                        <div>${del.delegator_id === state.currentUser ? '➡️ An' : '⬅️ Von'} User #${del.delegator_id === state.currentUser ? del.delegate_id : del.delegator_id}</div>
                        <div style="font-size: 12px; opacity: 0.7;">
                            ${new Date(del.created_at).toLocaleDateString('de-DE')}
                        </div>
                    </div>
                    <div class="delegation-power">${formatNumber(del.voting_power)}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================================
// ACTION FUNCTIONS
// ============================================================================

async function castVote(proposalId, voteType) {
    if (!state.currentUser) {
        showError('Bitte authentifiziere dich zuerst');
        return;
    }

    if (state.votingPower.total < 100) {
        showError('Du benötigst mindestens 100 EMRD zum Abstimmen');
        return;
    }

    const result = await apiCall('/vote', 'POST', {
        proposal_id: proposalId,
        voter_id: state.currentUser,
        vote_type: voteType
    });

    if (result?.success) {
        showSuccess('Deine Stimme wurde registriert! 🎉');
        state.userVotes.set(proposalId, voteType);
        await loadProposals();
    }
}

async function createProposal() {
    if (!state.currentUser) {
        showError('Bitte authentifiziere dich zuerst');
        return;
    }

    const title = document.getElementById('proposalTitle')?.value?.trim();
    const description = document.getElementById('proposalDesc')?.value?.trim();
    const type = document.getElementById('proposalType')?.value;

    if (!title || !description) {
        showError('Bitte fülle alle Felder aus');
        return;
    }

    const result = await apiCall('/proposal/create', 'POST', {
        proposer_id: state.currentUser,
        title,
        description,
        type
    });

    if (result?.success) {
        showSuccess('Proposal erstellt! 🎊');
        document.getElementById('proposalTitle').value = '';
        document.getElementById('proposalDesc').value = '';
        document.getElementById('proposalType').value = 'governance';
        await loadProposals();
        
        // Switch to proposals tab
        switchTab('proposals');
    }
}

async function delegateVotingPower() {
    if (!state.currentUser) {
        showError('Bitte authentifiziere dich zuerst');
        return;
    }

    const delegateId = parseInt(document.getElementById('delegateId')?.value);
    const amount = parseFloat(document.getElementById('delegateAmount')?.value);

    if (!delegateId || !amount || amount <= 0) {
        showError('Bitte gib gültige Werte ein');
        return;
    }

    if (delegateId === state.currentUser) {
        showError('Du kannst deine Voting Power nicht an dich selbst delegieren');
        return;
    }

    const result = await apiCall('/delegate', 'POST', {
        delegator_id: state.currentUser,
        delegate_id: delegateId,
        voting_power: amount
    });

    if (result?.success) {
        showSuccess('Delegation erfolgreich! 🤝');
        document.getElementById('delegateId').value = '';
        document.getElementById('delegateAmount').value = '';
        await loadDelegations();
        await loadVotingPower();
    }
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const tabEl = document.getElementById(tabName);
    if (tabEl) {
        tabEl.classList.add('active');
        tabEl.style.display = 'block';
    }

    // Mark button as active
    const btnEl = document.querySelector(`[data-tab="${tabName}"]`);
    if (btnEl) {
        btnEl.classList.add('active');
    }

    // Load data for tab
    if (tabName === 'proposals') {
        loadProposals();
    } else if (tabName === 'delegate') {
        loadDelegations();
    } else if (tabName === 'treasury') {
        loadTreasury();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function translateProposalType(type) {
    const types = {
        'governance': '🏛️ Governance',
        'treasury': '💰 Treasury Spend',
        'parameter': '🔄 Parameter Change',
        'analytics': '📊 Analytics'
    };
    return types[type] || type;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    // Store user ID
    if (tgUser?.id) {
        state.currentUser = tgUser.id;
        localStorage.setItem('dao_user_id', tgUser.id);
    }

    // Setup tab switches
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Initial load
    loadVotingPower();
    loadProposals();
    loadTreasury();

    // Setup auto-refresh
    setInterval(() => {
        loadVotingPower();
        loadProposals();
        loadTreasury();
    }, CONFIG.updateInterval);

    console.log('✅ DAO Mini App initialized', { user: state.currentUser });
}

// Start on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { state, apiCall, formatNumber };
}
