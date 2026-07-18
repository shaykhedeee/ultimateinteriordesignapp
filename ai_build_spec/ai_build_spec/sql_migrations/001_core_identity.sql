CREATE TABLE IF NOT EXISTS studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency_code TEXT NOT NULL DEFAULT 'INR',
  locale TEXT NOT NULL DEFAULT 'en-IN',
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'admin','owner','designer','sales_designer','estimator','production_manager','site_exec','client_viewer'
  )),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'local',
  auth_subject TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  preferences_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (studio_id, email)
);
