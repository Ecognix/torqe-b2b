create table if not exists public.workspace_model_configs (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('torqe_managed', 'nvidia_byok', 'openai_byok')),
  model text not null check (length(model) <= 128),
  encrypted_api_key text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (
    (provider = 'torqe_managed' and encrypted_api_key is null)
    or (provider in ('nvidia_byok', 'openai_byok') and encrypted_api_key is not null)
  )
);

create table if not exists public.workspace_deployment_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  contact_email text not null check (length(contact_email) <= 254),
  deployment_type text not null check (deployment_type in ('customer_hosted', 'torqe_private_cloud', 'private_endpoint')),
  model_preference text not null check (length(model_preference) <= 128),
  region text not null check (length(region) <= 100),
  endpoint text check (length(endpoint) <= 500),
  requirements text not null default '' check (length(requirements) <= 3000),
  status text not null default 'requested' check (status in ('requested', 'reviewing', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists workspace_deployment_requests_org_created_idx
  on public.workspace_deployment_requests (organization_id, created_at desc);

alter table public.workspace_model_configs enable row level security;
alter table public.workspace_deployment_requests enable row level security;

revoke all on public.workspace_model_configs, public.workspace_deployment_requests from public, anon, authenticated;
grant select, insert, update, delete on public.workspace_model_configs, public.workspace_deployment_requests to service_role;
