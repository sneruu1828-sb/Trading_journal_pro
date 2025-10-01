// Trading Journal Pro - Enhanced Sync-Enabled Application

// Global configuration
const AppConfig = {
  serverUrl: 'https://trading-journal-pro-3gwm.onrender.com',
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
  const winRate = closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 0;
  
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.netPnl, 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.netPnl, 0) / losingTrades.length) : 0;
  
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;
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
  
  const sortedTrades = trades.sort((a, b) => new Date(a.exitDate + ' ' + a.exitTime) - new Date(b.exitDate + ' ' + b.exitTime));
  
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
        legend: {
          display: false
        },
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
          title: {
            display: true,
            text: 'Trades'
          }
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Account Balance'
          },
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
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'P&L: ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Month'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'P&L'
          },
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
    container.innerHTML = '<div class="text-center text-muted">No recent trades</div>';
    return;
  }
  
  let html = `
    <div class="trades-table-header">
      <div>Symbol</div>
      <div>Strategy</div>
      <div>Direction</div>
      <div>Entry</div>
      <div>Exit</div>
      <div>P&L</div>
      <div>Status</div>
      <div>Actions</div>
    </div>
  `;
  
  currentTrades.forEach(trade => {
    const strategy = AppState.strategies.find(s => s.id === trade.strategyId);
    const pnlClass = trade.netPnl > 0 ? 'positive' : trade.netPnl < 0 ? 'negative' : '';
    
    html += `
      <div class="trades-table-row">
        <div data-label="Symbol">${trade.symbol}</div>
        <div data-label="Strategy">${strategy?.name || 'Unknown'}</div>
        <div data-label="Direction">${capitalizeFirst(trade.direction)}</div>
        <div data-label="Entry">${trade.entryPrice}</div>
        <div data-label="Exit">${trade.exitPrice || '-'}</div>
        <div data-label="P&L" class="trade-pnl ${pnlClass}">${formatCurrency(trade.netPnl)}</div>
        <div data-label="Status"><span class="trade-status ${trade.status}">${capitalizeFirst(trade.status)}</span></div>
        <div data-label="Actions" class="trade-actions">
          <button class="btn btn--sm btn--outline" onclick="viewTradeDetails('${trade.id}')">View</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Trade form functionality
function loadTradeForm() {
  populateStrategyDropdown();
  setupTradeForm();
  setupSymbolAutocomplete();
  setupRiskRewardCalculator();
  
  // Set default values
  const accountSelect = document.getElementById('trade-account-type');
  if (accountSelect) {
    accountSelect.value = AppState.currentAccount;
  }
  
  const entryDate = document.getElementById('trade-entry-date');
  if (entryDate) {
    entryDate.value = formatDateInput(new Date());
  }
  
  const entryTime = document.getElementById('trade-entry-time');
  if (entryTime) {
    entryTime.value = getCurrentTime();
  }
  
  loadTradeDraft();
}

function populateStrategyDropdown() {
  const select = document.getElementById('trade-strategy');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Strategy</option>';
  
  AppState.strategies.forEach(strategy => {
    const option = document.createElement('option');
    option.value = strategy.id;
    option.textContent = strategy.name;
    select.appendChild(option);
  });
}

function setupSymbolAutocomplete() {
  const symbolInput = document.getElementById('trade-symbol');
  const dropdown = document.getElementById('symbol-dropdown');
  
  if (!symbolInput || !dropdown) return;
  
  symbolInput.addEventListener('input', function() {
    const value = this.value.toUpperCase();
    const matches = SYMBOLS.filter(symbol => symbol.includes(value));
    
    if (value.length > 0 && matches.length > 0) {
      dropdown.innerHTML = matches.slice(0, 10).map(symbol => 
        `<div class="autocomplete-item" onclick="selectSymbol('${symbol}')">${symbol}</div>`
      ).join('');
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  });
  
  // Hide dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!symbolInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

function selectSymbol(symbol) {
  const symbolInput = document.getElementById('trade-symbol');
  const dropdown = document.getElementById('symbol-dropdown');
  
  if (symbolInput) symbolInput.value = symbol;
  if (dropdown) dropdown.style.display = 'none';
  
  calculateRiskReward();
}

function setupRiskRewardCalculator() {
  const inputs = ['trade-entry-price', 'trade-stop-loss', 'trade-take-profit', 'trade-quantity'];
  
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', debounce(calculateRiskReward, 300));
    }
  });
}

function calculateRiskReward() {
  const entryPrice = parseFloat(document.getElementById('trade-entry-price')?.value || 0);
  const stopLoss = parseFloat(document.getElementById('trade-stop-loss')?.value || 0);
  const takeProfit = parseFloat(document.getElementById('trade-take-profit')?.value || 0);
  const quantity = parseFloat(document.getElementById('trade-quantity')?.value || 0);
  const direction = document.getElementById('trade-direction')?.value || 'long';
  
  const display = document.getElementById('risk-reward-display');
  
  if (!entryPrice || !quantity || (!stopLoss && !takeProfit)) {
    if (display) display.style.display = 'none';
    return;
  }
  
  let risk = 0;
  let reward = 0;
  
  if (direction === 'long') {
    risk = stopLoss ? (entryPrice - stopLoss) * quantity : 0;
    reward = takeProfit ? (takeProfit - entryPrice) * quantity : 0;
  } else {
    risk = stopLoss ? (stopLoss - entryPrice) * quantity : 0;
    reward = takeProfit ? (entryPrice - takeProfit) * quantity : 0;
  }
  
  const ratio = risk > 0 ? reward / risk : 0;
  
  if (display) {
    display.style.display = 'flex';
    
    const riskElement = document.getElementById('trade-risk');
    const rewardElement = document.getElementById('trade-reward');
    const ratioElement = document.getElementById('trade-rr-ratio');
    
    if (riskElement) riskElement.textContent = formatCurrency(Math.abs(risk));
    if (rewardElement) rewardElement.textContent = formatCurrency(reward);
    if (ratioElement) {
      ratioElement.textContent = `1:${ratio.toFixed(2)}`;
      ratioElement.className = `rr-value ${ratio >= 2 ? 'text-success' : ratio >= 1 ? 'text-warning' : 'text-error'}`;
    }
  }
}

function setupTradeForm() {
  const form = document.getElementById('trade-form');
  const statusSelect = document.getElementById('trade-status');
  const exitFields = document.getElementById('exit-fields');
  
  if (!form) return;
  
  // Show/hide exit fields based on status
  if (statusSelect && exitFields) {
    statusSelect.addEventListener('change', function() {
      exitFields.style.display = this.value === 'closed' ? 'block' : 'none';
    });
  }
  
  // Auto-save draft
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('input', debounce(saveTradeDraft, 1000));
  });
  
  // Form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    addTrade();
  });
}

function addTrade() {
  const form = document.getElementById('trade-form');
  if (!form) return;
  
  // Validate form
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const trade = {
    id: generateUUID(),
    strategyId: document.getElementById('trade-strategy').value,
    symbol: document.getElementById('trade-symbol').value.toUpperCase(),
    accountType: document.getElementById('trade-account-type').value,
    direction: document.getElementById('trade-direction').value,
    quantity: parseFloat(document.getElementById('trade-quantity').value),
    entryPrice: parseFloat(document.getElementById('trade-entry-price').value),
    exitPrice: parseFloat(document.getElementById('trade-exit-price').value) || 0,
    entryDate: document.getElementById('trade-entry-date').value,
    entryTime: document.getElementById('trade-entry-time').value,
    exitDate: document.getElementById('trade-exit-date').value || '',
    exitTime: document.getElementById('trade-exit-time').value || '',
    stopLoss: parseFloat(document.getElementById('trade-stop-loss').value) || 0,
    takeProfit: parseFloat(document.getElementById('trade-take-profit').value) || 0,
    status: document.getElementById('trade-status').value,
    commission: parseFloat(document.getElementById('trade-commission').value) || 0,
    tags: document.getElementById('trade-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
    notes: document.getElementById('trade-notes').value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deviceId: AppState.syncState.deviceId,
    isDirty: true
  };
  
  // Calculate P&L for closed trades
  if (trade.status === 'closed' && trade.exitPrice > 0) {
    const priceDiff = trade.direction === 'long' ? 
      (trade.exitPrice - trade.entryPrice) : 
      (trade.entryPrice - trade.exitPrice);
    trade.pnl = priceDiff * trade.quantity;
    trade.netPnl = trade.pnl + trade.commission;
  } else {
    trade.pnl = 0;
    trade.netPnl = trade.commission;
  }
  
  AppState.trades.push(trade);
  addToSyncQueue('CREATE', 'trade', trade);
  saveDataLocally();
  
  showToast('Trade added successfully!', 'success');
  clearTradeDraft();
  resetTradeForm();
  
  // Auto-sync if online
  if (AppState.syncState.isOnline) {
    setTimeout(syncData, 1000);
  }
}

function saveTradeDraft() {
  const formData = {
    strategyId: document.getElementById('trade-strategy')?.value || '',
    symbol: document.getElementById('trade-symbol')?.value || '',
    accountType: document.getElementById('trade-account-type')?.value || '',
    direction: document.getElementById('trade-direction')?.value || '',
    quantity: document.getElementById('trade-quantity')?.value || '',
    entryPrice: document.getElementById('trade-entry-price')?.value || '',
    stopLoss: document.getElementById('trade-stop-loss')?.value || '',
    takeProfit: document.getElementById('trade-take-profit')?.value || '',
    status: document.getElementById('trade-status')?.value || '',
    commission: document.getElementById('trade-commission')?.value || '',
    tags: document.getElementById('trade-tags')?.value || '',
    notes: document.getElementById('trade-notes')?.value || ''
  };
  
  // Only save if there's meaningful data
  const hasData = Object.values(formData).some(value => value.trim() !== '');
  if (hasData) {
    localStorage.setItem('tradingJournal_draft', JSON.stringify(formData));
  }
}

function saveDraft() {
  saveTradeDraft();
  showToast('Draft saved successfully!', 'success');
}

function loadTradeDraft() {
  try {
    const draft = localStorage.getItem('tradingJournal_draft');
    if (!draft) return;
    
    const formData = JSON.parse(draft);
    
    Object.entries(formData).forEach(([key, value]) => {
      const element = document.getElementById(`trade-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      if (element && value) {
        element.value = value;
      }
    });
    
    // Trigger status change to show/hide exit fields
    const statusSelect = document.getElementById('trade-status');
    if (statusSelect) {
      statusSelect.dispatchEvent(new Event('change'));
    }
    
    showToast('Draft loaded', 'info');
  } catch (error) {
    console.error('Failed to load draft:', error);
  }
}

function clearTradeDraft() {
  localStorage.removeItem('tradingJournal_draft');
}

function resetTradeForm() {
  const form = document.getElementById('trade-form');
  if (!form) return;
  
  form.reset();
  document.getElementById('exit-fields').style.display = 'none';
  document.getElementById('risk-reward-display').style.display = 'none';
  
  // Reset to current defaults
  document.getElementById('trade-account-type').value = AppState.currentAccount;
  document.getElementById('trade-entry-date').value = formatDateInput(new Date());
  document.getElementById('trade-entry-time').value = getCurrentTime();
}

// Strategy management
function loadStrategies() {
  const container = document.getElementById('strategies-grid');
  if (!container) return;
  
  if (AppState.strategies.length === 0) {
    container.innerHTML = '<div class="text-center text-muted">No strategies created yet</div>';
    return;
  }
  
  let html = '';
  
  AppState.strategies.forEach(strategy => {
    const trades = AppState.trades.filter(t => t.strategyId === strategy.id);
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalPnL = closedTrades.reduce((sum, t) => sum + t.netPnL, 0);
    const winRate = closedTrades.length > 0 ? 
      Math.round((closedTrades.filter(t => t.netPnL > 0).length / closedTrades.length) * 100) : 0;
    
    html += `
      <div class="strategy-card">
        <div class="strategy-header">
          <h3 class="strategy-name">${strategy.name}</h3>
          <span class="strategy-category">${strategy.category}</span>
        </div>
        <p class="strategy-description">${strategy.description}</p>
        <div class="strategy-stats">
          <div class="strategy-stat">
            <div class="strategy-stat-value">${trades.length}</div>
            <div class="strategy-stat-label">Trades</div>
          </div>
          <div class="strategy-stat">
            <div class="strategy-stat-value">${winRate}%</div>
            <div class="strategy-stat-label">Win Rate</div>
          </div>
          <div class="strategy-stat">
            <div class="strategy-stat-value ${totalPnL >= 0 ? 'text-success' : 'text-error'}">${formatCurrency(totalPnL)}</div>
            <div class="strategy-stat-label">Total P&L</div>
          </div>
        </div>
        <div class="strategy-rules">${strategy.rules}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function showAddStrategyModal() {
  document.getElementById('add-strategy-modal').classList.remove('hidden');
}

function hideAddStrategyModal() {
  document.getElementById('add-strategy-modal').classList.add('hidden');
  document.getElementById('strategy-form').reset();
}

function setupStrategyForm() {
  const form = document.getElementById('strategy-form');
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const strategy = {
      id: generateUUID(),
      name: document.getElementById('strategy-name').value,
      description: document.getElementById('strategy-description').value,
      category: document.getElementById('strategy-category').value,
      rules: document.getElementById('strategy-rules').value,
      defaultRisk: parseFloat(document.getElementById('strategy-default-risk').value),
      winRate: 0,
      avgProfit: 0,
      avgLoss: 0,
      totalTrades: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deviceId: AppState.syncState.deviceId,
      isDirty: true
    };
    
    AppState.strategies.push(strategy);
    addToSyncQueue('CREATE', 'strategy', strategy);
    saveDataLocally();
    
    hideAddStrategyModal();
    loadStrategies();
    populateStrategyDropdown();
    
    showToast('Strategy added successfully!', 'success');
    
    // Auto-sync if online
    if (AppState.syncState.isOnline) {
      setTimeout(syncData, 1000);
    }
  });
}

function exportStrategies() {
  const data = JSON.stringify(AppState.strategies, null, 2);
  downloadFile(`strategies_${formatDateKey(new Date())}.json`, data, 'application/json');
  showToast('Strategies exported successfully!', 'success');
}

// Calendar functionality
function loadCalendar() {
  updateCalendarHeader();
  updateCalendarSummary();
  generateCalendar();
}

function updateCalendarHeader() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthYear = document.getElementById('calendar-month-year');
  if (monthYear) {
    monthYear.textContent = `${monthNames[AppState.currentDate.getMonth()]} ${AppState.currentDate.getFullYear()}`;
  }
}

function updateCalendarSummary() {
  const container = document.getElementById('calendar-summary');
  if (!container) return;
  
  const currentTrades = getCurrentAccountTrades();
  const year = AppState.currentDate.getFullYear();
  const month = AppState.currentDate.getMonth();
  
  // Filter trades for current month
  const monthTrades = currentTrades.filter(trade => {
    const tradeDate = new Date(trade.exitDate || trade.entryDate);
    return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
  });
  
  const closedTrades = monthTrades.filter(t => t.status === 'closed');
  const totalPnL = closedTrades.reduce((sum, t) => sum + t.netPnl, 0);
  const winRate = closedTrades.length > 0 ? 
    Math.round((closedTrades.filter(t => t.netPnl > 0).length / closedTrades.length) * 100) : 0;
  
  container.innerHTML = `
    <div class="calendar-summary-card">
      <div class="calendar-summary-value ${totalPnL >= 0 ? 'text-success' : 'text-error'}">${formatCurrency(totalPnL)}</div>
      <div class="calendar-summary-label">Monthly P&L</div>
    </div>
    <div class="calendar-summary-card">
      <div class="calendar-summary-value">${monthTrades.length}</div>
      <div class="calendar-summary-label">Total Trades</div>
    </div>
    <div class="calendar-summary-card">
      <div class="calendar-summary-value">${winRate}%</div>
      <div class="calendar-summary-label">Win Rate</div>
    </div>
    <div class="calendar-summary-card">
      <div class="calendar-summary-value">${monthTrades.filter(t => t.status === 'open').length}</div>
      <div class="calendar-summary-label">Open Trades</div>
    </div>
  `;
}

function generateCalendar() {
  const container = document.getElementById('calendar-grid');
  if (!container) return;
  
  const year = AppState.currentDate.getFullYear();
  const month = AppState.currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const currentTrades = getCurrentAccountTrades();
  const dailyData = calculateDailyData(currentTrades);
  
  let html = `
    <div class="calendar-header-row">
      <div class="calendar-header-cell">Sun</div>
      <div class="calendar-header-cell">Mon</div>
      <div class="calendar-header-cell">Tue</div>
      <div class="calendar-header-cell">Wed</div>
      <div class="calendar-header-cell">Thu</div>
      <div class="calendar-header-cell">Fri</div>
      <div class="calendar-header-cell">Sat</div>
    </div>
  `;
  
  let currentWeek = '';
  let dayCount = 0;
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dateKey = formatDateKey(date);
    const dayData = dailyData[dateKey];
    const isCurrentMonth = date.getMonth() === month;
    
    let dayClass = 'calendar-day';
    if (!isCurrentMonth) dayClass += ' other-month';
    if (dayData) {
      if (dayData.pnl > 0) dayClass += ' profit';
      else if (dayData.pnl < 0) dayClass += ' loss';
      else dayClass += ' breakeven';
    }
    
    currentWeek += `
      <div class="${dayClass}" onclick="showDayDetails('${dateKey}')">
        <div class="calendar-day-number">${date.getDate()}</div>
        ${dayData ? `
          <div class="calendar-day-pnl ${dayData.pnl >= 0 ? 'text-success' : 'text-error'}">
            ${formatCurrency(dayData.pnl)}
          </div>
          <div class="calendar-day-trades">${dayData.trades} trade${dayData.trades !== 1 ? 's' : ''}</div>
        ` : ''}
      </div>
    `;
    
    dayCount++;
    if (dayCount === 7) {
      html += `<div class="calendar-week">${currentWeek}</div>`;
      currentWeek = '';
      dayCount = 0;
    }
  }
  
  container.innerHTML = html;
}

function calculateDailyData(trades) {
  const dailyData = {};
  
  trades.forEach(trade => {
    const dateKey = trade.status === 'closed' && trade.exitDate ? trade.exitDate : trade.entryDate;
    if (!dateKey) return;
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { pnl: 0, trades: 0 };
    }
    
    if (trade.status === 'closed') {
      dailyData[dateKey].pnl += trade.netPnl;
    }
    dailyData[dateKey].trades++;
  });
  
  return dailyData;
}

function previousMonth() {
  AppState.currentDate.setMonth(AppState.currentDate.getMonth() - 1);
  loadCalendar();
}

function nextMonth() {
  AppState.currentDate.setMonth(AppState.currentDate.getMonth() + 1);
  loadCalendar();
}

function showDayDetails(dateKey) {
  const currentTrades = getCurrentAccountTrades()
    .filter(trade => trade.exitDate === dateKey || trade.entryDate === dateKey);
  
  if (currentTrades.length === 0) {
    showToast('No trades on this date', 'info');
    return;
  }
  
  let details = `Trades for ${formatDate(dateKey)}:\n\n`;
  let totalPnL = 0;
  
  currentTrades.forEach(trade => {
    const strategy = AppState.strategies.find(s => s.id === trade.strategyId);
    details += `${trade.symbol} - ${strategy?.name || 'Unknown'} - ${formatCurrency(trade.netPnl)}\n`;
    if (trade.status === 'closed') {
      totalPnL += trade.netPnl;
    }
  });
  
  details += `\nTotal P&L: ${formatCurrency(totalPnL)}`;
  
  alert(details);
}

function exportCalendar() {
  const year = AppState.currentDate.getFullYear();
  const month = AppState.currentDate.getMonth();
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const currentTrades = getCurrentAccountTrades().filter(trade => {
    const tradeDate = new Date(trade.exitDate || trade.entryDate);
    return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
  });
  
  const data = JSON.stringify({ month: monthName, trades: currentTrades }, null, 2);
  downloadFile(`calendar_${monthName.replace(' ', '-').toLowerCase()}.json`, data, 'application/json');
  showToast('Calendar exported successfully!', 'success');
}

// Analytics functionality
function loadAnalytics() {
  setupAnalyticsToggle();
  updateAnalyticsContent('demo');
}

function setupAnalyticsToggle() {
  const buttons = document.querySelectorAll('.analytics-toggle .btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', function() {
      buttons.forEach(b => {
        b.classList.remove('active');
        b.classList.add('btn--outline');
        b.classList.remove('btn--primary');
      });
      
      this.classList.add('active');
      this.classList.remove('btn--outline');
      this.classList.add('btn--primary');
      
      updateAnalyticsContent(this.dataset.account);
    });
  });
}

function updateAnalyticsContent(accountType) {
  const trades = AppState.trades.filter(t => t.accountType === accountType);
  const metrics = calculateAdvancedMetrics(trades);
  
  // Update metrics
  updateAnalyticsMetrics(metrics);
  
  // Load charts
  loadAnalyticsCharts(trades);
}

function updateAnalyticsMetrics(metrics) {
  const elements = {
    'analytics-pnl': formatCurrency(metrics.totalPnL),
    'analytics-winrate': `${metrics.winRate}%`,
    'analytics-profit-factor': metrics.profitFactor.toFixed(2),
    'analytics-sharpe': '0.00', // Placeholder
    'analytics-drawdown': formatCurrency(metrics.maxDrawdown),
    'analytics-expectancy': formatCurrency(metrics.expectancy)
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function loadAnalyticsCharts(trades) {
  loadAnalyticsEquityChart(trades);
  loadAnalyticsStrategyChart(trades);
  loadAnalyticsMonthlyChart(trades);
  loadAnalyticsRiskChart(trades);
}

function loadAnalyticsEquityChart(trades) {
  const ctx = document.getElementById('analytics-equity-chart');
  if (!ctx) return;
  
  const closedTrades = trades
    .filter(t => t.status === 'closed')
    .sort((a, b) => new Date(a.exitDate + ' ' + a.exitTime) - new Date(b.exitDate + ' ' + b.exitTime));
  
  let runningBalance = 10000;
  const data = [runningBalance];
  const labels = ['Start'];
  
  closedTrades.forEach((trade) => {
    runningBalance += trade.netPnl;
    data.push(runningBalance);
    labels.push(formatDate(trade.exitDate));
  });
  
  if (AppState.charts.analyticsEquity) {
    AppState.charts.analyticsEquity.destroy();
  }
  
  AppState.charts.analyticsEquity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Equity Curve',
        data: data,
        borderColor: '#1FB8CD',
        backgroundColor: 'rgba(31, 184, 205, 0.1)',
        fill: true,
        tension: 0.4
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
          beginAtZero: false,
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

function loadAnalyticsStrategyChart(trades) {
  const ctx = document.getElementById('analytics-strategy-chart');
  if (!ctx) return;
  
  const strategyPnL = {};
  const closedTrades = trades.filter(t => t.status === 'closed');
  
  closedTrades.forEach(trade => {
    const strategy = AppState.strategies.find(s => s.id === trade.strategyId);
    if (strategy) {
      strategyPnL[strategy.name] = (strategyPnL[strategy.name] || 0) + trade.netPnl;
    }
  });
  
  const labels = Object.keys(strategyPnL);
  const data = Object.values(strategyPnL);
  const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'];
  
  if (AppState.charts.analyticsStrategy) {
    AppState.charts.analyticsStrategy.destroy();
  }
  
  AppState.charts.analyticsStrategy = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function loadAnalyticsMonthlyChart(trades) {
  const ctx = document.getElementById('analytics-monthly-chart');
  if (!ctx) return;
  
  const monthlyData = {};
  const closedTrades = trades.filter(t => t.status === 'closed');
  
  closedTrades.forEach(trade => {
    const date = new Date(trade.exitDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + trade.netPnl;
  });
  
  const labels = Object.keys(monthlyData).sort();
  const data = labels.map(key => monthlyData[key]);
  
  if (AppState.charts.analyticsMonthly) {
    AppState.charts.analyticsMonthly.destroy();
  }
  
  AppState.charts.analyticsMonthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(formatMonthLabel),
      datasets: [{
        label: 'Monthly P&L',
        data: data,
        backgroundColor: data.map(val => val >= 0 ? '#1FB8CD' : '#B4413C'),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
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

function loadAnalyticsRiskChart(trades) {
  const ctx = document.getElementById('analytics-risk-chart');
  if (!ctx) return;
  
  const closedTrades = trades.filter(t => t.status === 'closed');
  const pnlDistribution = {};
  
  closedTrades.forEach(trade => {
    const range = Math.floor(trade.netPnl / 50) * 50;
    const key = range >= 0 ? `+${range}` : `${range}`;
    pnlDistribution[key] = (pnlDistribution[key] || 0) + 1;
  });
  
  const labels = Object.keys(pnlDistribution).sort((a, b) => parseInt(a) - parseInt(b));
  const data = labels.map(key => pnlDistribution[key]);
  
  if (AppState.charts.analyticsRisk) {
    AppState.charts.analyticsRisk.destroy();
  }
  
  AppState.charts.analyticsRisk = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(l => `${l}$`),
      datasets: [{
        label: 'Trade Count',
        data: data,
        backgroundColor: '#FFC185',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'P&L Distribution'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

// Trade History functionality
function loadTradeHistory() {
  populateHistoryFilters();
  setupHistorySearch();
  displayTradeHistory();
}

function populateHistoryFilters() {
  // Populate strategy filter
  const strategyFilter = document.getElementById('filter-strategy');
  if (strategyFilter) {
    strategyFilter.innerHTML = '<option value="">All Strategies</option>';
    AppState.strategies.forEach(strategy => {
      const option = document.createElement('option');
      option.value = strategy.id;
      option.textContent = strategy.name;
      strategyFilter.appendChild(option);
    });
  }
  
  // Populate symbol filter
  const symbolFilter = document.getElementById('filter-symbol');
  if (symbolFilter) {
    const symbols = [...new Set(AppState.trades.map(t => t.symbol))].sort();
    symbolFilter.innerHTML = '<option value="">All Symbols</option>';
    symbols.forEach(symbol => {
      const option = document.createElement('option');
      option.value = symbol;
      option.textContent = symbol;
      symbolFilter.appendChild(option);
    });
  }
  
  // Add event listeners
  const filters = ['filter-strategy', 'filter-symbol', 'filter-status'];
  filters.forEach(filterId => {
    const filter = document.getElementById(filterId);
    if (filter) {
      filter.addEventListener('change', () => {
        AppState.filters[filterId.replace('filter-', '')] = filter.value;
        AppState.pagination.page = 1;
        displayTradeHistory();
      });
    }
  });
}

function setupHistorySearch() {
  const searchInput = document.getElementById('search-trades');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      AppState.searchQuery = searchInput.value;
      AppState.pagination.page = 1;
      displayTradeHistory();
    }, 300));
  }
}

function displayTradeHistory() {
  let filteredTrades = getCurrentAccountTrades();
  
  // Apply filters
  if (AppState.filters.strategy) {
    filteredTrades = filteredTrades.filter(t => t.strategyId === AppState.filters.strategy);
  }
  if (AppState.filters.symbol) {
    filteredTrades = filteredTrades.filter(t => t.symbol === AppState.filters.symbol);
  }
  if (AppState.filters.status) {
    filteredTrades = filteredTrades.filter(t => t.status === AppState.filters.status);
  }
  
  // Apply search
  if (AppState.searchQuery) {
    const query = AppState.searchQuery.toLowerCase();
    filteredTrades = filteredTrades.filter(trade => {
      const strategy = AppState.strategies.find(s => s.id === trade.strategyId);
      return (
        trade.symbol.toLowerCase().includes(query) ||
        (strategy?.name || '').toLowerCase().includes(query) ||
        trade.notes.toLowerCase().includes(query) ||
        trade.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }
  
  // Sort trades
  filteredTrades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Update pagination
  AppState.pagination.total = filteredTrades.length;
  const startIndex = (AppState.pagination.page - 1) * AppState.pagination.limit;
  const endIndex = startIndex + AppState.pagination.limit;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);
  
  displayTradesTable(paginatedTrades);
  displayPagination();
}

function displayTradesTable(trades) {
  const container = document.getElementById('trades-table');
  if (!container) return;
  
  if (trades.length === 0) {
    container.innerHTML = '<div class="text-center text-muted">No trades found</div>';
    return;
  }
  
  let html = `
    <div class="trades-table-header">
      <div>Symbol</div>
      <div>Strategy</div>
      <div>Direction</div>
      <div>Entry</div>
      <div>Exit</div>
      <div>Quantity</div>
      <div>P&L</div>
      <div>Status</div>
      <div>Actions</div>
    </div>
  `;
  
  trades.forEach(trade => {
    const strategy = AppState.strategies.find(s => s.id === trade.strategyId);
    const pnlClass = trade.netPnl > 0 ? 'positive' : trade.netPnl < 0 ? 'negative' : '';
    
    html += `
      <div class="trades-table-row">
        <div data-label="Symbol">${trade.symbol}</div>
        <div data-label="Strategy">${strategy?.name || 'Unknown'}</div>
        <div data-label="Direction">${capitalizeFirst(trade.direction)}</div>
        <div data-label="Entry">${trade.entryPrice}</div>
        <div data-label="Exit">${trade.exitPrice || '-'}</div>
        <div data-label="Quantity">${trade.quantity}</div>
        <div data-label="P&L" class="trade-pnl ${pnlClass}">${formatCurrency(trade.netPnl)}</div>
        <div data-label="Status"><span class="trade-status ${trade.status}">${capitalizeFirst(trade.status)}</span></div>
        <div data-label="Actions" class="trade-actions">
          <button class="btn btn--sm btn--outline" onclick="viewTradeDetails('${trade.id}')">View</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function displayPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;
  
  const totalPages = Math.ceil(AppState.pagination.total / AppState.pagination.limit);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Previous button
  if (AppState.pagination.page > 1) {
    html += `<button class="btn btn--outline" onclick="changePage(${AppState.pagination.page - 1})">Previous</button>`;
  }
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === AppState.pagination.page) {
      html += `<button class="btn btn--primary">${i}</button>`;
    } else {
      html += `<button class="btn btn--outline" onclick="changePage(${i})">${i}</button>`;
    }
  }
  
  // Next button
  if (AppState.pagination.page < totalPages) {
    html += `<button class="btn btn--outline" onclick="changePage(${AppState.pagination.page + 1})">Next</button>`;
  }
  
  container.innerHTML = html;
}

function changePage(page) {
  AppState.pagination.page = page;
  displayTradeHistory();
}

function viewTradeDetails(tradeId) {
  const trade = AppState.trades.find(t => t.id === tradeId);
  if (!trade) return;
  
  const strategy = AppState.strategies.find(s => s.id === trade.strategyId);
  
  const modal = document.getElementById('trade-detail-modal');
  const content = document.getElementById('trade-detail-content');
  
  if (!modal || !content) return;
  
  content.innerHTML = `
    <div class="trade-detail-grid">
      <div class="trade-detail-item">
        <div class="trade-detail-label">Symbol</div>
        <div class="trade-detail-value">${trade.symbol}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Strategy</div>
        <div class="trade-detail-value">${strategy?.name || 'Unknown'}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Direction</div>
        <div class="trade-detail-value">${capitalizeFirst(trade.direction)}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Quantity</div>
        <div class="trade-detail-value">${trade.quantity}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Entry Price</div>
        <div class="trade-detail-value">${trade.entryPrice}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Exit Price</div>
        <div class="trade-detail-value">${trade.exitPrice || 'N/A'}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Entry Date</div>
        <div class="trade-detail-value">${formatDate(trade.entryDate)} ${trade.entryTime}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Exit Date</div>
        <div class="trade-detail-value">${trade.exitDate ? formatDate(trade.exitDate) + ' ' + trade.exitTime : 'N/A'}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Stop Loss</div>
        <div class="trade-detail-value">${trade.stopLoss || 'N/A'}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Take Profit</div>
        <div class="trade-detail-value">${trade.takeProfit || 'N/A'}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">P&L</div>
        <div class="trade-detail-value ${trade.netPnl >= 0 ? 'text-success' : 'text-error'}">${formatCurrency(trade.netPnl)}</div>
      </div>
      <div class="trade-detail-item">
        <div class="trade-detail-label">Status</div>
        <div class="trade-detail-value"><span class="trade-status ${trade.status}">${capitalizeFirst(trade.status)}</span></div>
      </div>
    </div>
    ${trade.notes ? `
      <div style="margin-top: 24px;">
        <h4>Notes</h4>
        <p>${trade.notes}</p>
      </div>
    ` : ''}
    ${trade.tags.length > 0 ? `
      <div style="margin-top: 16px;">
        <h4>Tags</h4>
        <p>${trade.tags.join(', ')}</p>
      </div>
    ` : ''}
  `;
  
  modal.classList.remove('hidden');
}

function hideTradeDetailModal() {
  document.getElementById('trade-detail-modal').classList.add('hidden');
}

function exportTrades() {
  const trades = getCurrentAccountTrades();
  if (trades.length === 0) {
    showToast('No trades to export', 'warning');
    return;
  }
  
  const csvHeaders = [
    'Date', 'Time', 'Symbol', 'Strategy', 'Direction', 'Quantity', 
    'Entry Price', 'Exit Price', 'Stop Loss', 'Take Profit', 
    'P&L', 'Net P&L', 'Commission', 'Status', 'Tags', 'Notes'
  ];
  
  let csvContent = csvHeaders.join(',') + '\n';
  
  trades.forEach(trade => {
    const strategy = AppState.strategies.find(s => s.id === trade.strategyId);
    const row = [
      trade.entryDate,
      trade.entryTime,
      trade.symbol,
      `"${strategy?.name || 'Unknown'}"`,
      trade.direction,
      trade.quantity,
      trade.entryPrice,
      trade.exitPrice || '',
      trade.stopLoss || '',
      trade.takeProfit || '',
      trade.pnl || 0,
      trade.netPnl || 0,
      trade.commission || 0,
      trade.status,
      `"${trade.tags.join(';')}"`,
      `"${(trade.notes || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });
  
  downloadFile(`trading_journal_${AppState.currentAccount}_${formatDateKey(new Date())}.csv`, csvContent, 'text/csv');
  showToast('Trades exported successfully!', 'success');
}

function importTrades() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        let importedTrades = [];
        
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(e.target.result);
          importedTrades = Array.isArray(data) ? data : [data];
        } else {
          showToast('CSV import not fully implemented yet', 'warning');
          return;
        }
        
        // Add trades
        importedTrades.forEach(trade => {
          trade.id = generateUUID();
          trade.createdAt = new Date().toISOString();
          trade.updatedAt = new Date().toISOString();
          trade.deviceId = AppState.syncState.deviceId;
          trade.isDirty = true;
          AppState.trades.push(trade);
          addToSyncQueue('CREATE', 'trade', trade);
        });
        
        saveDataLocally();
        displayTradeHistory();
        showToast(`${importedTrades.length} trades imported successfully!`, 'success');
      } catch (error) {
        console.error('Import failed:', error);
        showToast('Failed to import trades. Please check file format.', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
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

async function syncData() {
  if (!AppState.syncState.isOnline) return;
  
  try {
    AppState.syncState.status = 'syncing';
    
    // Simulate API calls (since we don't have a real server)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Process sync queue
    AppState.syncQueue.forEach(item => {
      addSyncLogEntry(`Synced ${item.action} ${item.type}: ${item.data.id}`, 'info');
    });
    
    // Clear sync queue
    AppState.syncQueue = [];
    AppState.syncState.lastSyncTime = new Date().toISOString();
    AppState.syncState.status = 'idle';
    
    // Mark all items as not dirty
    AppState.trades.forEach(trade => trade.isDirty = false);
    AppState.strategies.forEach(strategy => strategy.isDirty = false);
    
    saveDataLocally();
    updateSyncStatus();
  } catch (error) {
    AppState.syncState.status = 'error';
    throw error;
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
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDateTime(date) {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

function formatDateInput(date) {
  return formatDateKey(date);
}

function getCurrentTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// UI helpers
function showLoadingOverlay(text = 'Loading...') {
  const overlay = document.getElementById('loading-overlay');
  const textElement = document.querySelector('.loading-text');
  
  if (overlay) {
    overlay.classList.remove('hidden');
    if (textElement) textElement.textContent = text;
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const messageElement = document.getElementById('toast-message');
  
  if (!toast || !messageElement) {
    console.log(`Toast: ${message}`);
    return;
  }
  
  messageElement.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideToast();
  }, 5000);
}

function hideToast() {
  const toast = document.getElementById('toast');
  if (toast) toast.classList.add('hidden');
}

// Network status monitoring
function setupNetworkMonitoring() {
  window.addEventListener('online', function() {
    AppState.syncState.isOnline = true;
    updateSyncStatus();
    showToast('Connection restored. Syncing data...', 'success');
    addSyncLogEntry('Connection restored', 'info');
    
    if (AppState.syncQueue.length > 0) {
      setTimeout(syncData, 1000);
    }
  });
  
  window.addEventListener('offline', function() {
    AppState.syncState.isOnline = false;
    AppState.syncState.status = 'offline';
    updateSyncStatus();
    showToast('Connection lost. Working offline.', 'warning');
    addSyncLogEntry('Connection lost - working offline', 'warning');
  });
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  // Load data
  if (!loadDataLocally()) {
    initializeData();
  } else {
    AppState.isInitialized = true;
    addSyncLogEntry('Data loaded from local storage', 'info');
  }
  
  // Setup components
  setupAccountToggle();
  setupStrategyForm();
  setupSyncConfigForm();
  setupNetworkMonitoring();
  
  // Setup navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      showSection(this.dataset.section);
    });
  });
  
  // Setup modal close handlers
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
    }
  });
  
  // Setup keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Escape to close modals
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal:not(.hidden)');
      modals.forEach(modal => modal.classList.add('hidden'));
    }
  });
  
  // Load initial section
  showSection('dashboard');
  
  // Set up periodic sync
  setInterval(() => {
    if (AppState.syncState.isOnline && AppState.syncQueue.length > 0) {
      syncData();
    }
  }, AppConfig.syncInterval);
  
  // Initial sync if online
  if (AppState.syncState.isOnline && AppState.syncQueue.length > 0) {
    setTimeout(syncData, 2000);
  }
  
  addSyncLogEntry('Trading Journal Pro initialized', 'info');
  console.log('Trading Journal Pro initialized successfully');
});

// Global function declarations for onclick handlers
window.showSection = showSection;
window.forceSync = forceSync;
window.showAddStrategyModal = showAddStrategyModal;
window.hideAddStrategyModal = hideAddStrategyModal;
window.viewTradeDetails = viewTradeDetails;
window.hideTradeDetailModal = hideTradeDetailModal;
window.selectSymbol = selectSymbol;
window.saveDraft = saveDraft;
window.resetTradeForm = resetTradeForm;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.exportCalendar = exportCalendar;
window.changePage = changePage;
window.exportTrades = exportTrades;
window.importTrades = importTrades;
window.exportStrategies = exportStrategies;
window.exportAllData = exportAllData;
window.importData = importData;
window.createBackup = createBackup;
window.restoreBackup = restoreBackup;
window.clearAllData = clearAllData;
window.showSyncSettings = showSyncSettings;
window.hideToast = hideToast;
