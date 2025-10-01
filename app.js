// Trading Journal Pro - Enhanced Sync-Enabled Application with Persistent Server Configuration

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

// Save server configuration to localStorage
function saveServerConfig() {
  try {
    const serverUrl = document.querySelector('input[placeholder*="localhost:3001"], input[placeholder*="server"], .server-url-input')?.value?.trim();
    const authToken = document.querySelector('input[type="password"], .auth-token-input')?.value?.trim();
    const syncInterval = document.querySelector('input[type="number"], .sync-interval-input')?.value?.trim();

    const config = {
      serverUrl: serverUrl || AppConfig.serverUrl,
      authToken: authToken || AppConfig.authToken,
      syncInterval: syncInterval || '30'
    };

    localStorage.setItem('tradingJournalServerConfig', JSON.stringify(config));
    
    // Update global config
    AppConfig.serverUrl = config.serverUrl;
    AppConfig.authToken = config.authToken;
    AppConfig.syncInterval = parseInt(config.syncInterval) * 1000;

    showNotification('Server configuration saved successfully!', 'success');
    console.log('Server config saved:', config);
  } catch (error) {
    console.error('Failed to save server config:', error);
    showNotification('Failed to save configuration', 'error');
  }
}

// Load server configuration from localStorage
function loadServerConfig() {
  try {
    const configString = localStorage.getItem('tradingJournalServerConfig');
    if (!configString) return;

    const config = JSON.parse(configString);
    
    // Update form fields if they exist
    const serverUrlInput = document.querySelector('input[placeholder*="localhost:3001"], input[placeholder*="server"], .server-url-input');
    const authTokenInput = document.querySelector('input[type="password"], .auth-token-input');
    const syncIntervalInput = document.querySelector('input[type="number"], .sync-interval-input');

    if (serverUrlInput && config.serverUrl) {
      serverUrlInput.value = config.serverUrl;
    }
    if (authTokenInput && config.authToken) {
      authTokenInput.value = config.authToken;
    }
    if (syncIntervalInput && config.syncInterval) {
      syncIntervalInput.value = config.syncInterval;
    }

    // Update global config
    AppConfig.serverUrl = config.serverUrl || AppConfig.serverUrl;
    AppConfig.authToken = config.authToken || AppConfig.authToken;
    AppConfig.syncInterval = parseInt(config.syncInterval) * 1000 || AppConfig.syncInterval;

    console.log('Server config loaded:', config);
    showNotification('Server configuration loaded from storage', 'info');
  } catch (error) {
    console.error('Failed to load server config:', error);
  }
}

// Enhanced save config function that works with your HTML structure
function handleSaveConfiguration() {
  saveServerConfig();
  
  // Also trigger any existing save functionality
  if (typeof window.saveConfiguration === 'function') {
    window.saveConfiguration();
  }
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
      notes: "Clean breakout above 1.0840 resistance with strong volume.",
      tags: ["breakout", "volume-confirmation"],
      commission: 5,
      createdAt: "2024-09-15T09:30:00.000Z",
      updatedAt: "2024-09-15T11:45:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    }
  ];

  // Load from localStorage or use sample data
  const storedStrategies = localStorage.getItem('tradingJournalStrategies');
  const storedTrades = localStorage.getItem('tradingJournalTrades');

  AppState.strategies = storedStrategies ? JSON.parse(storedStrategies) : sampleStrategies;
  AppState.trades = storedTrades ? JSON.parse(storedTrades) : sampleTrades;

  console.log('Initialized with strategies:', AppState.strategies.length);
  console.log('Initialized with trades:', AppState.trades.length);
}

// Save data to localStorage
function saveToLocalStorage() {
  try {
    localStorage.setItem('tradingJournalStrategies', JSON.stringify(AppState.strategies));
    localStorage.setItem('tradingJournalTrades', JSON.stringify(AppState.trades));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Enhanced notification system with better UI integration
function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Try to find existing notification area first
  let notificationArea = document.querySelector('.notification-area, .toast-container');
  
  if (!notificationArea) {
    // Create toast notification element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ${type === 'success' ? 'background-color: #4CAF50;' : ''}
      ${type === 'error' ? 'background-color: #f44336;' : ''}
      ${type === 'info' ? 'background-color: #2196F3;' : ''}
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 100);
    
    // Hide and remove toast
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}

// Navigation handling
function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll('.content-section, [data-section]');
  sections.forEach(section => {
    if (section.style) {
      section.style.display = 'none';
    }
  });

  // Show selected section
  const targetSection = document.querySelector(`[data-section="${sectionName}"]`);
  if (targetSection) {
    targetSection.style.display = 'block';
  }

  // Update navigation buttons
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.querySelector(`.nav-btn[data-section="${sectionName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Load section-specific content
  switch (sectionName) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'add-trade':
      renderAddTradeForm();
      break;
    case 'strategies':
      renderStrategies();
      break;
    case 'history':
      renderTradeHistory();
      break;
    case 'sync':
      renderSyncPanel();
      break;
  }

  // Load server config when sync panel is shown
  if (sectionName === 'sync') {
    setTimeout(loadServerConfig, 100);
  }
}

// Render sync panel with server configuration
function renderSyncPanel() {
  const syncSection = document.querySelector('[data-section="sync"]');
  if (!syncSection) return;

  syncSection.innerHTML = `
    <div class="sync-panel">
      <h2>Sync Configuration</h2>
      
      <div class="sync-config">
        <h3>Server Configuration</h3>
        <div class="form-group">
          <label>Server URL</label>
          <input type="url" class="server-url-input" placeholder="https://trading-journal-pro-3gwm.onrender.com" required>
          <small>Enter your deployed server URL from Render.com</small>
        </div>
        
        <div class="form-group">
          <label>Auth Token</label>
          <input type="password" class="auth-token-input" placeholder="demo-user-token" required>
          <small>Authentication token for server access</small>
        </div>
        
        <div class="form-group">
          <label>Auto Sync Interval (seconds)</label>
          <input type="number" class="sync-interval-input" min="5" max="3600" placeholder="30" required>
          <small>How often to sync with server automatically</small>
        </div>
        
        <button class="save-config-btn btn-primary" onclick="handleSaveConfiguration()">Save Configuration</button>
      </div>
      
      <div class="sync-status">
        <h3>Sync Status</h3>
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span class="status-text">Idle</span>
        </div>
        <div class="last-sync">Last sync: Never</div>
        <button class="manual-sync-btn btn-secondary" onclick="triggerManualSync()">Manual Sync</button>
      </div>

      <div class="sync-instructions">
        <h3>Setup Instructions</h3>
        <ol>
          <li>Enter your Render.com server URL above</li>
          <li>Set auth token (use 'demo-user-token' for testing)</li>
          <li>Configure sync interval (30 seconds recommended)</li>
          <li>Click Save Configuration</li>
          <li>Settings will persist across browser sessions</li>
        </ol>
      </div>
    </div>
  `;
}

// Manual sync trigger function
function triggerManualSync() {
  showNotification('Manual sync triggered - connecting to server...', 'info');
  console.log('Manual sync with server:', AppConfig.serverUrl);
  // Add actual sync logic here when implemented
}

// Enhanced app initialization
function initializeApp() {
  console.log('Initializing Trading Journal Pro...');
  
  // Load server configuration first (before any UI setup)
  loadServerConfig();
  
  // Initialize data
  initializeData();
  
  // Set up navigation
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const section = btn.getAttribute('data-section');
      if (section) {
        showSection(section);
      }
    });
  });

  // Set up save configuration button with multiple selectors
  function setupSaveButton() {
    const saveButtons = document.querySelectorAll('button[onclick*="save"], .save-config-btn, button:contains("Save Configuration")');
    saveButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleSaveConfiguration();
      });
    });
  }

  // Try to setup save button now and after DOM changes
  setupSaveButton();
  
  // Also setup on mutation observer for dynamically added buttons
  const observer = new MutationObserver(() => {
    setupSaveButton();
    // Re-load config when sync panel appears
    if (document.querySelector('[data-section="sync"]') && document.querySelector('[data-section="sync"]').style.display !== 'none') {
      setTimeout(loadServerConfig, 100);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Show default section (dashboard)
  showSection('dashboard');
  
  AppState.isInitialized = true;
  showNotification('Trading Journal Pro initialized successfully', 'success');
  
  // Load config one more time after everything is setup
  setTimeout(loadServerConfig, 500);
}

// Render dashboard (simplified version)
function renderDashboard() {
  const dashboardSection = document.querySelector('[data-section="dashboard"]');
  if (!dashboardSection) return;

  const totalTrades = AppState.trades.length;
  const openTrades = AppState.trades.filter(t => t.status === 'open').length;
  const totalStrategies = AppState.strategies.length;

  dashboardSection.innerHTML = `
    <div class="dashboard">
      <h2>Trading Dashboard</h2>
      <div class="stats-overview">
        <div class="stat-item">Total Trades: ${totalTrades}</div>
        <div class="stat-item">Open Trades: ${openTrades}</div>
        <div class="stat-item">Strategies: ${totalStrategies}</div>
      </div>
    </div>
  `;
}

// Placeholder functions for other sections
function renderAddTradeForm() {
  const section = document.querySelector('[data-section="add-trade"]');
  if (section) {
    section.innerHTML = '<h2>Add Trade Form</h2><p>Trade form implementation...</p>';
  }
}

function renderStrategies() {
  const section = document.querySelector('[data-section="strategies"]');
  if (section) {
    section.innerHTML = '<h2>Strategies</h2><p>Strategies list implementation...</p>';
  }
}

function renderTradeHistory() {
  const section = document.querySelector('[data-section="history"]');
  if (section) {
    section.innerHTML = '<h2>Trade History</h2><p>Trade history implementation...</p>';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Also try to initialize after a short delay in case DOM isn't fully ready
setTimeout(() => {
  if (!AppState.isInitialized) {
    initializeApp();
  }
}, 1000);

// Global function for onclick handlers in HTML
window.handleSaveConfiguration = handleSaveConfiguration;
window.triggerManualSync = triggerManualSync;
window.showSection = showSection;
