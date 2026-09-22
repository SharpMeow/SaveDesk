-- Run in your Supabase project's SQL editor. No service-role key goes in the app.
create table if not exists public.savedesk_libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  constraint savedesk_items_array check (jsonb_typeof(items) = 'array'),
  constraint savedesk_items_count check (jsonb_array_length(items) <= 100000),
  constraint savedesk_items_size check (octet_length(items::text) <= 10485760)
);
alter table public.savedesk_libraries enable row level security;
revoke all on public.savedesk_libraries from anon, authenticated;
grant select on public.savedesk_libraries to authenticated;
drop policy if exists "Read own library" on public.savedesk_libraries;
create policy "Read own library" on public.savedesk_libraries for select to authenticated
  using ((select auth.uid()) = user_id);

-- The only write entrypoint. The caller cannot supply another user's ID.
-- A revision check prevents stale devices from overwriting a newer library.
create or replace function public.savedesk_save_library(expected_revision bigint, new_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  current_library public.savedesk_libraries%rowtype;
begin
  if caller is null then raise exception 'Sign in to sync your library.' using errcode = '42501'; end if;
  if expected_revision is null or expected_revision < 0 then raise exception 'Invalid library revision.'; end if;
  if new_items is null or jsonb_typeof(new_items) <> 'array' then raise exception 'Expected an array of saves.'; end if;
  if jsonb_array_length(new_items) > 100000 or octet_length(new_items::text) > 10485760 then raise exception 'Cloud library limit exceeded (100,000 saves / 10 MB).'; end if;
  insert into public.savedesk_libraries(user_id) values (caller) on conflict do nothing;
  select * into current_library from public.savedesk_libraries where user_id = caller for update;
  if current_library.revision <> expected_revision then
    return jsonb_build_object('saved', false, 'revision', current_library.revision, 'items', current_library.items);
  end if;
  update public.savedesk_libraries set items = new_items, revision = revision + 1, updated_at = now()
    where user_id = caller returning * into current_library;
  return jsonb_build_object('saved', true, 'revision', current_library.revision);
end;
$$;
revoke all on function public.savedesk_save_library(bigint,jsonb) from public, anon;
grant execute on function public.savedesk_save_library(bigint,jsonb) to authenticated;
