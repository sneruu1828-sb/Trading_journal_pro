// Trading Journal Pro - Enhanced Sync-Enabled Application

// Global configuration
const AppConfig = {
  serverUrl: 'http://localhost:3001',
  authToken: 'demo-user-token',
  syncInterval: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  version: '1.0.0'
};

// Application state
let AppState = {
  strategies: [],
  trades: [],
  currentAccount: 'demo',
  currentDate: new Date(),
  charts: {},
  syncState: {
    lastSyncToken: null,
    lastSyncTime: null,
    status: 'idle',
    deviceId: 'device-' + Math.random().toString(36).substr(2, 9),
    pendingChanges: 0,
    isOnline: navigator.onLine
  },
  isInitialized: false,
  syncQueue: [],
  searchQuery: '',
  filters: {
    strategy: '',
    symbol: '',
    status: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
};

// UUID generator
function generateUUID() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Symbol autocomplete data
const SYMBOLS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURGBP', 'EURJPY', 'GBPJPY', 'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD',
  'SPY', 'QQQ', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META'
];

// Initialize application with sample data
function initializeData() {
  const sampleStrategies = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Momentum Breakout",
      description: "Trading breakouts above resistance with volume confirmation",
      category: "Momentum",
      rules: "Entry: Price breaks above resistance with volume > 1.5x average. Stop: Below breakout level. Target: 2:1 R/R ratio",
      defaultRisk: 2,
      winRate: 65,
      avgProfit: 150,
      avgLoss: -75,
      totalTrades: 45,
      createdAt: "2024-09-01T10:00:00.000Z",
      updatedAt: "2024-09-15T14:30:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Mean Reversion",
      description: "Buying oversold levels and selling overbought conditions",
      category: "Mean Reversion",
      rules: "Entry: RSI < 30 at support level. Stop: Below support. Target: Middle of range or resistance",
      defaultRisk: 1.5,
      winRate: 72,
      avgProfit: 120,
      avgLoss: -60,
      totalTrades: 38,
      createdAt: "2024-09-02T11:15:00.000Z",
      updatedAt: "2024-09-16T09:45:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    }
  ];

  const sampleTrades = [
    {
      id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      strategyId: "550e8400-e29b-41d4-a716-446655440001",
      symbol: "EURUSD",
      accountType: "real",
      direction: "long",
      quantity: 1.5,
      entryPrice: 1.0850,
      exitPrice: 1.0920,
      entryDate: "2024-09-15",
      entryTime: "09:30",
      exitDate: "2024-09-15",
      exitTime: "11:45",
      stopLoss: 1.0820,
      takeProfit: 1.0920,
      status: "closed",
      pnl: 105,
      netPnl: 100,
      notes: "Clean breakout above 1.0840 resistance with strong volume.",
      tags: ["breakout", "volume-confirmation"],
      commission: 5,
      createdAt: "2024-09-15T09:30:00.000Z",
      updatedAt: "2024-09-15T11:45:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    }
  ];

  AppState.strategies = sampleStrategies;
  AppState.trades = sampleTrades;
  saveDataLocally();
  loadAppSettings();
  addSyncLogEntry('Data initialized with sample data', 'info');
}

// Local storage functions
function saveDataLocally() {
  try {
    localStorage.setItem('tradingJournal_strategies', JSON.stringify(AppState.strategies));
    localStorage.setItem('tradingJournal_trades', JSON.stringify(AppState.trades));
    localStorage.setItem('tradingJournal_syncState', JSON.stringify(AppState.syncState));
    localStorage.setItem('tradingJournal_lastUpdate', new Date().toISOString());
  } catch (error) {
    console.error('Failed to save data locally:', error);
    showToast('Failed to save data locally', 'error');
  }
}

function loadDataLocally() {
  try {
    const strategies = localStorage.getItem('tradingJournal_strategies');
    const trades = localStorage.getItem('tradingJournal_trades');
    const syncState = localStorage.getItem('tradingJournal_syncState');

    if (strategies) AppState.strategies = JSON.parse(strategies);
    if (trades) AppState.trades = JSON.parse(trades);
    if (syncState) AppState.syncState = { ...AppState.syncState, ...JSON.parse(syncState) };
    return true;
  } catch (error) {
    console.error('Failed to load data locally:', error);
    return false;
  }
}

function loadAppSettings() {
  try {
    const settings = localStorage.getItem('tradingJournal_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      AppState.currentAccount = parsed.defaultAccount || 'demo';
      AppConfig.serverUrl = parsed.serverUrl || AppConfig.serverUrl;
      AppConfig.authToken = parsed.authToken || AppConfig.authToken;
      AppConfig.syncInterval = parsed.syncInterval || AppConfig.syncInterval;
    }
  } catch (error) {
    console.error('Failed to load app settings:', error);
  }
}

function saveAppSettings() {
  try {
    const settings = {
      defaultAccount: AppState.currentAccount,
      serverUrl: AppConfig.serverUrl,
      authToken: AppConfig.authToken,
      syncInterval: AppConfig.syncInterval,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem('tradingJournal_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save app settings:', error);
  }
}

// REAL SYNC IMPLEMENTATION - Replace placeholder with actual API calls
async function syncData() {
  if (!AppState.syncState.isOnline) return;

  try {
    AppState.syncState.status = 'syncing';
    updateSyncStatus();

    // 1. Send local changes to backend if any exist
    if (AppState.syncQueue.length > 0) {
      const changesPayload = AppState.syncQueue.map(item => ({
        action: item.action,
        type: item.type,
        data: item.data,
        idempotencyKey: item.idempotencyKey,
        timestamp: item.timestamp
      }));

      const response = await fetch(`${AppConfig.serverUrl}/sync/changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AppConfig.authToken}`
        },
        body: JSON.stringify({ changes: changesPayload })
      });

      if (!response.ok) {
        throw new Error(`Failed to send changes to server: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Changes sent to server:', result);

      // Clear local queue if successful
      AppState.syncQueue = [];
      AppState.syncState.pendingChanges = 0;
      addSyncLogEntry('Sent local changes to server', 'info');
    }

    // 2. Fetch changes from backend since last sync token
    const sinceToken = AppState.syncState.lastSyncToken || 0;
    const getResp = await fetch(`${AppConfig.serverUrl}/sync/changes?since=${sinceToken}`, {
      headers: {
        'Authorization': `Bearer ${AppConfig.authToken}`
      }
    });

    if (!getResp.ok) {
      throw new Error(`Failed to fetch updates from server: ${getResp.statusText}`);
    }

    const serverData = await getResp.json();
    console.log('Received from server:', serverData);

    // 3. Merge changes from server into local app state
    if (serverData.changes && serverData.changes.length > 0) {
      mergeServerChanges(serverData.changes);
      addSyncLogEntry(`Merged ${serverData.changes.length} changes from server`, 'info');
    }

    // Update sync metadata
    AppState.syncState.lastSyncToken = serverData.newSyncToken;
    AppState.syncState.lastSyncTime = new Date().toISOString();

    // Mark all local data as clean after successful sync
    AppState.trades.forEach(trade => trade.isDirty = false);
    AppState.strategies.forEach(strategy => strategy.isDirty = false);

    saveDataLocally();
    addSyncLogEntry(`Synced with server at ${AppState.syncState.lastSyncTime}`, 'success');

    AppState.syncState.status = 'idle';
    updateSyncStatus();

  } catch (error) {
    console.error('Sync failed:', error);
    AppState.syncState.status = 'error';
    updateSyncStatus();
    addSyncLogEntry(`Sync error: ${error.message}`, 'error');
    throw error;
  }
}

// Merge server changes into local state
function mergeServerChanges(changes) {
  if (!Array.isArray(changes)) return;

  let tradesChanged = false;
  let strategiesChanged = false;

  changes.forEach(change => {
    const { type, action, data } = change;

    if (type === 'trade') {
      const index = AppState.trades.findIndex(t => t.id === data.id);
      if (action === 'add') {
        if (index === -1) {
          AppState.trades.push(data);
          tradesChanged = true;
        }
      } else if (action === 'update') {
        if (index !== -1) {
          AppState.trades[index] = { ...AppState.trades[index], ...data };
          tradesChanged = true;
        }
      } else if (action === 'delete') {
        if (index !== -1) {
          AppState.trades.splice(index, 1);
          tradesChanged = true;
        }
      }
    } else if (type === 'strategy') {
      const index = AppState.strategies.findIndex(s => s.id === data.id);
      if (action === 'add') {
        if (index === -1) {
          AppState.strategies.push(data);
          strategiesChanged = true;
        }
      } else if (action === 'update') {
        if (index !== -1) {
          AppState.strategies[index] = { ...AppState.strategies[index], ...data };
          strategiesChanged = true;
        }
      } else if (action === 'delete') {
        if (index !== -1) {
          AppState.strategies.splice(index, 1);
          strategiesChanged = true;
        }
      }
    }
  });

  // Refresh UI if data changed
  if (tradesChanged || strategiesChanged) {
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
      showSection(activeSection.id);
    }
  }
}

// Add item to sync queue when data changes locally
function addToSyncQueue(action, type, data) {
  const syncItem = {
    id: generateUUID(),
    action,
    type,
    data: { ...data },
    timestamp: new Date().toISOString(),
    idempotencyKey: generateUUID()
  };

  AppState.syncQueue.push(syncItem);
  AppState.syncState.pendingChanges = AppState.syncQueue.length;
  updateSyncStatus();
  saveDataLocally();

  console.log('Added to sync queue:', syncItem);
}

// Modified trade and strategy functions to use sync queue
function addTrade(tradeData) {
  const newTrade = {
    id: generateUUID(),
    ...tradeData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deviceId: AppState.syncState.deviceId,
    isDirty: true
  };

  AppState.trades.push(newTrade);
  addToSyncQueue('add', 'trade', newTrade);
  saveDataLocally();
  
  return newTrade;
}

function updateTrade(tradeId, updates) {
  const tradeIndex = AppState.trades.findIndex(t => t.id === tradeId);
  if (tradeIndex === -1) return null;

  const updatedTrade = {
    ...AppState.trades[tradeIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
    isDirty: true
  };

  AppState.trades[tradeIndex] = updatedTrade;
  addToSyncQueue('update', 'trade', updatedTrade);
  saveDataLocally();
  
  return updatedTrade;
}

function deleteTrade(tradeId) {
  const tradeIndex = AppState.trades.findIndex(t => t.id === tradeId);
  if (tradeIndex === -1) return false;

  const tradeToDelete = AppState.trades[tradeIndex];
  AppState.trades.splice(tradeIndex, 1);
  addToSyncQueue('delete', 'trade', { id: tradeId });
  saveDataLocally();
  
  return true;
}

// Sync and dashboard functions
function loadSyncDashboard() {
  updateSyncStatus();
  loadSyncSettings();
  loadSyncHistory();
}

function updateSyncStatus() {
  const statusText = AppState.syncState.isOnline ? 'Online' : 'Offline';
  const syncStatusText = AppState.syncState.status === 'syncing' ? 'Syncing...' : 
                        AppState.syncState.status === 'error' ? 'Error' : 'Idle';
  
  const statusElements = {
    'sync-status': syncStatusText,
    'sync-dashboard-status': statusText,
    'sync-dashboard-time': AppState.syncState.lastSyncTime ? 
      formatDateTime(new Date(AppState.syncState.lastSyncTime)) : 'Never',
    'last-sync': AppState.syncState.lastSyncTime ? 
      `Last sync: ${formatDateTime(new Date(AppState.syncState.lastSyncTime))}` : 'Last sync: Never',
    'pending-changes': AppState.syncQueue.length.toString(),
    'device-id': AppState.syncState.deviceId,
    'connection-text': statusText
  };
  
  Object.entries(statusElements).forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  });
  
  // Update connection dot
  const connectionDot = document.getElementById('connection-dot');
  if (connectionDot) {
    connectionDot.className = 'connection-dot';
    if (!AppState.syncState.isOnline) {
      connectionDot.classList.add('offline');
    } else if (AppState.syncState.status === 'syncing') {
      connectionDot.classList.add('syncing');
    }
  }
}

function loadSyncSettings() {
  const elements = {
    'server-url': AppConfig.serverUrl,
    'auth-token': AppConfig.authToken,
    'sync-interval': AppConfig.syncInterval / 1000
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  });
}

function loadSyncHistory() {
  const container = document.getElementById('sync-log');
  if (!container) return;
  
  const history = JSON.parse(localStorage.getItem('tradingJournal_syncHistory') || '[]');
  
  if (history.length === 0) {
    container.innerHTML = '<div class="text-center text-muted">No sync history</div>';
    return;
  }
  
  let html = '';
  history.slice(-10).reverse().forEach(entry => {
    html += `
      <div class="sync-log-entry">
        <span class="sync-log-time">${formatDateTime(new Date(entry.time))}</span>
        <span class="sync-log-message">${entry.message}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

async function forceSync() {
  if (!AppState.syncState.isOnline) {
    showToast('No internet connection', 'error');
    return;
  }
  
  showLoadingOverlay('Syncing data...');
  
  try {
    await syncData();
    showToast('Sync completed successfully!', 'success');
  } catch (error) {
    console.error('Manual sync failed:', error);
    showToast('Sync failed. Please try again.', 'error');
  } finally {
    hideLoadingOverlay();
  }
}

function addSyncLogEntry(message, type = 'info') {
  const history = JSON.parse(localStorage.getItem('tradingJournal_syncHistory') || '[]');
  history.push({
    time: new Date().toISOString(),
    message,
    type
  });
  
  // Keep only last 100 entries
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
  
  localStorage.setItem('tradingJournal_syncHistory', JSON.stringify(history));
}

function setupSyncConfigForm() {
  const form = document.getElementById('sync-config-form');
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    AppConfig.serverUrl = document.getElementById('server-url').value;
    AppConfig.authToken = document.getElementById('auth-token').value;
    AppConfig.syncInterval = parseInt(document.getElementById('sync-interval').value) * 1000;
    
    saveAppSettings();
    showToast('Sync configuration saved!', 'success');
    addSyncLogEntry('Sync configuration updated', 'info');
  });
}

// Auto sync setup
let autoSyncInterval;

function startAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
  }
  
  autoSyncInterval = setInterval(async () => {
    if (AppState.syncState.isOnline && AppState.syncState.status !== 'syncing') {
      try {
        await syncData();
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }
  }, AppConfig.syncInterval);
  
  console.log('Auto sync started with interval:', AppConfig.syncInterval);
}

function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    console.log('Auto sync stopped');
  }
}

// Utility functions
function formatDateTime(date) {
  return date.toLocaleString();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function showToast(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Add your toast notification UI implementation here
}

function showLoadingOverlay(message) {
  console.log('Loading:', message);
  // Add loading overlay UI implementation here
}

function hideLoadingOverlay() {
  console.log('Loading complete');
  // Hide loading overlay UI implementation here
}

// Online/offline detection
window.addEventListener('online', () => {
  AppState.syncState.isOnline = true;
  updateSyncStatus();
  addSyncLogEntry('Connection restored', 'info');
  startAutoSync();
});

window.addEventListener('offline', () => {
  AppState.syncState.isOnline = false;
  updateSyncStatus();
  addSyncLogEntry('Connection lost', 'warning');
  stopAutoSync();
});

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Trading Journal Pro...');
  
  // Load existing data or initialize with samples
  if (!loadDataLocally()) {
    initializeData();
  }
  
  // Setup sync configuration form
  setupSyncConfigForm();
  
  // Update online status
  AppState.syncState.isOnline = navigator.onLine;
  
  // Start auto sync
  if (AppState.syncState.isOnline) {
    startAutoSync();
  }
  
  AppState.isInitialized = true;
  console.log('Trading Journal Pro initialized successfully');
});
