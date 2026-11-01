create table if not exists public.conversation_drafts (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 10000),
  updated_at timestamptz not null default now(),
  primary key (organization_id, conversation_id, user_id)
);

alter table public.conversation_drafts enable row level security;
grant select, insert, update, delete on public.conversation_drafts to authenticated;

drop policy if exists "Members can read their conversation drafts" on public.conversation_drafts;
create policy "Members can read their conversation drafts"
  on public.conversation_drafts for select to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_console_member(organization_id)
    and exists (
      select 1
      from public.conversations
      where id = conversation_id
        and organization_id = conversation_drafts.organization_id
    )
  );

drop policy if exists "Members can create their conversation drafts" on public.conversation_drafts;
create policy "Members can create their conversation drafts"
  on public.conversation_drafts for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_console_member(organization_id)
    and exists (
      select 1
      from public.conversations
      where id = conversation_id
        and organization_id = conversation_drafts.organization_id
    )
  );

drop policy if exists "Members can update their conversation drafts" on public.conversation_drafts;
create policy "Members can update their conversation drafts"
  on public.conversation_drafts for update to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_console_member(organization_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.is_console_member(organization_id)
    and exists (
      select 1
      from public.conversations
      where id = conversation_id
        and organization_id = conversation_drafts.organization_id
    )
  );

drop policy if exists "Members can delete their conversation drafts" on public.conversation_drafts;
create policy "Members can delete their conversation drafts"
  on public.conversation_drafts for delete to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_console_member(organization_id)
  );
