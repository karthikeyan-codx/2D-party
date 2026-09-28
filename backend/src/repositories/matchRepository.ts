import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export interface PersistedMatch {
  gameId: string;
  roomId: string;
  playerX: string;
  playerO: string;
  winner: string | null;
  result: 'X_WIN' | 'O_WIN' | 'DRAW';
  startedAt: Date;
  endedAt: Date;
  totalTurns: number;
  finalScoreX: number;
  finalScoreO: number;
}

class MatchRepository {
  private pool: pg.Pool | null = null;
  private isConnected: boolean = false;
  private connectionTested: boolean = false;

  constructor() {
    try {
      this.pool = new Pool({
        connectionString: config.database.connectionString,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 2000,
      });
    } catch {
      this.pool = null;
    }
  }

  private async checkConnection(): Promise<boolean> {
    if (this.connectionTested) return this.isConnected;
    if (!this.pool) return false;

    try {
      const client = await this.pool.connect();
      client.release();
      this.isConnected = true;
    } catch {
      this.isConnected = false;
    } finally {
      this.connectionTested = true;
    }
    return this.isConnected;
  }

  /**
   * Persists a completed game match safely to PostgreSQL.
   */
  public async saveMatch(match: PersistedMatch): Promise<string | null> {
    const connected = await this.checkConnection();
    if (!connected || !this.pool) {
      // Memory/Development mode when PostgreSQL is offline
      return null;
    }

    try {
      const query = `
        INSERT INTO game_matches (
          game_id, room_id, player_x, player_o, winner, result,
          started_at, ended_at, total_turns, final_score_x, final_score_o
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id;
      `;
      const values = [
        match.gameId,
        match.roomId,
        match.playerX,
        match.playerO,
        match.winner,
        match.result,
        match.startedAt,
        match.endedAt,
        match.totalTurns,
        match.finalScoreX,
        match.finalScoreO,
      ];

      const res = await this.pool.query(query, values);
      return res.rows[0]?.id || null;
    } catch {
      return null;
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export const matchRepository = new MatchRepository();
