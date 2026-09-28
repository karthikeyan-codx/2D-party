-- Migration 001: Initial Multiplayer Game Matches Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id VARCHAR(50) NOT NULL DEFAULT 'tic-tac-toe',
    room_id VARCHAR(32) NOT NULL,
    player_x VARCHAR(100) NOT NULL,
    player_o VARCHAR(100) NOT NULL,
    winner VARCHAR(10),
    result VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_turns INT NOT NULL DEFAULT 0,
    final_score_x INT NOT NULL DEFAULT 0,
    final_score_o INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_match_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES game_matches(id) ON DELETE CASCADE,
    player_id VARCHAR(100) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    result VARCHAR(20) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_matches_room_id ON game_matches(room_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_started_at ON game_matches(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON game_match_players(match_id);
