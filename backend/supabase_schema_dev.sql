-- ============================================================
-- AI Agent Platform — Supabase Schema (Day 1 Testing Version)
-- Run this FIRST if you want to test without Supabase Auth setup
-- This version removes the auth.users foreign key constraint
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Phone Number Pool ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS phone_number_pool (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL,
    vertical TEXT,
    area_code TEXT,
    assigned BOOLEAN DEFAULT FALSE,
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Businesses (Dev version — no auth constraint) ────────
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id TEXT NOT NULL,  -- Plain text owner/session identifier; no Supabase Auth required
    name TEXT NOT NULL,
    vertical TEXT NOT NULL CHECK (vertical IN ('clinic', 'call_center', 'restaurant')),
    phone_number TEXT UNIQUE NOT NULL,
    onboarding_config JSONB DEFAULT '{}',
    plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'growth', 'pro')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Calls ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    caller_number TEXT,
    duration_sec INTEGER DEFAULT 0,
    transcript TEXT,
    summary TEXT,
    intent TEXT,
    escalated BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT,
    agent_response TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Appointments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    datetime TIMESTAMPTZ NOT NULL,
    doctor TEXT,
    service TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    notes TEXT,
    created_from_call_id UUID REFERENCES calls(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Orders ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_name TEXT,
    phone TEXT,
    items JSONB DEFAULT '[]',
    address TEXT,
    delivery_status TEXT DEFAULT 'received',
    total_amount INTEGER,
    created_from_call_id UUID REFERENCES calls(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Knowledge Base ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    content TEXT NOT NULL,
    category TEXT,
    vertical TEXT,
    pinecone_synced BOOLEAN DEFAULT FALSE,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Caller Memory ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caller_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    caller_number TEXT NOT NULL,
    name TEXT,
    last_intent TEXT,
    last_call_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(business_id, caller_number)
);

-- ─── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_calls_business_id ON calls(business_id);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(datetime);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_business_id ON knowledge_base(business_id);

-- ─── Seed Data ─────────────────────────────────────────────
INSERT INTO phone_number_pool (phone_number, provider, vertical, area_code) VALUES
    ('+918045001001', 'exotel', 'clinic', '080'),
    ('+918045001002', 'exotel', 'clinic', '080'),
    ('+918245001001', 'exotel', 'clinic', '0824'),
    ('+918045002001', 'exotel', 'call_center', '080'),
    ('+918245002001', 'exotel', 'call_center', '0824')
ON CONFLICT (phone_number) DO NOTHING;

-- ─── Agent Instructions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    instruction TEXT NOT NULL,
    created_by TEXT DEFAULT 'owner',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_instructions_business_id
    ON agent_instructions(business_id);

-- ⚠️ Note: This is for Day 1 testing only
-- For production, use the full schema with auth.users foreign keys
