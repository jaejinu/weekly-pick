begin;

-- Expose review content, never the Auth user ID or internal local ID.
create function public.list_public_reviews(p_issue text default 'vol-01')
returns table(id uuid, exhibition_id text, rating integer, body text, day text,
              waiting boolean, created_at timestamptz, is_own boolean)
language sql stable security definer set search_path = '' as $$
  select r.id,r.exhibition_id,r.rating,r.body,r.day,r.waiting,r.created_at,
         coalesce(r.user_id = (select auth.uid()),false)
  from public.member_reviews r
  where r.issue_id = p_issue and p_issue = 'vol-01'
  order by r.created_at desc,r.id
  limit 100
$$;
revoke all on function public.list_public_reviews(text) from public;
grant execute on function public.list_public_reviews(text) to anon, authenticated;

-- No caller-supplied ID. The whole delete, including cascaded libraries/reviews,
-- succeeds or rolls back together. Serialize with save_library for this owner.
create function public.delete_my_account(p_confirmation text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if p_confirmation is distinct from 'DELETE MY ACCOUNT' then
    raise exception 'CONFIRMATION_REQUIRED' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text || ':vol-01',0));
  delete from auth.users where id = owner_id;
  return true;
end $$;
revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;

commit;
