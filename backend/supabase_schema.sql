-- ============================================================
-- AI Agent Platform — Supabase Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Phone Number Pool ─────────────────────────────────────
-- Pre-populate this with your provisioned numbers from Exotel/Ozonetel
CREATE TABLE IF NOT EXISTS phone_number_pool (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL,      -- 'exotel' | 'ozonetel' | 'servetel'
    vertical TEXT,               -- preferred vertical, NULL = any
    area_code TEXT,              -- '080' (Bangalore), '0824' (Mangalore), etc.
    assigned BOOLEAN DEFAULT FALSE,
    assigned_to UUID,            -- business id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Businesses ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    vertical TEXT NOT NULL CHECK (vertical IN ('clinic', 'call_center', 'restaurant')),
    phone_number TEXT UNIQUE NOT NULL,
    onboarding_config JSONB DEFAULT '{}',
    -- onboarding_config example:
    -- { "business_hours": "9am-6pm", "doctors": ["Dr. Sharma", "Dr. Patel"],
    --   "services": ["General", "Dental"], "emergency_contact": "+91..." }
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
    summary TEXT,               -- 1-2 sentence summary from agent
    intent TEXT,                -- 'book_appointment' | 'faq' | 'escalate' | 'unknown'
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

-- ─── Orders (Restaurant — deferred to Month 2) ─────────────
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_name TEXT,
    phone TEXT,
    items JSONB DEFAULT '[]',
    address TEXT,
    delivery_status TEXT DEFAULT 'received',
    total_amount INTEGER,       -- in paise (₹1 = 100 paise)
    created_from_call_id UUID REFERENCES calls(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Knowledge Base ────────────────────────────────────────
-- Tracks what's been uploaded to Pinecone
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    content TEXT NOT NULL,
    category TEXT,              -- 'faq' | 'menu' | 'policy' | 'hours'
    vertical TEXT,
    pinecone_synced BOOLEAN DEFAULT FALSE,
    approved BOOLEAN DEFAULT FALSE,  -- Nandana reviews before going live
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Caller Memory (long-term) ─────────────────────────────
-- Stores per-caller context for returning callers
CREATE TABLE IF NOT EXISTS caller_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    caller_number TEXT NOT NULL,
    name TEXT,
    last_intent TEXT,
    last_call_at TIMESTAMPTZ,
    notes TEXT,  -- "prefers Dr. Sharma", "has insurance claim pending"
    UNIQUE(business_id, caller_number)
);

-- ─── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_calls_business_id ON calls(business_id);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(datetime);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_business_id ON knowledge_base(business_id);

-- ─── Row Level Security ────────────────────────────────────
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Business owners can only see their own data
CREATE POLICY "owners_own_businesses" ON businesses
    FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "owners_own_calls" ON calls
    FOR ALL USING (
        business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
    );

CREATE POLICY "owners_own_appointments" ON appointments
    FOR ALL USING (
        business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
    );

-- Service role (backend) bypasses RLS — use SUPABASE_SERVICE_KEY in backend
-- ─── Seed: Pre-provisioned Demo Numbers ────────────────────
-- Replace these with your actual provisioned numbers
INSERT INTO phone_number_pool (phone_number, provider, vertical, area_code) VALUES
    ('+918045001001', 'exotel', 'clinic', '080'),
    ('+918045001002', 'exotel', 'clinic', '080'),
    ('+918245001001', 'exotel', 'clinic', '0824'),
    ('+918045002001', 'exotel', 'call_center', '080'),
    ('+918245002001', 'exotel', 'call_center', '0824')
ON CONFLICT (phone_number) DO NOTHING;

-- ─── Agent Instructions ─────────────────────────────────────
-- New table for runtime instructions sent via dashboard/mobile
CREATE TABLE IF NOT EXISTS agent_instructions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  instruction text NOT NULL,
  created_by text DEFAULT 'owner',   -- 'owner' | 'agent'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_instructions_business_id_idx
  ON agent_instructions(business_id);

ALTER TABLE agent_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_instructions" ON agent_instructions
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );
