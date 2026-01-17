-- Enable pg_net extension (required for net.http_post)
create extension if not exists pg_net with schema extensions;

-- Function to call Edge Function
create or replace function public.send_welcome_email()
returns trigger
language plpgsql
security definer
as $$
begin
  perform
    net.http_post(
      url := 'https://vcyjadheitlvzwhjrqcm.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'type', 'welcome',
        'email', new.email
      )
    );

  return new;
end;
$$;

-- Trigger fires AFTER new user signup
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.send_welcome_email();

-- Create user_security table
create table if not exists public.user_security (
  user_id uuid references auth.users on delete cascade primary key,
  pin_hash text,
  biometrics_enabled boolean default false,
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_security enable row level security;

-- Policies
create policy "Users can view their own security settings"
  on public.user_security for select
  using (auth.uid() = user_id);

create policy "Users can update their own security settings"
  on public.user_security for update
  using (auth.uid() = user_id);

create policy "Users can insert their own security settings"
  on public.user_security for insert
  with check (auth.uid() = user_id);

-- Trigger to create security row on signup
create or replace function public.handle_new_user_security()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_security (user_id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_security on auth.users;
create trigger on_auth_user_created_security
  after insert on auth.users
  for each row execute function public.handle_new_user_security();
