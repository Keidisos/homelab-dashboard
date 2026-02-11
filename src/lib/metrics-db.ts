import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'metrics.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read/write performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,
    cpu_percent REAL NOT NULL,
    ram_percent REAL NOT NULL,
    timestamp INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_metrics_node_time
    ON metrics(node_id, timestamp);
`);

// Minimum interval between recordings (ms) to avoid duplicates from rapid polling
const MIN_RECORD_INTERVAL = 25000; // 25s
const lastRecordedTime: Record<string, number> = {};

// Prepared statements
const insertStmt = db.prepare(
  'INSERT INTO metrics (node_id, cpu_percent, ram_percent, timestamp) VALUES (?, ?, ?, ?)'
);

const queryRawStmt = db.prepare(
  'SELECT timestamp, cpu_percent, ram_percent FROM metrics WHERE node_id = ? AND timestamp > ? ORDER BY timestamp ASC'
);

const cleanupStmt = db.prepare(
  'DELETE FROM metrics WHERE timestamp < ?'
);

/**
 * Record a metric data point for a node.
 * Throttled to avoid recording too frequently.
 */
export function recordMetric(nodeId: string, cpuPercent: number, ramPercent: number): void {
  const now = Date.now();
  const lastTime = lastRecordedTime[nodeId] || 0;

  if (now - lastTime < MIN_RECORD_INTERVAL) return;

  insertStmt.run(nodeId, cpuPercent, ramPercent, now);
  lastRecordedTime[nodeId] = now;
}

export interface MetricPoint {
  timestamp: number;
  cpu_percent: number;
  ram_percent: number;
}

/**
 * Query metrics for a node within a time range.
 * Automatically downsamples for longer ranges to keep ~120-200 data points.
 */
export function getMetrics(nodeId: string, range: '1h' | '6h' | '24h' | '7d'): MetricPoint[] {
  const now = Date.now();
  const rangeMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };

  const since = now - (rangeMs[range] || rangeMs['1h']);
  const rows = queryRawStmt.all(nodeId, since) as MetricPoint[];

  // Downsample for longer ranges
  const targetPoints: Record<string, number> = {
    '1h': 120,    // every ~30s
    '6h': 120,    // every ~3min
    '24h': 144,   // every ~10min
    '7d': 168,    // every ~1h
  };

  const target = targetPoints[range] || 120;

  if (rows.length <= target) return rows;

  // Average-based downsampling
  const bucketSize = Math.ceil(rows.length / target);
  const downsampled: MetricPoint[] = [];

  for (let i = 0; i < rows.length; i += bucketSize) {
    const bucket = rows.slice(i, i + bucketSize);
    const avgCpu = bucket.reduce((sum, r) => sum + r.cpu_percent, 0) / bucket.length;
    const avgRam = bucket.reduce((sum, r) => sum + r.ram_percent, 0) / bucket.length;
    downsampled.push({
      timestamp: bucket[Math.floor(bucket.length / 2)].timestamp,
      cpu_percent: Math.round(avgCpu * 10) / 10,
      ram_percent: Math.round(avgRam * 10) / 10,
    });
  }

  return downsampled;
}

/**
 * Get list of known node IDs from the database.
 */
export function getNodeIds(): string[] {
  const rows = db.prepare('SELECT DISTINCT node_id FROM metrics').all() as { node_id: string }[];
  return rows.map(r => r.node_id);
}

/**
 * Delete metrics older than 7 days.
 */
export function cleanupOldMetrics(): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const result = cleanupStmt.run(cutoff);
  return result.changes;
}

// Run cleanup on module load and every 6 hours
cleanupOldMetrics();
setInterval(cleanupOldMetrics, 6 * 60 * 60 * 1000);
