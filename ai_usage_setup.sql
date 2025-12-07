create table if not exists public.ai_usage (
  id uuid default gen_random_uuid() primary key,
  user_address text not null unique,
  total_calls integer default 0,
  last_used timestamp with time zone,
  favorite_tools text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.ai_usage enable row level security;

-- Policies to restrict access per wallet
create policy if not exists "ai_usage_select"
on public.ai_usage
for select
using (auth.uid()::text = user_address);

create policy if not exists "ai_usage_insert"
on public.ai_usage
for insert
with check (auth.uid()::text = user_address);

create policy if not exists "ai_usage_update"
on public.ai_usage
for update
using (auth.uid()::text = user_address)
with check (auth.uid()::text = user_address);

-- Create or replace the increment function
create or replace function increment_ai_usage(user_addr text)
returns void as $$
begin
  insert into public.ai_usage (user_address, total_calls, last_used)
  values (user_addr, 1, now())
  on conflict (user_address)
  do update set
    total_calls = ai_usage.total_calls + 1,
    last_used = now();
end;
$$ language plpgsql;
