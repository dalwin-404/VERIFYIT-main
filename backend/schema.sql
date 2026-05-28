-- schema.sql
-- PostgreSQL Database Schema for VerifyIt Nigeria
-- Designed for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS verifyit_users (
    username VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for email-based lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON verifyit_users(email);

-- 2. Verifications Table
CREATE TABLE IF NOT EXISTS verifyit_verifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'text', 'url', 'image', 'deepfake'
    content TEXT NOT NULL,
    score NUMERIC(5, 2) NOT NULL, -- e.g. 70.00
    verdict VARCHAR(100) NOT NULL, -- e.g. 'Likely Fake', 'Verified'
    "user" VARCHAR(100) REFERENCES verifyit_users(username) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for rapid history fetches per user
CREATE INDEX IF NOT EXISTS idx_verifications_user ON verifyit_verifications("user");
CREATE INDEX IF NOT EXISTS idx_verifications_timestamp ON verifyit_verifications(timestamp DESC);

-- 3. Reports Table
CREATE TABLE IF NOT EXISTS verifyit_reports (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    reason TEXT NOT NULL,
    source_url VARCHAR(1000),
    category VARCHAR(100) DEFAULT 'misinformation',
    "user" VARCHAR(100) REFERENCES verifyit_users(username) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for report tracking
CREATE INDEX IF NOT EXISTS idx_reports_user ON verifyit_reports("user");
CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON verifyit_reports(timestamp DESC);
