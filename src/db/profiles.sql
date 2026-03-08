create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  gender text,              -- 'male', 'female', 'other'
  height numeric,           -- e.g., in cm or inches
  initial_weight numeric,   -- e.g., in kg or lbs
  target_weight numeric,    -- e.g., in kg or lbs
  age integer,              -- or date_of_birth
  activity_level text,      -- 'sedentary', 'lightly_active', 'moderately_active', 'very_active'
  goal text,                -- 'lose_fat', 'build_muscle', 'maintain_weight'
  unit_system text default 'metric', -- 'metric' or 'imperial'
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) so users can only view/edit their own profile
alter table public.profiles enable row level security;

-- Create policies for the profiles table
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Optional: Create a trigger to automatically create a profile when a new user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, created_at, updated_at)
  values (
    new.id, 
    new.raw_user_meta_data->>'username', -- Optionally extract username if passed during signup
    now(), 
    now()
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();