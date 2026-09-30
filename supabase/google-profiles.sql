-- Copy Google name and avatar into Hang Tickets profiles on first sign-in.
-- Safe to re-run after supabase/schema.sql or supabase/profiles-display-name.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nick text := left(nullif(trim(coalesce(
    meta ->> 'display_name',
    meta ->> 'full_name',
    meta ->> 'name',
    ''
  )), ''), 48);
  picture text := nullif(trim(coalesce(
    meta ->> 'avatar_url',
    meta ->> 'picture',
    ''
  )), '');
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(meta ->> 'username', ''),
      'user_' || left(new.id::text, 8)
    ),
    nick,
    picture
  );
  return new;
end;
$$;
