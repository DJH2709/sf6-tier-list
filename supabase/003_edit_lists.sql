-- Run after 002_profiles.sql. Players can edit their list for the current patch,
-- hide a list from their profile, and their Discord avatar shows on it.

alter table tier_lists add column is_public boolean not null default true;
-- Discord avatars only, so a profile can't point an image at an arbitrary site.
alter table profiles add column avatar_url text
  check (avatar_url is null or avatar_url ~ '^https://cdn\.discordapp\.com/');

-- Owners can change their rank, proof link and visibility, and replace their placements.
-- Verification isn't in the column grant, so players can't approve themselves.
create policy "own lists update" on tier_lists for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant update (claimed_rank, proof_url, is_public) on tier_lists to authenticated;

create policy "own placements delete" on tier_placements for delete
  using (exists (select 1 from tier_lists l where l.id = list_id and l.user_id = auth.uid()));
grant delete on tier_placements to authenticated;

-- A changed rank or proof link needs checking again. Keep the rank list in step with
-- list_bands above and needsProof in src/lib/sf6.ts.
create function tier_lists_reset_verification() returns trigger language plpgsql as $$
begin
  if new.claimed_rank is distinct from old.claimed_rank or new.proof_url is distinct from old.proof_url then
    new.verification := case
      when new.claimed_rank in ('grand_master', 'ultimate_master', 'legend') and new.proof_url is not null
        then 'pending' else 'none' end;
  end if;
  return new;
end $$;
create trigger tier_lists_reset_verification before update on tier_lists
  for each row execute function tier_lists_reset_verification();

-- Private lists stay off the profile page. They still count in band_results.
drop policy "public lists read" on tier_lists;
create policy "public lists read" on tier_lists for select
  using (is_public and exists (select 1 from profiles p where p.id = user_id));
drop policy "public placements read" on tier_placements;
create policy "public placements read" on tier_placements for select
  using (exists (select 1 from tier_lists l join profiles p on p.id = l.user_id where l.id = list_id and l.is_public));
