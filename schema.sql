-- ==========================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR SIMPLE MMS (MAINTENANCE MANAGEMENT SYSTEM)
-- Copy and paste this script into your Supabase project's SQL Editor and run it.
-- ==========================================================================

-- 1. ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.assets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Operasional',
  criticality VARCHAR(50) DEFAULT 'Sedang',
  serial_number VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  purchase_date DATE,
  purchase_cost NUMERIC(15, 2) DEFAULT 0,
  last_maintenance DATE,
  next_pm_date DATE,
  specifications TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. WORK ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.work_orders (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  asset_id VARCHAR(50) REFERENCES public.assets(id) ON DELETE SET NULL,
  asset_name VARCHAR(255),
  type VARCHAR(50) DEFAULT 'Corrective',
  priority VARCHAR(50) DEFAULT 'Sedang',
  status VARCHAR(50) DEFAULT 'Disetujui',
  assigned_tech VARCHAR(100),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  target_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  problem_description TEXT,
  resolution_notes TEXT,
  estimated_hours NUMERIC(5, 2) DEFAULT 0,
  actual_hours NUMERIC(5, 2) DEFAULT 0,
  parts_used JSONB DEFAULT '[]'::jsonb,
  total_cost NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. PM SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.pm_schedules (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  asset_id VARCHAR(50) REFERENCES public.assets(id) ON DELETE SET NULL,
  asset_name VARCHAR(255),
  frequency VARCHAR(50) DEFAULT 'Bulanan',
  interval_days INT DEFAULT 30,
  last_completed DATE,
  next_due_date DATE,
  status VARCHAR(50) DEFAULT 'Normal',
  assigned_tech VARCHAR(100),
  checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inspections (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  asset_id VARCHAR(50) REFERENCES public.assets(id) ON DELETE SET NULL,
  asset_name VARCHAR(255),
  inspector VARCHAR(100),
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  overall_result VARCHAR(50) DEFAULT 'Lulus',
  checklist_items JSONB DEFAULT '[]'::jsonb,
  meter_reading VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. INVENTORY & SPARE PARTS TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 5,
  unit VARCHAR(50) DEFAULT 'Pcs',
  unit_price NUMERIC(15, 2) DEFAULT 0,
  location VARCHAR(100),
  supplier VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. TECHNICIANS TABLE
CREATE TABLE IF NOT EXISTS public.technicians (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC READ/WRITE POLICIES
-- ==========================================================================

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- Create Policies for Anonymous Public Access (Development / Web App Client)
DROP POLICY IF EXISTS "Public Read Write Assets" ON public.assets;
CREATE POLICY "Public Read Write Assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Write Work Orders" ON public.work_orders;
CREATE POLICY "Public Read Write Work Orders" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Write PM Schedules" ON public.pm_schedules;
CREATE POLICY "Public Read Write PM Schedules" ON public.pm_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Write Inspections" ON public.inspections;
CREATE POLICY "Public Read Write Inspections" ON public.inspections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Write Inventory" ON public.inventory;
CREATE POLICY "Public Read Write Inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Write Technicians" ON public.technicians;
CREATE POLICY "Public Read Write Technicians" ON public.technicians FOR ALL USING (true) WITH CHECK (true);
