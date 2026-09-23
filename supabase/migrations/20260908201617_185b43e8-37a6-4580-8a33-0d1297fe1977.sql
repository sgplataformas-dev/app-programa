create table public.whatsapp_command_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  phone text not null,
  name text,
  command text not null,
  args jsonb default '[]'::jsonb,
  response text,
  status text not null default 'received',
  error text
);

grant select, insert on public.whatsapp_command_log to authenticated;
grant all on public.whatsapp_command_log to service_role;

alter table public.whatsapp_command_log enable row level security;

create policy "service_role full access" on public.whatsapp_command_log
for all to service_role
using (true)
with check (true);

create policy "authenticated insert own" on public.whatsapp_command_log
for insert to authenticated
with check (false);

create table public.whatsapp_command_whitelist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  phone text not null unique,
  name text,
  is_admin boolean default true
);

grant select on public.whatsapp_command_whitelist to authenticated;
grant all on public.whatsapp_command_whitelist to service_role;

alter table public.whatsapp_command_whitelist enable row level security;

create policy "service_role full access" on public.whatsapp_command_whitelist
for all to service_role
using (true)
with check (true);
