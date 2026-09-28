import dotenv from 'dotenv';
dotenv.config();

function getCorsOrigin(): string | string[] {
  const origin = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN;
  if (!origin) {
    // Default local development origins
    return ['http://localhost:3000', 'http://localhost:3001'];
  }
  if (origin.includes(',')) {
    return origin.split(',').map((o) => o.trim());
  }
  return origin.trim();
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  playerDisconnectGracePeriodMs: parseInt(process.env.DISCONNECT_GRACE_MS || '30000', 10), // 30s
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexplay',
    ssl: process.env.DATABASE_SSL === 'true',
    maxPool: 10,
  },
  corsOrigin: getCorsOrigin(),
};
