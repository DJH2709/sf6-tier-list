-- A stand-in for the parts of Supabase's auth schema that the site's SQL files depend on.
-- For local tests and the backup restore check only; never run this on a Supabase project.
-- auth.uid() reads the same setting PostgREST sets from the JWT, so row policies can be
-- exercised with:  set role authenticated; select set_config('request.jwt.claim.sub', '<uuid>', true);
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
