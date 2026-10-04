-- Apply after clients use list_public_reviews. Old open tabs must refresh.
revoke select on public.member_reviews from anon, authenticated;
