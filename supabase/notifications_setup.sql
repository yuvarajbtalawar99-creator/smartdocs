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
