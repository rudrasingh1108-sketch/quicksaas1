-- Gigzs production schema
create extension if not exists "pgcrypto";

do $$ begin
    create type public.user_role as enum ('client', 'freelancer', 'admin', 'system');
exception when duplicate_object then null;
end $$;
do $$ begin
    create type public.project_status as enum ('draft', 'intake', 'active', 'at_risk', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;
do $$ begin
    create type public.module_status as enum ('queued', 'assigned', 'in_progress', 'handoff', 'review', 'completed', 'blocked', 'reassigned');
exception when duplicate_object then null;
end $$;
do $$ begin
    create type public.session_status as enum ('pending', 'ready', 'deployed', 'failed', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.assignment_role as enum ('primary', 'backup', 'reviewer');
exception when duplicate_object then null;
end $$;
do $$ begin
    create type public.shift_status as enum ('scheduled', 'active', 'checked_out', 'missed', 'reassigned');
exception when duplicate_object then null;
end $$;
do $$ begin
    create type public.snapshot_type as enum ('check_in', 'checkpoint', 'check_out');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  role public.user_role not null,
  full_name text not null,
  email text unique not null,
  specialty_tags text[] not null default '{}',
  skill_vector jsonb not null default '{}'::jsonb,
  reliability_score numeric(5,2) not null default 1.00,
  availability_score numeric(5,2) not null default 1.00,
  wallet_balance numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete restrict,
  title text not null,
  raw_requirement text,
  structured_requirements jsonb not null default '{}'::jsonb,
  gml_spec jsonb not null default '{}'::jsonb,
  sla_policy jsonb not null default '{}'::jsonb,
  complexity_score integer not null default 0 check (complexity_score between 0 and 100),
  pricing_breakdown jsonb not null default '{}'::jsonb,
  urgency text,
  status public.project_status not null default 'intake',
  deadline_at timestamptz,
  total_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.project_modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_key text not null,
  module_name text not null,
  module_type text,
  module_status public.module_status not null default 'queued',
  assigned_freelancer_id uuid references public.users(id) on delete set null,
  module_vector jsonb not null default '{}'::jsonb,
  required_skills_vector jsonb not null default '{}'::jsonb,
  definition_of_done jsonb not null default '{}'::jsonb,
  structured_progress jsonb not null default '{}'::jsonb,
  module_weight numeric(8,4) not null default 0.25,
  expected_progress_rate numeric(8,4) not null default 1,
  started_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  budget_inr numeric(14,2) not null default 0,
  unique(project_id, module_key)
);

create table if not exists public.freelancer_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  skills_vector jsonb not null default '{}'::jsonb,
  specialties text[] not null default '{}',
  constraints jsonb not null default '{}'::jsonb,
  timezone text not null default 'Asia/Kolkata',
  availability jsonb not null default '{}'::jsonb,
  reliability_score numeric(5,2) not null default 1.00,
  velocity_score numeric(5,2) not null default 1.00,
  quality_score numeric(5,2) not null default 1.00,
  kyc_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.project_intake (
  project_id uuid primary key references public.projects(id) on delete cascade,
  intake jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.project_module_assignments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid not null references public.users(id) on delete cascade,
  assignment_role public.assignment_role not null,
  shift_start timestamptz not null,
  shift_end timestamptz not null,
  status public.shift_status not null default 'scheduled',
  assigned_at timestamptz not null default now(),
  released_at timestamptz,
  assignment_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_assignments_module_shift on public.project_module_assignments(module_id, shift_start desc) where deleted_at is null;
create index if not exists idx_assignments_freelancer_active on public.project_module_assignments(freelancer_id, status) where deleted_at is null;

create table if not exists public.work_snapshots (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  snapshot_type public.snapshot_type not null,
  public_summary text,
  internal_summary text,
  artifacts jsonb not null default '{}'::jsonb,
  airobuilder_session_id text,
  build_url text,
  deployment_url text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_work_snapshots_module_created on public.work_snapshots(module_id, created_at desc) where deleted_at is null;

create table if not exists public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  public_summary text not null,
  percent_delta integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_progress_logs_project_created on public.progress_logs(project_id, created_at desc) where deleted_at is null;

create table if not exists public.reassignment_events (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  from_freelancer_id uuid references public.users(id) on delete set null,
  to_freelancer_id uuid references public.users(id) on delete set null,
  trigger text not null,
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.payout_ledger (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid not null references public.users(id) on delete cascade,
  base_amount numeric(14,2) not null default 0,
  penalty_amount numeric(14,2) not null default 0,
  final_amount numeric(14,2) not null default 0,
  reason_code text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.module_snapshots (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid references public.users(id) on delete set null,
  version_no integer not null,
  work_summary text not null,
  structured_progress_json jsonb not null default '{}'::jsonb,
  file_references jsonb not null default '[]'::jsonb,
  ai_summary text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(module_id, version_no)
);

create table if not exists public.freelancer_task_logs (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid not null references public.users(id) on delete cascade,
  time_spent_minutes integer not null check (time_spent_minutes >= 0),
  completion_percentage numeric(6,3) not null check (completion_percentage >= 0 and completion_percentage <= 1),
  ai_quality_score numeric(6,3) not null check (ai_quality_score >= 0 and ai_quality_score <= 1.5),
  penalties numeric(14,2) not null default 0,
  log_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.revenue_distribution (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid not null references public.users(id) on delete cascade,
  task_log_id uuid not null references public.freelancer_task_logs(id) on delete cascade,
  gross_amount numeric(14,2) not null,
  payout_amount numeric(14,2) not null,
  payout_status text not null default 'pending',
  payout_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  currency text not null default 'INR',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.risk_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid references public.users(id) on delete set null,
  risk_score numeric(6,3) not null,
  trigger_type text not null,
  details jsonb not null default '{}'::jsonb,
  action_taken text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.airobuilder_sessions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid references public.users(id) on delete set null,
  external_session_id text not null,
  build_url text,
  deployment_url text,
  session_status public.session_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_projects_status on public.projects(status) where deleted_at is null;
create index if not exists idx_users_specialty_tags on public.users using gin (specialty_tags) where deleted_at is null;
create index if not exists idx_users_reliability_score on public.users(reliability_score) where deleted_at is null;
create index if not exists idx_modules_status on public.project_modules(module_status) where deleted_at is null;
create index if not exists idx_modules_project on public.project_modules(project_id) where deleted_at is null;
create index if not exists idx_snapshots_module_created_at on public.module_snapshots(module_id, created_at desc) where deleted_at is null;
create index if not exists idx_task_logs_module_freelancer on public.freelancer_task_logs(module_id, freelancer_id) where deleted_at is null;

-- ══════════════════════════════════════════════════════════
-- MCDONALD'S DAILY-SHIFT MODEL
-- ══════════════════════════════════════════════════════════

-- One row per "day on shift" for a freelancer working a module.
-- At EOD the shift is checked_out and the module is either handed
-- to the next freelancer or paused until the next business day.
create table if not exists public.daily_shifts (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  -- The freelancer id is INTERNAL only — never exposed to clients.
  freelancer_id uuid not null references public.users(id) on delete cascade,
  assignment_id uuid references public.project_module_assignments(id) on delete set null,
  shift_date date not null,           -- calendar day (IST)
  daily_wage_inr numeric(10,2) not null default 0,
  status public.shift_status not null default 'scheduled',
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  eod_summary text,                   -- freelancer's end-of-day note (internal)
  handoff_notes text,                 -- handed to the next freelancer (internal)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(module_id, freelancer_id, shift_date)
);

create index if not exists idx_daily_shifts_module_date
  on public.daily_shifts(module_id, shift_date desc)
  where deleted_at is null;

create index if not exists idx_daily_shifts_freelancer_status
  on public.daily_shifts(freelancer_id, status)
  where deleted_at is null;

-- ══════════════════════════════════════════════════════════
-- CLIENT UPDATE FEED
-- A sanitised, client-visible stream of project progress.
-- Freelancer identity is NEVER stored or exposed here.
-- Think of it like a delivery tracker — the client sees
-- "Your order is being prepared" not who the cook is.
-- ══════════════════════════════════════════════════════════
do $$ begin
  create type public.update_type as enum (
    'intake_complete',
    'module_started',
    'progress_checkpoint',
    'module_completed',
    'project_completed',
    'blocked',
    'milestone_reached'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.client_update_feed (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_id uuid references public.project_modules(id) on delete cascade,
  -- NO freelancer_id column — identity is fully stripped.
  update_type public.update_type not null,
  headline text not null,             -- Short, client-friendly message e.g. "UI module is 60% complete"
  detail_md text,                     -- Optional markdown detail visible in client portal
  progress_pct integer check (progress_pct between 0 and 100),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_client_feed_project_created
  on public.client_update_feed(project_id, created_at desc)
  where deleted_at is null;

-- DISABLE ALL RLS TO UNBLOCK
alter table public.users disable row level security;
alter table public.projects disable row level security;
alter table public.project_modules disable row level security;
alter table public.module_snapshots disable row level security;
alter table public.freelancer_task_logs disable row level security;
alter table public.revenue_distribution disable row level security;
alter table public.wallets disable row level security;
alter table public.risk_logs disable row level security;
alter table public.airobuilder_sessions disable row level security;
alter table public.freelancer_profiles disable row level security;
alter table public.project_intake disable row level security;
alter table public.project_module_assignments disable row level security;
alter table public.work_snapshots disable row level security;
alter table public.progress_logs disable row level security;
alter table public.reassignment_events disable row level security;
alter table public.payout_ledger disable row level security;
alter table public.daily_shifts disable row level security;
alter table public.client_update_feed disable row level security;

-- GRANT OPEN PERMISSIONS
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

