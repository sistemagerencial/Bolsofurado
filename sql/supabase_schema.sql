-- Supabase schema for Bolsofurado
-- Run this in Supabase SQL editor: https://app.supabase.com/project/<PROJECT_REF>/sql

-- Enable UUID generation functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  date date NOT NULL,
  category text,
  description text,
  amount numeric(14,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Revenues
CREATE TABLE IF NOT EXISTS public.revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  date date NOT NULL,
  category text,
  description text,
  amount numeric(14,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  type text,
  status text,
  avg_monthly numeric(14,2),
  last_month numeric(14,2),
  trend text
);

-- Cost centers
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  type text,
  total_spent numeric(14,2),
  budget numeric(14,2),
  percentage numeric(6,2)
);

-- Planning (budgets)
CREATE TABLE IF NOT EXISTS public.planning (
  id serial PRIMARY KEY,
  category_id integer REFERENCES public.categories(id) ON DELETE SET NULL,
  category text,
  budget numeric(14,2),
  spent numeric(14,2),
  difference numeric(14,2),
  percentage numeric(6,2),
  status text
);

-- Portfolio assets
CREATE TABLE IF NOT EXISTS public.portfolio_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text,
  name text,
  code text,
  quantity numeric(24,8),
  invested numeric(14,2),
  current_value numeric(14,2),
  profitability numeric(8,4),
  profit numeric(14,2),
  status text,
  created_at timestamptz DEFAULT now()
);

-- Trade history
CREATE TABLE IF NOT EXISTS public.trade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  date date,
  asset text,
  type text,
  market text,
  quantity numeric(24,8),
  entry_price numeric(14,4),
  exit_price numeric(14,4),
  costs numeric(14,2),
  result numeric(14,2),
  profitability numeric(8,4),
  created_at timestamptz DEFAULT now()
);

-- Monthly metrics (chart data)
CREATE TABLE IF NOT EXISTS public.monthly_metrics (
  id serial PRIMARY KEY,
  month text,
  planned numeric(14,2),
  actual numeric(14,2)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON public.revenues(date);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON public.portfolio_assets(user_id);

-- Optional: grant select to anon (only if you want public read access)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- NOTE: Supabase auth creates an `auth.users` table; you can reference it for user_id
-- Example foreign key: ALTER TABLE public.expenses ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- End of schema
