-- Migration to add real-time chat support
create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_project_messages_project_created 
  on public.project_messages(project_id, created_at asc) 
  where deleted_at is null;

-- Enable Realtime for this table
alter publication supabase_realtime add table project_messages;
