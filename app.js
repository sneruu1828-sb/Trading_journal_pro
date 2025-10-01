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
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "Swing Trading",
      description: "Multi-day position trading with trend following",
      category: "Swing",
      rules: "Entry: Pullback to 20 EMA in trending market. Stop: Below swing low. Target: Previous high or measured move",
      defaultRisk: 3,
      winRate: 58,
      avgProfit: 280,
      avgLoss: -140,
      totalTrades: 22,
      createdAt: "2024-09-03T16:20:00.000Z",
      updatedAt: "2024-09-17T13:10:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "Scalping 1M",
      description: "Quick scalping on 1-minute timeframe",
      category: "Scalping",
      rules: "Entry: Price action confirmation at key levels. Stop: 10 pips. Target: 15-20 pips",
      defaultRisk: 1,
      winRate: 68,
      avgProfit: 45,
      avgLoss: -25,
      totalTrades: 89,
      createdAt: "2024-09-04T08:30:00.000Z",
      updatedAt: "2024-09-18T11:25:00.000Z",
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
      notes: "Clean breakout above 1.0840 resistance with strong volume. Held position for 2.5 hours.",
      tags: ["breakout", "volume-confirmation"],
      commission: 5,
      createdAt: "2024-09-15T09:30:00.000Z",
      updatedAt: "2024-09-15T11:45:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    },
    {
      id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      strategyId: "550e8400-e29b-41d4-a716-446655440002",
      symbol: "XAUUSD",
      accountType: "demo",
      direction: "long",
      quantity: 0.1,
      entryPrice: 1950.50,
      exitPrice: 1965.80,
      entryDate: "2024-09-16",
      entryTime: "14:20",
      exitDate: "2024-09-16",
      exitTime: "16:35",
      stopLoss: 1940.00,
      takeProfit: 1970.00,
      status: "closed",
      pnl: 153,
      netPnl: 153,
      notes: "RSI was at 28, perfect mean reversion setup at support level.",
      tags: ["oversold", "support-level"],
      commission: 0,
      createdAt: "2024-09-16T14:20:00.000Z",
      updatedAt: "2024-09-16T16:35:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    },
    {
      id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
      strategyId: "550e8400-e29b-41d4-a716-446655440004",
      symbol: "GBPUSD",
      accountType: "real",
      direction: "short",
      quantity: 2.0,
      entryPrice: 1.2650,
      exitPrice: 1.2635,
      entryDate: "2024-09-17",
      entryTime: "08:15",
      exitDate: "2024-09-17",
      exitTime: "08:28",
      stopLoss: 1.2665,
      takeProfit: 1.2630,
      status: "closed",
      pnl: 30,
      netPnl: 27,
      notes: "Quick scalp at London open, price rejected at resistance cleanly.",
      tags: ["scalp", "london-open"],
      commission: 3,
      createdAt: "2024-09-17T08:15:00.000Z",
      updatedAt: "2024-09-17T08:28:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    },
    {
      id: "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
      strategyId: "550e8400-e29b-41d4-a716-446655440003",
      symbol: "SPY",
      accountType: "real",
      direction: "long",
      quantity: 100,
      entryPrice: 428.50,
      exitPrice: 0,
      entryDate: "2024-09-18",
      entryTime: "10:00",
      exitDate: "",
      exitTime: "",
      stopLoss: 420.00,
      takeProfit: 445.00,
      status: "open",
      pnl: 0,
      netPnl: 0,
      notes: "Swing trade setup, pullback to 20 EMA completed. Expecting move to 445 area.",
      tags: ["swing", "ema-pullback", "open-position"],
      commission: 0,
      createdAt: "2024-09-18T10:00:00.000Z",
      updatedAt: "2024-09-18T10:00:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    },
    {
      id: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
      strategyId: "550e8400-e29b-41d4-a716-446655440001",
      symbol: "EURUSD",
      accountType: "demo",
      direction: "long",
      quantity: 1.0,
      entryPrice: 1.0895,
      exitPrice: 1.0875,
      entryDate: "2024-09-19",
      entryTime: "13:45",
      exitDate: "2024-09-19",
      exitTime: "14:20",
      stopLoss: 1.0870,
      takeProfit: 1.0940,
      status: "closed",
      pnl: -20,
      netPnl: -20,
      notes: "False breakout, stopped out quickly. Market conditions changed.",
      tags: ["false-breakout", "stop-loss"],
      commission: 0,
      createdAt: "2024-09-19T13:45:00.000Z",
      updatedAt: "2024-09-19T14:20:00.000Z",
      deviceId: AppState.syncState.deviceId,
      isDirty: false
    },
    {
      id: "6ba7b815-9dad-11d1-80b4-00c04fd430c8",
      strategyId: "550e8400-e29b-41d4-a716-446655440002",
      symbol: "XAUUSD",
      accountType: "real",
      direction: "short",
      quantity: 0.2,
      entryPrice: 1972.30,
      exitPrice: 1958.75,
      entryDate: "2024-09-20",
      entryTime: "11:30",
      exitDate: "2024-09-20",
      exitTime: "15:45",
      stopLoss: 1980.00,
      takeProfit: 1955.00,
      status: "closed",
      pnl: 271,
      netPnl: 263,
      notes: "Excellent mean reversion from overbought levels. RSI was at 78 at entry.",
      tags: ["overbought", "mean-reversion"],
      commission: 8,
      createdAt: "2024-09-20T11:30:00.000Z",
      updatedAt: "2024-09-20T15:45:00.000Z",
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

// **ONLY CHANGED SECTION: REAL SYNC IMPLEMENTATION**
async function syncData() {
  if (!AppState.syncState.isOnline) return;

  try {
    AppState.syncState.status = 'syncing';
    updateSyncStatus();

    console.log('Starting sync with server:', AppConfig.serverUrl);

    // Send full state to server and get latest changes back
    const response = await fetch(`${AppConfig.serverUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AppConfig.authToken}`
      },
      body: JSON.stringify({
        trades: AppState.trades,
        strategies: AppState.strategies,
        lastSyncToken: AppState.syncState.lastSyncToken,
        deviceId: AppState.syncState.deviceId
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    const serverData = await response.json();
    console.log('Received server response:', serverData);

    // Merge server changes if any exist
    if (serverData.serverChanges) {
      if (serverData.serverChanges.trades && serverData.serverChanges.trades.length > 0) {
        mergeServerData(serverData.serverChanges.trades, 'trades');
        console.log('Merged server trades:', serverData.serverChanges.trades.length);
      }
      
      if (serverData.serverChanges.strategies && serverData.serverChanges.strategies.length > 0) {
        mergeServerData(serverData.serverChanges.strategies, 'strategies');
        console.log('Merged server strategies:', serverData.serverChanges.strategies.length);
      }
    }

    // Update sync metadata
    AppState.syncState.lastSyncToken = serverData.syncToken;
    AppState.syncState.lastSyncTime = new Date().toISOString();
    AppState.syncState.status = 'idle';
    AppState.syncQueue = []; // Clear sync queue after successful sync

    saveDataLocally();
    updateSyncStatus();
    addSyncLogEntry('Sync completed successfully', 'success');

    // Refresh current view to show new data
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
      showSection(activeSection.id);
    }

  } catch (error) {
    console.error('Sync failed:', error);
    AppState.syncState.status = 'error';
    updateSyncStatus();
    addSyncLogEntry(`Sync error: ${error.message}`, 'error');
    throw error;
  }
}

// Helper function to merge server data into local state
function mergeServerData(serverData, type) {
  if (!Array.isArray(serverData)) return;
  
  const localData = AppState[type];
  
  serverData.forEach(serverItem => {
    const existingIndex = localData.findIndex(item => item.id === serverItem.id);
    
    if (existingIndex === -1) {
      // New item from server
      localData.push({ ...serverItem, isDirty: false });
    } else {
      // Update existing item if server version is newer
      const serverTime = new Date(serverItem.updatedAt || serverItem.serverUpdatedAt).getTime();
      const localTime = new Date(localData[existingIndex].updatedAt).getTime();
      
      if (serverTime > localTime) {
        localData[existingIndex] = { ...serverItem, isDirty: false };
      }
    }
  });
}
// **END OF CHANGED SECTION**

// Navigation functionality
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  // Remove active class from all nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected section
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
    section.classList.add('fade-in');
  }

  // Add active class to corresponding nav button
  const navBtn = document.querySelector(`[data-section="${sectionId}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Load section-specific content
  switch(sectionId) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'add-trade':
      loadTradeForm();
      break;
    case 'strategies':
      loadStrategies();
      break;
    case 'calendar':
      loadCalendar();
      break;
    case 'analytics':
      loadAnalytics();
      break;
    case 'history':
      loadTradeHistory();
      break;
    case 'sync':
      loadSyncDashboard();
      break;
  }
}

// Account toggle functionality
function setupAccountToggle() {
  const toggle = document.getElementById('account-toggle');
  const label = document.querySelector('.account-label');
  
  if (!toggle || !label) return;

  // Set initial state
  toggle.checked = AppState.currentAccount === 'real';
  label.textContent = AppState.currentAccount === 'real' ? 'Real' : 'Demo';

  toggle.addEventListener('change', function() {
    AppState.currentAccount = this.checked ? 'real' : 'demo';
    label.textContent = this.checked ? 'Real' : 'Demo';
    
    saveAppSettings();
    
    // Refresh current section
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
      showSection(activeSection.id);
    }
    
    showToast(`Switched to ${AppState.currentAccount} account`, 'success');
  });
}

// Dashboard functionality
function loadDashboard() {
  const currentTrades = getCurrentAccountTrades();
  const metrics = calculateAdvancedMetrics(currentTrades);
  
  updateDashboardMetrics(metrics);
  loadDashboardCharts();
  loadRecentTrades();
  updateSyncStatus();
}

function updateDashboardMetrics(metrics) {
  const elements = {
    'total-pnl': formatCurrency(metrics.totalPnL),
    'win-rate': `${metrics.winRate}%`,
    'profit-factor': metrics.profitFactor.toFixed(2),
    'max-drawdown': formatCurrency(metrics.maxDrawdown)
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  // Update change indicators
  const pnlChange = document.getElementById('pnl-change');
  if (pnlChange) {
    const changePercent = metrics.totalPnL >= 0 ? 
      `+${((metrics.winRate - 50) / 50 * 100).toFixed(1)}%` : 
      `-${((50 - metrics.winRate) / 50 * 100).toFixed(1)}%`;
    pnlChange.textContent = changePercent;
    pnlChange.className = `metric-change ${metrics.totalPnL >= 0 ? 'positive' : 'negative'}`;
  }

  const winRateTrades = document.getElementById('win-rate-trades');
  if (winRateTrades) {
    winRateTrades.textContent = `${metrics.totalTrades} trades`;
  }

  const expectancy = document.getElementById('expectancy');
  if (expectancy) {
    expectancy.textContent = `${formatCurrency(metrics.expectancy)} exp.`;
  }

  const openTrades = document.getElementById('open-trades');
  if (openTrades) {
    openTrades.textContent = `${metrics.openTrades} open`;
  }
}

function calculateAdvancedMetrics(trades) {
  const closedTrades = trades.filter(t => t.status === 'closed');
  const winningTrades = closedTrades.filter(t => t.netPnl > 0);
  const losingTrades = closedTrades.filter(t => t.netPnl < 0);
  const openTrades = trades.filter(t => t.status === 'open');

  const totalPnL = closedTrades.reduce((sum, trade) => sum + trade.netPnl, 0);
  const winRate = closedTrades.length > 0 ? 
    Math.round((winningTrades.length / closedTrades.length) * 100) : 0;

  const avgWin = winningTrades.length > 0 ? 
    winningTrades.reduce((sum, t) => sum + t.netPnl, 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? 
    Math.abs(losingTrades.reduce((sum, t) => sum + t.netPnl, 0) / losingTrades.length) : 0;

  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 999 : 0);
  const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;

  // Calculate max drawdown
  const maxDrawdown = calculateMaxDrawdown(closedTrades);

  return {
    totalPnL,
    winRate,
    profitFactor,
    expectancy,
    maxDrawdown,
    avgWin,
    avgLoss,
    totalTrades: trades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length
  };
}

function calculateMaxDrawdown(trades) {
  if (trades.length === 0) return 0;

  const sortedTrades = trades.sort((a, b) => 
    new Date(a.exitDate + ' ' + a.exitTime) - new Date(b.exitDate + ' ' + b.exitTime)
  );

  let balance = 10000; // Starting balance
  let peak = balance;
  let maxDrawdown = 0;

  sortedTrades.forEach(trade => {
    balance += trade.netPnl;
    if (balance > peak) {
      peak = balance;
    }
    const drawdown = peak - balance;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return -maxDrawdown;
}

function getCurrentAccountTrades() {
  return AppState.trades.filter(trade => trade.accountType === AppState.currentAccount);
}

function loadDashboardCharts() {
  loadEquityCurveChart();
  loadMonthlyPerformanceChart();
}

function loadEquityCurveChart() {
  const ctx = document.getElementById('equity-chart');
  if (!ctx) return;

  const currentTrades = getCurrentAccountTrades()
    .filter(t => t.status === 'closed')
    .sort((a, b) => new Date(a.exitDate + ' ' + a.exitTime) - new Date(b.exitDate + ' ' + b.exitTime));

  let runningBalance = 10000; // Starting balance
  const data = [runningBalance];
  const labels = ['Start'];

  currentTrades.forEach((trade) => {
    runningBalance += trade.netPnl;
    data.push(runningBalance);
    labels.push(formatDate(trade.exitDate));
  });

  if (AppState.charts.equity) {
    AppState.charts.equity.destroy();
  }

  AppState.charts.equity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Account Balance',
        data: data,
        borderColor: '#1FB8CD',
        backgroundColor: 'rgba(31, 184, 205, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return 'Balance: ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: { display: true, text: 'Trades' }
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: 'Account Balance' },
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function loadMonthlyPerformanceChart() {
  const ctx = document.getElementById('monthly-chart');
  if (!ctx) return;

  const currentTrades = getCurrentAccountTrades().filter(t => t.status === 'closed');
  const monthlyData = {};

  currentTrades.forEach(trade => {
    const date = new Date(trade.exitDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + trade.netPnl;
  });

  const labels = Object.keys(monthlyData).sort();
  const data = labels.map(key => monthlyData[key]);

  if (AppState.charts.monthly) {
    AppState.charts.monthly.destroy();
  }

  AppState.charts.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(formatMonthLabel),
      datasets: [{
        label: 'Monthly P&L',
        data: data,
        backgroundColor: data.map(val => val >= 0 ? '#1FB8CD' : '#B4413C'),
        borderColor: data.map(val => val >= 0 ? '#1FB8CD' : '#B4413C'),
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'P&L: ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: 'Month' } },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'P&L' },
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function loadRecentTrades() {
  const currentTrades = getCurrentAccountTrades()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const container = document.getElementById('recent-trades-table');
  if (!container) return;

  if (currentTrades.length === 0) {
    container.innerHTML = '<div class="no-data">No trades found for this account</div>';
    return;
  }

  let html = `
    <table class="trades-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Direction</th>
          <th>P&L</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  currentTrades.forEach(trade => {
    html += `
      <tr>
        <td>${trade.symbol}</td>
        <td class="direction ${trade.direction}">${trade.direction.toUpperCase()}</td>
        <td class="pnl ${trade.netPnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(trade.netPnl)}</td>
        <td>${formatDate(trade.exitDate || trade.entryDate)}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// Trade form functionality
function loadTradeForm() {
  setupTradeForm();
  populateStrategyDropdown();
  setupFormValidation();
}

function setupTradeForm() {
  const form = document.getElementById('trade-form');
  if (!form) return;

  form.addEventListener('submit', handleTradeSubmission);

  // Auto-calculate P&L when exit price is entered
  const exitPriceInput = document.getElementById('exit-price');
  const entryPriceInput = document.getElementById('entry-price');
  const quantityInput = document.getElementById('quantity');
  const directionSelect = document.getElementById('direction');

  if (exitPriceInput && entryPriceInput && quantityInput && directionSelect) {
    [exitPriceInput, entryPriceInput, quantityInput, directionSelect].forEach(input => {
      input.addEventListener('input', calculatePnL);
    });
  }
}

function calculatePnL() {
  const entryPrice = parseFloat(document.getElementById('entry-price').value);
  const exitPrice = parseFloat(document.getElementById('exit-price').value);
  const quantity = parseFloat(document.getElementById('quantity').value);
  const direction = document.getElementById('direction').value;

  if (entryPrice && exitPrice && quantity && direction) {
    let pnl = 0;
    
    if (direction === 'long') {
      pnl = (exitPrice - entryPrice) * quantity;
    } else {
      pnl = (entryPrice - exitPrice) * quantity;
    }

    const pnlDisplay = document.getElementById('calculated-pnl');
    if (pnlDisplay) {
      pnlDisplay.textContent = formatCurrency(pnl);
      pnlDisplay.className = pnl >= 0 ? 'positive' : 'negative';
    }
  }
}

function populateStrategyDropdown() {
  const strategySelect = document.getElementById('strategy-id');
  if (!strategySelect) return;

  strategySelect.innerHTML = '<option value="">Select Strategy</option>';
  
  AppState.strategies.forEach(strategy => {
    const option = document.createElement('option');
    option.value = strategy.id;
    option.textContent = strategy.name;
    strategySelect.appendChild(option);
  });
}

function handleTradeSubmission(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const trade = {
    id: generateUUID(),
    strategyId: formData.get('strategy-id'),
    symbol: formData.get('symbol').toUpperCase(),
    accountType: AppState.currentAccount,
    direction: formData.get('direction'),
    quantity: parseFloat(formData.get('quantity')),
    entryPrice: parseFloat(formData.get('entry-price')),
    exitPrice: parseFloat(formData.get('exit-price')) || null,
    entryDate: formData.get('entry-date'),
    entryTime: formData.get('entry-time'),
    exitDate: formData.get('exit-date') || '',
    exitTime: formData.get('exit-time') || '',
    stopLoss: parseFloat(formData.get('stop-loss')) || null,
    takeProfit: parseFloat(formData.get('take-profit')) || null,
    status: formData.get('exit-price') ? 'closed' : 'open',
    notes: formData.get('notes') || '',
    tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
    commission: parseFloat(formData.get('commission')) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deviceId: AppState.syncState.deviceId,
    isDirty: true
  };

  // Calculate P&L
  if (trade.exitPrice && trade.status === 'closed') {
    if (trade.direction === 'long') {
      trade.pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
    } else {
      trade.pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity;
    }
    trade.netPnl = trade.pnl - trade.commission;
  } else {
    trade.pnl = 0;
    trade.netPnl = 0;
  }

  AppState.trades.push(trade);
  saveDataLocally();
  
  showToast('Trade added successfully!', 'success');
  e.target.reset();
  
  // Trigger sync after adding trade
  if (AppState.syncState.isOnline) {
    setTimeout(syncData, 1000);
  }
}

function setupFormValidation() {
  const symbolInput = document.getElementById('symbol');
  if (symbolInput) {
    symbolInput.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });
  }
}

// Strategies functionality
function loadStrategies() {
  const container = document.getElementById('strategies-container');
  if (!container) return;

  if (AppState.strategies.length === 0) {
    container.innerHTML = '<div class="no-data">No strategies found</div>';
    return;
  }

  let html = '<div class="strategies-grid">';
  
  AppState.strategies.forEach(strategy => {
    const strategyTrades = AppState.trades.filter(t => t.strategyId === strategy.id);
    const metrics = calculateAdvancedMetrics(strategyTrades);
    
    html += `
      <div class="strategy-card">
        <div class="strategy-header">
          <h3>${strategy.name}</h3>
          <span class="strategy-category">${strategy.category}</span>
        </div>
        <p class="strategy-description">${strategy.description}</p>
        <div class="strategy-stats">
          <div class="stat">
            <span class="label">Win Rate:</span>
            <span class="value">${metrics.winRate}%</span>
          </div>
          <div class="stat">
            <span class="label">Total P&L:</span>
            <span class="value ${metrics.totalPnL >= 0 ? 'positive' : 'negative'}">${formatCurrency(metrics.totalPnL)}</span>
          </div>
          <div class="stat">
            <span class="label">Trades:</span>
            <span class="value">${metrics.totalTrades}</span>
          </div>
        </div>
        <div class="strategy-rules">
          <strong>Rules:</strong>
          <p>${strategy.rules}</p>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// Calendar functionality
function loadCalendar() {
  const container = document.getElementById('calendar-container');
  if (!container) return;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  generateCalendar(currentMonth, currentYear);
}

function generateCalendar(month, year) {
  const container = document.getElementById('calendar-container');
  if (!container) return;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  let html = `
    <div class="calendar-header">
      <button onclick="navigateMonth(-1)">&lt;</button>
      <h3>${monthNames[month]} ${year}</h3>
      <button onclick="navigateMonth(1)">&gt;</button>
    </div>
    <div class="calendar-grid">
      <div class="day-header">Sun</div>
      <div class="day-header">Mon</div>
      <div class="day-header">Tue</div>
      <div class="day-header">Wed</div>
      <div class="day-header">Thu</div>
      <div class="day-header">Fri</div>
      <div class="day-header">Sat</div>
  `;

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="day-cell empty"></div>';
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTrades = getCurrentAccountTrades().filter(t => 
      t.entryDate === dateStr || t.exitDate === dateStr
    );
    const totalPnL = dayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);

    html += `
      <div class="day-cell ${dayTrades.length > 0 ? 'has-trades' : ''}" data-date="${dateStr}">
        <span class="day-number">${day}</span>
        ${dayTrades.length > 0 ? `
          <div class="day-pnl ${totalPnL >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(totalPnL)}
          </div>
          <div class="trade-count">${dayTrades.length} trades</div>
        ` : ''}
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;

  // Store current month/year for navigation
  AppState.calendarMonth = month;
  AppState.calendarYear = year;
}

function navigateMonth(direction) {
  let newMonth = AppState.calendarMonth + direction;
  let newYear = AppState.calendarYear;

  if (newMonth < 0) {
    newMonth = 11;
    newYear--;
  } else if (newMonth > 11) {
    newMonth = 0;
    newYear++;
  }

  generateCalendar(newMonth, newYear);
}

// Analytics functionality
function loadAnalytics() {
  const currentTrades = getCurrentAccountTrades();
  
  loadPerformanceMetrics();
  loadAnalyticsCharts();
  loadTradeBreakdown();
}

function loadPerformanceMetrics() {
  const currentTrades = getCurrentAccountTrades();
  const metrics = calculateAdvancedMetrics(currentTrades);

  // Update all metric displays
  const metricElements = {
    'analytics-total-pnl': formatCurrency(metrics.totalPnL),
    'analytics-win-rate': `${metrics.winRate}%`,
    'analytics-profit-factor': metrics.profitFactor.toFixed(2),
    'analytics-expectancy': formatCurrency(metrics.expectancy),
    'analytics-max-drawdown': formatCurrency(metrics.maxDrawdown),
    'analytics-avg-win': formatCurrency(metrics.avgWin),
    'analytics-avg-loss': formatCurrency(Math.abs(metrics.avgLoss)),
    'analytics-total-trades': metrics.totalTrades.toString(),
    'analytics-winning-trades': metrics.winningTrades.toString(),
    'analytics-losing-trades': metrics.losingTrades.toString()
  };

  Object.entries(metricElements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function loadAnalyticsCharts() {
  loadSymbolPerformanceChart();
  loadStrategyPerformanceChart();
  loadHourlyPerformanceChart();
}

function loadSymbolPerformanceChart() {
  const ctx = document.getElementById('symbol-performance-chart');
  if (!ctx) return;

  const currentTrades = getCurrentAccountTrades().filter(t => t.status === 'closed');
  const symbolData = {};

  currentTrades.forEach(trade => {
    symbolData[trade.symbol] = (symbolData[trade.symbol] || 0) + trade.netPnl;
  });

  const labels = Object.keys(symbolData);
  const data = Object.values(symbolData);

  if (AppState.charts.symbolPerformance) {
    AppState.charts.symbolPerformance.destroy();
  }

  AppState.charts.symbolPerformance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data.map(Math.abs),
        backgroundColor: [
          '#1FB8CD', '#B4413C', '#F39C12', '#27AE60', '#8E44AD',
          '#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + formatCurrency(data[context.dataIndex]);
            }
          }
        }
      }
    }
  });
}

function loadStrategyPerformanceChart() {
  const ctx = document.getElementById('strategy-performance-chart');
  if (!ctx) return;

  const currentTrades = getCurrentAccountTrades().filter(t => t.status === 'closed');
  const strategyData = {};

  currentTrades.forEach(trade => {
    const strategy = AppState.strategies.find(s => s.id === trade.strategyId);
    const strategyName = strategy ? strategy.name : 'Unknown';
    strategyData[strategyName] = (strategyData[strategyName] || 0) + trade.netPnl;
  });

  const labels = Object.keys(strategyData);
  const data = Object.values(strategyData);

  if (AppState.charts.strategyPerformance) {
    AppState.charts.strategyPerformance.destroy();
  }

  AppState.charts.strategyPerformance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Strategy P&L',
        data: data,
        backgroundColor: data.map(val => val >= 0 ? '#1FB8CD' : '#B4413C')
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function loadHourlyPerformanceChart() {
  const ctx = document.getElementById('hourly-performance-chart');
  if (!ctx) return;

  const currentTrades = getCurrentAccountTrades().filter(t => t.status === 'closed' && t.entryTime);
  const hourlyData = {};

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = 0;
  }

  currentTrades.forEach(trade => {
    if (trade.entryTime) {
      const hour = parseInt(trade.entryTime.split(':')[0]);
      hourlyData[hour] += trade.netPnl;
    }
  });

  const labels = Object.keys(hourlyData).map(hour => `${hour}:00`);
  const data = Object.values(hourlyData);

  if (AppState.charts.hourlyPerformance) {
    AppState.charts.hourlyPerformance.destroy();
  }

  AppState.charts.hourlyPerformance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Hourly P&L',
        data: data,
        borderColor: '#1FB8CD',
        backgroundColor: 'rgba(31, 184, 205, 0.1)',
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function loadTradeBreakdown() {
  const container = document.getElementById('trade-breakdown');
  if (!container) return;

  const currentTrades = getCurrentAccountTrades();
  const breakdown = {
    byDirection: { long: 0, short: 0 },
    byStatus: { open: 0, closed: 0 },
    byOutcome: { winning: 0, losing: 0, breakeven: 0 }
  };

  currentTrades.forEach(trade => {
    breakdown.byDirection[trade.direction]++;
    breakdown.byStatus[trade.status]++;

    if (trade.status === 'closed') {
      if (trade.netPnl > 0) breakdown.byOutcome.winning++;
      else if (trade.netPnl < 0) breakdown.byOutcome.losing++;
      else breakdown.byOutcome.breakeven++;
    }
  });

  let html = `
    <div class="breakdown-section">
      <h4>Direction Breakdown</h4>
      <div class="breakdown-item">Long: ${breakdown.byDirection.long}</div>
      <div class="breakdown-item">Short: ${breakdown.byDirection.short}</div>
    </div>
    <div class="breakdown-section">
      <h4>Status Breakdown</h4>
      <div class="breakdown-item">Open: ${breakdown.byStatus.open}</div>
      <div class="breakdown-item">Closed: ${breakdown.byStatus.closed}</div>
    </div>
    <div class="breakdown-section">
      <h4>Outcome Breakdown</h4>
      <div class="breakdown-item positive">Winning: ${breakdown.byOutcome.winning}</div>
      <div class="breakdown-item negative">Losing: ${breakdown.byOutcome.losing}</div>
      <div class="breakdown-item">Breakeven: ${breakdown.byOutcome.breakeven}</div>
    </div>
  `;

  container.innerHTML = html;
}

// History functionality
function loadTradeHistory() {
  const currentTrades = getCurrentAccountTrades();
  
  displayTradeHistoryTable(currentTrades);
  setupHistoryFilters();
  setupHistoryPagination();
}

function displayTradeHistoryTable(trades) {
  const container = document.getElementById('history-table-container');
  if (!container) return;

  if (trades.length === 0) {
    container.innerHTML = '<div class="no-data">No trades found</div>';
    return;
  }

  let html = `
    <table class="history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Symbol</th>
          <th>Strategy</th>
          <th>Direction</th>
          <th>Quantity</th>
          <th>Entry</th>
          <th>Exit</th>
          <th>P&L</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  trades.forEach(trade => {
    const strategy = AppState.strategies.find(s => s.id === trade.strategyId);
    const strategyName = strategy ? strategy.name : 'Unknown';

    html += `
      <tr>
        <td>${formatDate(trade.entryDate)}</td>
        <td>${trade.symbol}</td>
        <td>${strategyName}</td>
        <td class="direction ${trade.direction}">${trade.direction.toUpperCase()}</td>
        <td>${trade.quantity}</td>
        <td>${trade.entryPrice}</td>
        <td>${trade.exitPrice || '-'}</td>
        <td class="pnl ${trade.netPnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(trade.netPnl)}</td>
        <td class="status ${trade.status}">${trade.status.toUpperCase()}</td>
        <td>
          <button onclick="editTrade('${trade.id}')" class="btn-small">Edit</button>
          <button onclick="deleteTrade('${trade.id}')" class="btn-small btn-danger">Delete</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function setupHistoryFilters() {
  const filterForm = document.getElementById('history-filters');
  if (!filterForm) return;

  filterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    applyHistoryFilters();
  });

  // Setup symbol dropdown
  const symbolSelect = document.getElementById('filter-symbol');
  if (symbolSelect) {
    const symbols = [...new Set(AppState.trades.map(t => t.symbol))].sort();
    symbolSelect.innerHTML = '<option value="">All Symbols</option>';
    symbols.forEach(symbol => {
      const option = document.createElement('option');
      option.value = symbol;
      option.textContent = symbol;
      symbolSelect.appendChild(option);
    });
  }

  // Setup strategy dropdown
  const strategySelect = document.getElementById('filter-strategy');
  if (strategySelect) {
    strategySelect.innerHTML = '<option value="">All Strategies</option>';
    AppState.strategies.forEach(strategy => {
      const option = document.createElement('option');
      option.value = strategy.id;
      option.textContent = strategy.name;
      strategySelect.appendChild(option);
    });
  }
}

function applyHistoryFilters() {
  const symbol = document.getElementById('filter-symbol')?.value || '';
  const strategy = document.getElementById('filter-strategy')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';
  const dateFrom = document.getElementById('filter-date-from')?.value || '';
  const dateTo = document.getElementById('filter-date-to')?.value || '';

  let filteredTrades = getCurrentAccountTrades();

  if (symbol) {
    filteredTrades = filteredTrades.filter(t => t.symbol === symbol);
  }

  if (strategy) {
    filteredTrades = filteredTrades.filter(t => t.strategyId === strategy);
  }

  if (status) {
    filteredTrades = filteredTrades.filter(t => t.status === status);
  }

  if (dateFrom) {
    filteredTrades = filteredTrades.filter(t => t.entryDate >= dateFrom);
  }

  if (dateTo) {
    filteredTrades = filteredTrades.filter(t => t.entryDate <= dateTo);
  }

  displayTradeHistoryTable(filteredTrades);
}

function setupHistoryPagination() {
  // Pagination logic would go here
  // For now, we'll show all trades
}

function editTrade(tradeId) {
  // Implementation for editing trades
  showToast('Edit functionality coming soon', 'info');
}

function deleteTrade(tradeId) {
  if (confirm('Are you sure you want to delete this trade?')) {
    const tradeIndex = AppState.trades.findIndex(t => t.id === tradeId);
    if (tradeIndex !== -1) {
      AppState.trades.splice(tradeIndex, 1);
      saveDataLocally();
      loadTradeHistory();
      showToast('Trade deleted successfully', 'success');
      
      // Trigger sync after deletion
      if (AppState.syncState.isOnline) {
        setTimeout(syncData, 1000);
      }
    }
  }
}

// Sync and data management
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
  
  // Update sync status classes
  const syncStatusElements = document.querySelectorAll('.sync-status');
  syncStatusElements.forEach(element => {
    element.className = 'sync-status';
    element.classList.add(AppState.syncState.status);
  });
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
  AppState.syncState.status = 'syncing';
  updateSyncStatus();
  
  try {
    await syncData();
    showToast('Sync completed successfully!', 'success');
    addSyncLogEntry('Manual sync completed', 'success');
  } catch (error) {
    console.error('Sync failed:', error);
    showToast('Sync failed. Please try again.', 'error');
    addSyncLogEntry(`Sync failed: ${error.message}`, 'error');
    AppState.syncState.status = 'error';
  } finally {
    hideLoadingOverlay();
    updateSyncStatus();
  }
}

function addToSyncQueue(action, type, data) {
  AppState.syncQueue.push({
    id: generateUUID(),
    action,
    type,
    data: { ...data },
    timestamp: new Date().toISOString(),
    idempotencyKey: generateUUID()
  });
  
  AppState.syncState.pendingChanges = AppState.syncQueue.length;
  updateSyncStatus();
  saveDataLocally();
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

// Data management functions
function exportAllData() {
  const data = {
    strategies: AppState.strategies,
    trades: AppState.trades,
    syncState: AppState.syncState,
    exportDate: new Date().toISOString(),
    version: AppConfig.version
  };
  
  const jsonData = JSON.stringify(data, null, 2);
  downloadFile(`trading_journal_backup_${formatDateKey(new Date())}.json`, jsonData, 'application/json');
  showToast('Data exported successfully!', 'success');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.strategies) AppState.strategies = data.strategies;
        if (data.trades) AppState.trades = data.trades;
        if (data.syncState) AppState.syncState = { ...AppState.syncState, ...data.syncState };
        
        saveDataLocally();
        showToast('Data imported successfully!', 'success');
        
        // Refresh current view
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
          showSection(activeSection.id);
        }
      } catch (error) {
        console.error('Import failed:', error);
        showToast('Failed to import data. Please check file format.', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function createBackup() {
  exportAllData();
}

function restoreBackup() {
  importData();
}

function clearAllData() {
  if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) return;
  
  AppState.strategies = [];
  AppState.trades = [];
  AppState.syncQueue = [];
  AppState.syncState.lastSyncTime = null;
  
  localStorage.clear();
  showToast('All data cleared successfully!', 'success');
  
  // Reinitialize with sample data
  initializeData();
  
  // Refresh current view
  const activeSection = document.querySelector('.section.active');
  if (activeSection) {
    showSection(activeSection.id);
  }
}

function showSyncSettings() {
  showToast('Sync settings available in the form above', 'info');
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

function formatDateTime(date) {
  return date.toLocaleString();
}

function formatDateKey(date) {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function downloadFile(filename, content, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function showToast(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ${type === 'success' ? 'background-color: #27AE60;' : ''}
    ${type === 'error' ? 'background-color: #E74C3C;' : ''}
    ${type === 'info' ? 'background-color: #3498DB;' : ''}
    ${type === 'warning' ? 'background-color: #F39C12;' : ''}
  `;
  
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Hide and remove toast
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function showLoadingOverlay(message) {
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
    color: white;
    font-size: 18px;
  `;
  overlay.innerHTML = `
    <div>
      <div class="loading-spinner"></div>
      <div>${message}</div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Auto-sync functionality
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

// Online/offline detection
window.addEventListener('online', () => {
  AppState.syncState.isOnline = true;
  updateSyncStatus();
  addSyncLogEntry('Connection restored', 'info');
  startAutoSync();
  
  // Trigger sync when coming back online
  setTimeout(syncData, 2000);
});

window.addEventListener('offline', () => {
  AppState.syncState.isOnline = false;
  updateSyncStatus();
  addSyncLogEntry('Connection lost', 'warning');
  stopAutoSync();
});

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Trading Journal Pro...');
  
  // Load existing data or initialize with samples
  if (!loadDataLocally()) {
    initializeData();
  }
  
  // Setup navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const section = this.getAttribute('data-section');
      if (section) {
        showSection(section);
      }
    });
  });
  
  // Setup account toggle
  setupAccountToggle();
  
  // Setup sync configuration form
  setupSyncConfigForm();
  
  // Set initial section
  showSection('dashboard');
  
  // Update online status
  AppState.syncState.isOnline = navigator.onLine;
  
  // Start auto sync if online
  if (AppState.syncState.isOnline) {
    startAutoSync();
    // Initial sync after 3 seconds
    setTimeout(syncData, 3000);
  }
  
  AppState.isInitialized = true;
  console.log('Trading Journal Pro initialized successfully');
});

// Global functions for HTML onclick handlers
window.forceSync = forceSync;
window.navigateMonth = navigateMonth;
window.editTrade = editTrade;
window.deleteTrade = deleteTrade;
window.exportAllData = exportAllData;
window.importData = importData;
window.createBackup = createBackup;
window.restoreBackup = restoreBackup;
window.clearAllData = clearAllData;
window.showSyncSettings = showSyncSettings;
