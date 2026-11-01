create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (length(email) <= 254 and position('@' in email) > 1),
  role text not null check (role in ('admin', 'operator', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists workspace_invitations_pending_email_idx
  on public.workspace_invitations (organization_id, lower(email))
  where status = 'pending';

create or replace function public.console_has_role(target_organization_id uuid, allowed_roles text[])
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
      and role = any(allowed_roles)
  );
$$;

create or replace function public.create_console_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_organization_id uuid;
  clean_name text := btrim(workspace_name);
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 80 then
    raise exception 'Workspace name must be between 2 and 80 characters';
  end if;

  insert into public.organizations (name)
  values (clean_name)
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization_id, current_user_id, 'owner');

  insert into public.agent_settings (organization_id)
  values (new_organization_id);

  insert into public.audit_logs (organization_id, actor_id, action, resource_type, resource_id)
  values (new_organization_id, current_user_id, 'workspace.created', 'organization', new_organization_id::text);

  return new_organization_id;
end;
$$;

create or replace function public.accept_console_invitations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  accepted_count integer;
begin
  if current_user_id is null or current_email = '' then
    raise exception 'Authentication required';
  end if;

  with accepted as (
    update public.workspace_invitations
    set status = 'accepted',
        accepted_by = current_user_id,
        accepted_at = now()
    where status = 'pending'
      and lower(email) = current_email
    returning organization_id, role
  )
  insert into public.organization_members (organization_id, user_id, role)
  select organization_id, current_user_id, role
  from accepted
  on conflict (organization_id, user_id) do nothing;

  get diagnostics accepted_count = row_count;
  return accepted_count;
end;
$$;

alter table public.workspace_invitations enable row level security;

revoke all on function public.is_console_member(uuid) from public, anon;
revoke all on function public.console_has_role(uuid, text[]) from public, anon;
revoke all on function public.create_console_workspace(text) from public, anon;
revoke all on function public.accept_console_invitations() from public, anon;
grant execute on function public.is_console_member(uuid) to authenticated;
grant execute on function public.console_has_role(uuid, text[]) to authenticated;
grant execute on function public.create_console_workspace(text) to authenticated;
grant execute on function public.accept_console_invitations() to authenticated;

revoke all on public.organizations,
  public.organization_members,
  public.conversations,
  public.messages,
  public.approvals,
  public.agent_runs,
  public.integrations,
  public.agent_settings,
  public.knowledge_documents,
  public.notifications,
  public.audit_logs,
  public.workspace_invitations
from public, anon;

grant select on public.organizations,
  public.organization_members,
  public.conversations,
  public.messages,
  public.approvals,
  public.agent_runs,
  public.integrations,
  public.agent_settings,
  public.knowledge_documents,
  public.notifications,
  public.audit_logs,
  public.workspace_invitations
to authenticated;
grant select, insert, update, delete on public.workspace_invitations to service_role;
grant update on public.conversations, public.approvals, public.notifications to authenticated;
grant insert on public.messages to authenticated;
grant insert, update, delete on public.integrations to authenticated;
grant update on public.agent_settings to authenticated;

drop policy if exists "Members can read their organizations" on public.organizations;
drop policy if exists "Members can read organization membership" on public.organization_members;
drop policy if exists "Members can read conversations" on public.conversations;
drop policy if exists "Members can update conversations" on public.conversations;
drop policy if exists "Members can read messages" on public.messages;
drop policy if exists "Members can add messages" on public.messages;
drop policy if exists "Members can read approvals" on public.approvals;
drop policy if exists "Members can review approvals" on public.approvals;
drop policy if exists "Members can read agent runs" on public.agent_runs;
drop policy if exists "Members can read integrations" on public.integrations;
drop policy if exists "Members can manage integrations" on public.integrations;
drop policy if exists "Members can read agent settings" on public.agent_settings;
drop policy if exists "Members can update agent settings" on public.agent_settings;
drop policy if exists "Members can read knowledge documents" on public.knowledge_documents;
drop policy if exists "Members can read notifications" on public.notifications;
drop policy if exists "Members can mark their notifications read" on public.notifications;
drop policy if exists "Members can read audit logs" on public.audit_logs;

create policy "Workspace members can read their organizations"
  on public.organizations for select to authenticated
  using (public.is_console_member(id));

create policy "Users can read their own memberships"
  on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_console_member(organization_id));

create policy "Workspace admins can read invitations"
  on public.workspace_invitations for select to authenticated
  using (public.console_has_role(organization_id, array['owner', 'admin']));

create policy "Workspace members can read conversations"
  on public.conversations for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Operators can update conversations"
  on public.conversations for update to authenticated
  using (public.console_has_role(organization_id, array['owner', 'admin', 'operator']))
  with check (public.console_has_role(organization_id, array['owner', 'admin', 'operator']));

create policy "Workspace members can read messages"
  on public.messages for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Operators can add messages to their conversations"
  on public.messages for insert to authenticated
  with check (
    public.console_has_role(organization_id, array['owner', 'admin', 'operator'])
    and exists (
      select 1
      from public.conversations
      where id = conversation_id
        and organization_id = messages.organization_id
    )
  );

create policy "Workspace members can read approvals"
  on public.approvals for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Operators can review approvals"
  on public.approvals for update to authenticated
  using (public.console_has_role(organization_id, array['owner', 'admin', 'operator']))
  with check (public.console_has_role(organization_id, array['owner', 'admin', 'operator']));

create policy "Workspace members can read agent runs"
  on public.agent_runs for select to authenticated
  using (public.is_console_member(organization_id));

create policy "Workspace members can read integrations"
  on public.integrations for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Workspace admins can manage integrations"
  on public.integrations for all to authenticated
  using (public.console_has_role(organization_id, array['owner', 'admin']))
  with check (public.console_has_role(organization_id, array['owner', 'admin']));

create policy "Workspace members can read agent settings"
  on public.agent_settings for select to authenticated
  using (public.is_console_member(organization_id));
create policy "Workspace admins can update agent settings"
  on public.agent_settings for update to authenticated
  using (public.console_has_role(organization_id, array['owner', 'admin']))
  with check (public.console_has_role(organization_id, array['owner', 'admin']));

create policy "Workspace members can read knowledge documents"
  on public.knowledge_documents for select to authenticated
  using (public.is_console_member(organization_id));

create policy "Users can read their workspace notifications"
  on public.notifications for select to authenticated
  using (public.is_console_member(organization_id) and (user_id is null or user_id = (select auth.uid())));
create policy "Users can mark their own notifications read"
  on public.notifications for update to authenticated
  using (public.is_console_member(organization_id) and user_id = (select auth.uid()))
  with check (public.is_console_member(organization_id) and user_id = (select auth.uid()));

create policy "Workspace members can read audit logs"
  on public.audit_logs for select to authenticated
  using (public.is_console_member(organization_id));

create or replace function public.audit_console_approval_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.audit_logs (organization_id, actor_id, action, resource_type, resource_id, details)
    values (
      new.organization_id,
      coalesce(auth.uid(), new.reviewed_by),
      'approval.' || new.status,
      'approval',
      new.id::text,
      jsonb_build_object('previous_status', old.status)
    );
  end if;
  return new;
end;
$$;

create or replace function public.audit_console_conversation_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.agent_paused is distinct from old.agent_paused then
    insert into public.audit_logs (organization_id, actor_id, action, resource_type, resource_id, details)
    values (
      new.organization_id,
      auth.uid(),
      case when new.agent_paused then 'conversation.agent_paused' else 'conversation.agent_resumed' end,
      'conversation',
      new.id::text,
      '{}'::jsonb
    );
  end if;
  return new;
end;
$$;

create or replace function public.audit_console_settings_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.autopilot_enabled is distinct from old.autopilot_enabled
    or new.instructions is distinct from old.instructions
    or new.approval_rules is distinct from old.approval_rules then
    insert into public.audit_logs (organization_id, actor_id, action, resource_type, details)
    values (
      new.organization_id,
      auth.uid(),
      'agent_settings.updated',
      'agent_settings',
      jsonb_build_object(
        'autopilot_enabled', new.autopilot_enabled,
        'instructions_changed', new.instructions is distinct from old.instructions,
        'approval_rules_changed', new.approval_rules is distinct from old.approval_rules
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists console_audit_approval_update on public.approvals;
create trigger console_audit_approval_update
  after update on public.approvals
  for each row execute function public.audit_console_approval_update();

drop trigger if exists console_audit_conversation_update on public.conversations;
create trigger console_audit_conversation_update
  after update on public.conversations
  for each row execute function public.audit_console_conversation_update();

drop trigger if exists console_audit_settings_update on public.agent_settings;
create trigger console_audit_settings_update
  after update on public.agent_settings
  for each row execute function public.audit_console_settings_update();
