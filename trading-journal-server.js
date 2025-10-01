const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// In-memory storage (replace with database in production)
let database = {
  trades: new Map(),
  strategies: new Map(),
  users: new Map(),
  syncTokens: new Map()
};

// Idempotency cache
const idempotencyCache = new Map();
const IDEMPOTENCY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Utility functions
function generateSyncToken() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function validateUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function lastWriteWinsMerge(existing, incoming, type = 'trade') {
  const changes = [];
  
  for (const item of incoming) {
    // Validate required fields
    if (!item.id || !validateUUID(item.id)) {
      console.warn(`Invalid ${type} ID:`, item.id);
      continue;
    }
    
    if (!item.updatedAt) {
      item.updatedAt = new Date().toISOString();
    }
    
    const existingItem = existing.get(item.id);
    const incomingTime = new Date(item.updatedAt).getTime();
    const existingTime = existingItem ? new Date(existingItem.updatedAt).getTime() : 0;
    
    if (!existingItem || incomingTime > existingTime) {
      existing.set(item.id, { ...item, serverUpdatedAt: new Date().toISOString() });
      changes.push(item.id);
    }
  }
  
  return changes;
}

// Authentication middleware (simple token-based for demo)
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  // In production, validate JWT token here
  req.userId = token || 'demo-user'; // Use token as userId for demo
  next();
}

// Idempotency middleware
function handleIdempotency(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];
  
  if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
    const cached = idempotencyCache.get(idempotencyKey);
    if (Date.now() - cached.timestamp < IDEMPOTENCY_TIMEOUT) {
      return res.json(cached.response);
    } else {
      idempotencyCache.delete(idempotencyKey);
    }
  }
  
  req.idempotencyKey = idempotencyKey;
  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Sync endpoint - handles both upload and download
app.post('/api/sync', authenticate, handleIdempotency, async (req, res) => {
  try {
    const { trades = [], strategies = [], lastSyncToken, deviceId } = req.body;
    const userId = req.userId;
    
    // Ensure user storage exists
    if (!database.users.has(userId)) {
      database.users.set(userId, {
        trades: new Map(),
        strategies: new Map()
      });
    }
    
    const userDb = database.users.get(userId);
    
    // Merge incoming changes using last-write-wins
    const changedTrades = lastWriteWinsMerge(userDb.trades, trades, 'trade');
    const changedStrategies = lastWriteWinsMerge(userDb.strategies, strategies, 'strategy');
    
    // Get changes since last sync
    const sinceTime = lastSyncToken ? new Date(lastSyncToken).getTime() : 0;
    
    const serverTrades = Array.from(userDb.trades.values())
      .filter(trade => new Date(trade.serverUpdatedAt || trade.updatedAt).getTime() > sinceTime);
    
    const serverStrategies = Array.from(userDb.strategies.values())
      .filter(strategy => new Date(strategy.serverUpdatedAt || strategy.updatedAt).getTime() > sinceTime);
    
    const newSyncToken = generateSyncToken();
    
    const response = {
      success: true,
      syncToken: newSyncToken,
      applied: {
        trades: changedTrades,
        strategies: changedStrategies
      },
      serverChanges: {
        trades: serverTrades,
        strategies: serverStrategies
      },
      stats: {
        totalTrades: userDb.trades.size,
        totalStrategies: userDb.strategies.size,
        lastSync: new Date().toISOString()
      }
    };
    
    // Cache response for idempotency
    if (req.idempotencyKey) {
      idempotencyCache.set(req.idempotencyKey, {
        response,
        timestamp: Date.now()
      });
    }
    
    // Log sync activity
    console.log(`Sync completed for user ${userId}: ${changedTrades.length} trades, ${changedStrategies.length} strategies`);
    
    res.json(response);
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      error: 'Sync failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get changes since token (pull-only sync)
app.get('/api/changes', authenticate, async (req, res) => {
  try {
    const { since, limit = 100 } = req.query;
    const userId = req.userId;
    
    if (!database.users.has(userId)) {
      return res.json({
        trades: [],
        strategies: [],
        syncToken: generateSyncToken()
      });
    }
    
    const userDb = database.users.get(userId);
    const sinceTime = since ? new Date(since).getTime() : 0;
    
    const trades = Array.from(userDb.trades.values())
      .filter(trade => new Date(trade.serverUpdatedAt || trade.updatedAt).getTime() > sinceTime)
      .slice(0, parseInt(limit));
    
    const strategies = Array.from(userDb.strategies.values())
      .filter(strategy => new Date(strategy.serverUpdatedAt || strategy.updatedAt).getTime() > sinceTime)
      .slice(0, parseInt(limit));
    
    res.json({
      trades,
      strategies,
      syncToken: generateSyncToken(),
      hasMore: trades.length === parseInt(limit) || strategies.length === parseInt(limit)
    });
    
  } catch (error) {
    console.error('Changes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch changes' });
  }
});

// Export data endpoint
app.get('/api/export', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const format = req.query.format || 'json';
    
    if (!database.users.has(userId)) {
      return res.status(404).json({ error: 'No data found' });
    }
    
    const userDb = database.users.get(userId);
    const data = {
      trades: Array.from(userDb.trades.values()),
      strategies: Array.from(userDb.strategies.values()),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    if (format === 'csv') {
      // Convert to CSV format
      const trades = data.trades;
      if (trades.length === 0) {
        return res.status(404).json({ error: 'No trades to export' });
      }
      
      const headers = Object.keys(trades[0]).join(',');
      const rows = trades.map(trade => 
        Object.values(trade).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=trades.csv');
      return res.send(`${headers}\n${rows}`);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=trading-journal-export.json');
    res.json(data);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Import data endpoint
app.post('/api/import', authenticate, async (req, res) => {
  try {
    const { trades = [], strategies = [], overwrite = false } = req.body;
    const userId = req.userId;
    
    if (!database.users.has(userId)) {
      database.users.set(userId, {
        trades: new Map(),
        strategies: new Map()
      });
    }
    
    const userDb = database.users.get(userId);
    let imported = { trades: 0, strategies: 0, skipped: 0 };
    
    // Import trades
    for (const trade of trades) {
      if (!trade.id) trade.id = uuidv4();
      if (!trade.updatedAt) trade.updatedAt = new Date().toISOString();
      
      if (!userDb.trades.has(trade.id) || overwrite) {
        userDb.trades.set(trade.id, { ...trade, serverUpdatedAt: new Date().toISOString() });
        imported.trades++;
      } else {
        imported.skipped++;
      }
    }
    
    // Import strategies
    for (const strategy of strategies) {
      if (!strategy.id) strategy.id = uuidv4();
      if (!strategy.updatedAt) strategy.updatedAt = new Date().toISOString();
      
      if (!userDb.strategies.has(strategy.id) || overwrite) {
        userDb.strategies.set(strategy.id, { ...strategy, serverUpdatedAt: new Date().toISOString() });
        imported.strategies++;
      } else {
        imported.skipped++;
      }
    }
    
    res.json({
      success: true,
      imported,
      message: `Imported ${imported.trades} trades and ${imported.strategies} strategies`
    });
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import failed' });
  }
});

// Get user statistics
app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!database.users.has(userId)) {
      return res.json({
        trades: { total: 0, demo: 0, real: 0 },
        strategies: { total: 0 },
        performance: { totalPnL: 0, winRate: 0 }
      });
    }
    
    const userDb = database.users.get(userId);
    const trades = Array.from(userDb.trades.values());
    const strategies = Array.from(userDb.strategies.values());
    
    const demoTrades = trades.filter(t => t.accountType === 'demo');
    const realTrades = trades.filter(t => t.accountType === 'real');
    
    const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl != null);
    const totalPnL = closedTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    const winningTrades = closedTrades.filter(t => parseFloat(t.pnl) > 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    
    res.json({
      trades: {
        total: trades.length,
        demo: demoTrades.length,
        real: realTrades.length,
        open: trades.filter(t => t.status === 'open').length,
        closed: closedTrades.length
      },
      strategies: {
        total: strategies.length
      },
      performance: {
        totalPnL: Math.round(totalPnL * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
        avgPnL: closedTrades.length > 0 ? Math.round((totalPnL / closedTrades.length) * 100) / 100 : 0
      },
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Trading Journal Sync Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;