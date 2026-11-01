create extension if not exists vector with schema extensions;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'operator', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function public.is_console_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
  );
$$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_contact_id text,
  contact_name text not null,
  company text,
  channel text not null check (channel in ('whatsapp', 'email', 'linkedin', 'web', 'other')),
  status text not null default 'active',
  assigned_to uuid references auth.users(id) on delete set null,
  agent_paused boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('prospect', 'agent', 'human', 'system')),
  body text not null,
  channel_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  requested_by text not null default 'agent',
  action_type text not null,
  title text not null,
  draft jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'edited')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  status text not null check (status in ('running', 'completed', 'paused', 'failed')),
  intent text,
  steps jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  config jsonb not null default '{}'::jsonb,
  connected_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists public.agent_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  autopilot_enabled boolean not null default false,
  instructions text not null default '',
  approval_rules jsonb not null default '{}'::jsonb,
  model_provider text,
  model_name text,
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_name text not null,
  source_type text not null,
  chunk_index integer not null default 0 check (chunk_index >= 0),
  content text not null,
  embedding extensions.vector,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'ready' check (status in ('processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source_name, chunk_index)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null default '',
  resource_type text,
  resource_id text,
  due_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversations_org_updated_idx on public.conversations (organization_id, updated_at desc);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index if not exists approvals_org_status_created_idx on public.approvals (organization_id, status, created_at desc);
create index if not exists agent_runs_org_started_idx on public.agent_runs (organization_id, started_at desc);
create index if not exists knowledge_documents_org_source_idx on public.knowledge_documents (organization_id, source_name, chunk_index);
create index if not exists notifications_org_created_idx on public.notifications (organization_id, created_at desc);
create index if not exists audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.approvals enable row level security;
alter table public.agent_runs enable row level security;
alter table public.integrations enable row level security;
alter table public.agent_settings enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "Members can read their organizations"
  on public.organizations for select to authenticated
  using (public.is_console_member(id));

create policy "Members can read organization membership"
  on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_console_member(organization_id));

create policy "Members can read conversations"
  on public.conversations for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Members can update conversations"
  on public.conversations for update to authenticated
  using (public.is_console_member(organization_id))
  with check (public.is_console_member(organization_id));

create policy "Members can read messages"
  on public.messages for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Members can add messages"
  on public.messages for insert to authenticated
  with check (public.is_console_member(organization_id));

create policy "Members can read approvals"
  on public.approvals for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Members can review approvals"
  on public.approvals for update to authenticated
  using (public.is_console_member(organization_id))
  with check (public.is_console_member(organization_id));

create policy "Members can read agent runs"
  on public.agent_runs for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Members can read integrations"
  on public.integrations for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Members can manage integrations"
  on public.integrations for all to authenticated
  using (public.is_console_member(organization_id))
  with check (public.is_console_member(organization_id));

create policy "Members can read agent settings"
  on public.agent_settings for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Members can update agent settings"
  on public.agent_settings for update to authenticated
  using (public.is_console_member(organization_id))
  with check (public.is_console_member(organization_id));

create policy "Members can read knowledge documents"
  on public.knowledge_documents for select to authenticated
  using (public.is_console_member(organization_id));

create policy "Members can read notifications"
  on public.notifications for select to authenticated
  using (public.is_console_member(organization_id) and (user_id is null or user_id = (select auth.uid())));
create policy "Members can mark their notifications read"
  on public.notifications for update to authenticated
  using (public.is_console_member(organization_id) and (user_id is null or user_id = (select auth.uid())))
  with check (public.is_console_member(organization_id) and (user_id is null or user_id = (select auth.uid())));

create policy "Members can read audit logs"
  on public.audit_logs for select to authenticated
  using (public.is_console_member(organization_id));
