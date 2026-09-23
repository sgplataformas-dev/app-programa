create or replace function public.find_user_id_by_email(_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(trim(_email)) limit 1
$$;

revoke all on function public.find_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_user_id_by_email(text) to service_role;

select cron.unschedule('payt-reprocess-pending') where exists (
  select 1 from cron.job where jobname = 'payt-reprocess-pending'
);

select cron.schedule(
  'payt-reprocess-pending',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url := 'https://project--bdaf87db-df2b-4355-ae46-1cf47316dbea.lovable.app/api/public/webhooks/payt/reprocess',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'email_queue_service_role_key'
      )
    ),
    body := '{"limit":50}'::jsonb
  );
  $cron$
);