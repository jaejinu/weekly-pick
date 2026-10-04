begin;
-- Apply in a new Supabase project. All identities come from auth.uid(), never client input.
create table public.account_libraries (
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_id text not null check (issue_id = 'vol-01'),
  revision bigint not null default 0,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, issue_id)
);
create table public.member_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_id text not null check (issue_id = 'vol-01'),
  local_id text not null,
  exhibition_id text not null check (exhibition_id ~ '^ex-(0[1-9]|10)$'),
  rating integer not null check (rating between 1 and 5),
  body text not null check (length(trim(body)) between 1 and 80),
  day text not null check (day in ('토요일','일요일','평일')),
  waiting boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, issue_id, exhibition_id),
  unique (user_id, issue_id, local_id)
);
alter table public.account_libraries enable row level security;
alter table public.member_reviews enable row level security;
revoke all on public.account_libraries, public.member_reviews from anon, authenticated;
grant select on public.account_libraries to authenticated;
grant select on public.member_reviews to anon, authenticated;
create policy library_owner_read on public.account_libraries for select to authenticated using (user_id = (select auth.uid()));
create policy published_reviews_read on public.member_reviews for select to anon, authenticated using (true);

create function public.valid_library(p jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare r jsonb; v jsonb; n integer; ids text[]; planned text[]; review_ids text[] := '{}'; ex_ids text[] := '{}'; max_seq bigint := 0;
begin
  if jsonb_typeof(p) <> 'object' or pg_column_size(p) > 32768 then return false; end if;
  if not (p ?& array['saved','plan','reviews','visits','dayStartTime','nextReviewSeq']) then return false; end if;
  if (select count(*) from jsonb_object_keys(p)) <> 6 then return false; end if;
  if jsonb_typeof(p->'saved') <> 'array' or jsonb_typeof(p->'reviews') <> 'array' or
     jsonb_typeof(p->'plan') <> 'object' or jsonb_typeof(p->'visits') <> 'object' or jsonb_typeof(p->'dayStartTime') <> 'object' then return false; end if;
  if jsonb_array_length(p->'saved') > 10 or jsonb_array_length(p->'reviews') > 10 then return false; end if;
  select coalesce(array_agg(value), '{}') into ids from jsonb_array_elements_text(p->'saved');
  if exists(select 1 from unnest(ids) id where id !~ '^ex-(0[1-9]|10)$') or cardinality(ids) <> (select count(distinct id) from unnest(ids) id) then return false; end if;
  if not ((p->'plan') ?& array['sat','sun']) or jsonb_typeof(p->'plan'->'sat') <> 'array' or jsonb_typeof(p->'plan'->'sun') <> 'array' then return false; end if;
  select coalesce(array_agg(value), '{}') into planned from jsonb_array_elements_text((p->'plan'->'sat') || (p->'plan'->'sun'));
  if not planned <@ ids or cardinality(planned) <> (select count(distinct id) from unnest(planned) id) then return false; end if;
  if (p->'dayStartTime'->>'sat') is null or (p->'dayStartTime'->>'sun') is null or
     (p->'dayStartTime'->>'sat') !~ '^(1[0-4]:(00|30)|15:00)$' or (p->'dayStartTime'->>'sun') !~ '^(1[0-4]:(00|30)|15:00)$' then return false; end if;
  if jsonb_typeof(p->'nextReviewSeq') <> 'number' or (p->>'nextReviewSeq') !~ '^[1-9][0-9]{0,8}$' then return false; end if;
  for r in select * from jsonb_array_elements(p->'reviews') loop
    if jsonb_typeof(r) <> 'object' or not (r ?& array['id','exhibitionId','rating','text','day','waiting','createdAt']) then return false; end if;
    if (r->>'id') !~ '^rv-my-[1-9][0-9]{0,8}$' or (r->>'exhibitionId') !~ '^ex-(0[1-9]|10)$' or
       jsonb_typeof(r->'rating') <> 'number' or (r->>'rating') !~ '^[1-5]$' or
       jsonb_typeof(r->'text') <> 'string' or length(trim(r->>'text')) not between 1 and 80 or
       jsonb_typeof(r->'day') <> 'string' or (r->>'day') not in ('토요일','일요일','평일') or jsonb_typeof(r->'waiting') <> 'boolean' or
       jsonb_typeof(r->'createdAt') <> 'string' or (r->>'createdAt') !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
    perform (r->>'createdAt')::date;
    if not ((p->'visits') ? (r->>'exhibitionId')) then return false; end if;
    review_ids := array_append(review_ids,r->>'id'); ex_ids := array_append(ex_ids,r->>'exhibitionId');
    max_seq := greatest(max_seq, substring(r->>'id' from 7)::bigint);
  end loop;
  if cardinality(review_ids) <> (select count(distinct id) from unnest(review_ids) id) or
     cardinality(ex_ids) <> (select count(distinct id) from unnest(ex_ids) id) or (p->>'nextReviewSeq')::bigint <= max_seq then return false; end if;
  if exists(select 1 from jsonb_each_text(p->'visits') where key !~ '^ex-(0[1-9]|10)$' or value !~ '^\d{4}-\d{2}-\d{2}$') then return false; end if;
  for v in select value from jsonb_each(p->'visits') loop
    if jsonb_typeof(v) <> 'string' then return false; end if;
    perform (v #>> '{}')::date;
  end loop;
  return true;
exception when others then return false;
end $$;
revoke all on function public.valid_library(jsonb) from public, anon, authenticated;
alter table public.account_libraries add constraint valid_library_payload check (public.valid_library(payload));

create function public.save_library(p_issue text, p_revision bigint, p_payload jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); current_revision bigint; next_revision bigint;
begin
  if owner_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if p_issue is distinct from 'vol-01' or p_revision is null or p_revision < 0 or not public.valid_library(p_payload) then
    raise exception 'INVALID_LIBRARY' using errcode = '22023';
  end if;
  -- Serializes first inserts and later writes for this user's issue.
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text || ':' || p_issue, 0));
  select revision into current_revision from public.account_libraries where user_id = owner_id and issue_id = p_issue for update;
  current_revision := coalesce(current_revision, 0);
  if current_revision <> p_revision then raise exception 'REVISION_CONFLICT' using errcode = '40001'; end if;
  next_revision := current_revision + 1;
  insert into public.account_libraries(user_id,issue_id,revision,payload)
    values(owner_id,p_issue,next_revision,p_payload)
    on conflict(user_id,issue_id) do update set revision=excluded.revision,payload=excluded.payload,updated_at=now();
  delete from public.member_reviews where user_id=owner_id and issue_id=p_issue and
    exhibition_id not in (select r->>'exhibitionId' from jsonb_array_elements(p_payload->'reviews') r);
  insert into public.member_reviews(user_id,issue_id,local_id,exhibition_id,rating,body,day,waiting)
    select owner_id,p_issue,r->>'id',r->>'exhibitionId',(r->>'rating')::integer,trim(r->>'text'),r->>'day',(r->>'waiting')::boolean
    from jsonb_array_elements(p_payload->'reviews') r
    on conflict(user_id,issue_id,exhibition_id) do update set local_id=excluded.local_id,rating=excluded.rating,body=excluded.body,day=excluded.day,waiting=excluded.waiting,updated_at=now();
  return next_revision;
end $$;
revoke all on function public.save_library(text,bigint,jsonb) from public, anon;
grant execute on function public.save_library(text,bigint,jsonb) to authenticated;
create index member_reviews_recent on public.member_reviews(issue_id, created_at desc);

commit;
