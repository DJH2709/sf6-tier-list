-- Community tier lists, one per account per game, category and patch.
-- Category is what's being ranked: characters now, weapons or abilities later.
create table tier_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  game text not null,
  category text not null default 'characters',
  patch text not null,
  claimed_rank text not null,
  -- Top ranks need proof: a profile link with the site's code in it, checked by hand.
  verification text not null default 'none'
    check (verification in ('none', 'pending', 'approved', 'rejected')),
  proof_url text,
  created_at timestamptz not null default now(),
  unique (user_id, game, category, patch)
);

create table tier_placements (
  list_id uuid not null references tier_lists on delete cascade,
  item_id text not null,
  score smallint not null check (score between 1 and 5),
  primary key (list_id, item_id)
);

-- Keep in step with effectiveBand() in src/lib/sf6.ts.
create view list_bands as
select id, game, category, patch,
  case
    when claimed_rank in ('grand_master', 'ultimate_master', 'legend')
      then case when verification = 'approved' then 'elite' else 'advanced' end
    when claimed_rank in ('diamond', 'master', 'high_master') then 'advanced'
    when claimed_rank in ('gold', 'platinum') then 'intermediate'
    else 'beginner'
  end as band
from tier_lists;

create view band_results as
select b.game, b.category, b.patch, b.band, p.item_id,
  avg(p.score)::float as avg_score,
  count(*)::int as votes,
  (select count(*) from list_bands b2
     where b2.game = b.game and b2.category = b.category
       and b2.patch = b.patch and b2.band = b.band)::int as lists
from list_bands b
join tier_placements p on p.list_id = b.id
group by b.game, b.category, b.patch, b.band, p.item_id;

alter table tier_lists enable row level security;
alter table tier_placements enable row level security;

-- Users can see and submit only their own lists. Verification is set by the site owner,
-- so users cannot mark themselves approved.
create policy "own lists read" on tier_lists for select using (user_id = auth.uid());
create policy "own lists insert" on tier_lists for insert
  with check (user_id = auth.uid() and verification in ('none', 'pending'));
create policy "own placements read" on tier_placements for select
  using (exists (select 1 from tier_lists l where l.id = list_id and l.user_id = auth.uid()));
create policy "own placements insert" on tier_placements for insert
  with check (exists (select 1 from tier_lists l where l.id = list_id and l.user_id = auth.uid()));

-- Aggregates are public. Views run as the owner, so they bypass the row policies above.
revoke all on list_bands from anon, authenticated;
grant select on band_results to anon, authenticated;
