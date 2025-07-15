-- Supabase Migration: Initial Schema
-- Plataforma de Gestão G12
-- Version: 1.0
-- Date: 15 de Julho de 2025
-- This script sets up the initial database schema, including tables, roles, RLS policies, and helper functions.

-- 1. EXTENSIONS
-- Recommended extensions for a robust postgres database.
create extension if not exists "moddatetime" with schema "extensions";

-- 2. CUSTOM TYPES
-- Define a custom type for user roles to ensure data consistency.
create type public.user_role as enum ('pastor', 'supervisor', 'leader', 'timoteo', 'member');

-- 3. TABLES

-- Table for Churches (Tenants)
create table public.churches (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.churches is 'Represents a single church organization (tenant).';

-- Table for User Profiles
-- This table links to auth.users and stores app-specific user data.
create table public.profiles (
  id uuid not null primary key references auth.users(id) on delete cascade,
  church_id uuid references public.churches(id) on delete set null,
  full_name text,
  role public.user_role not null default 'member'::public.user_role,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'User profiles, linked to authentication and churches.';

-- Table for G12 Cells
create table public.cells (
    id uuid not null primary key default gen_random_uuid(),
    church_id uuid not null references public.churches(id) on delete cascade,
    leader_id uuid not null references public.profiles(id) on delete restrict,
    supervisor_id uuid references public.profiles(id) on delete set null, -- The leader of the parent cell
    parent_id uuid references public.cells(id) on delete set null, -- Direct parent cell for hierarchy
    name text not null,
    address jsonb,
    meeting_day smallint, -- 0 for Sunday, 6 for Saturday
    meeting_time time,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
comment on table public.cells is 'Represents a G12 cell group.';

-- Table for Cell Memberships
-- This table links profiles to cells and tracks their progress.
create table public.cell_members (
  id uuid not null primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cell_id uuid not null references public.cells(id) on delete cascade,
  joined_at timestamptz not null default now(),
  success_ladder_score integer not null default 0,
  is_timoteo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, cell_id) -- A profile can only be a member of a cell once
);
comment on table public.cell_members is 'Tracks which user is in which cell and their progress.';


-- 4. HELPER FUNCTIONS & TRIGGERS

-- Function to automatically update 'updated_at' timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Triggers for 'updated_at'
create trigger on_churches_update before update on public.churches for each row execute procedure public.handle_updated_at();
create trigger on_profiles_update before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger on_cells_update before update on public.cells for each row execute procedure public.handle_updated_at();
create trigger on_cell_members_update before update on public.cell_members for each row execute procedure public.handle_updated_at();

-- Function to automatically create a profile when a new user signs up (via Clerk webhook).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to get the current user's church_id from their profile.
create or replace function public.get_my_church_id()
returns uuid as $$
  select church_id from public.profiles where id = auth.uid();
$$ language sql stable;

-- Function to get the current user's role.
create or replace function public.get_my_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable;

-- 5. ROW LEVEL SECURITY (RLS)

-- Enable RLS for all tables
alter table public.churches enable row level security;
alter table public.profiles enable row level security;
alter table public.cells enable row level security;
alter table public.cell_members enable row level security;

-- Policies for `churches`
create policy "Authenticated users can view churches" on public.churches for select using (auth.role() = 'authenticated');
create policy "Pastors can update their own church" on public.churches for update with check (id = public.get_my_church_id() and public.get_my_role() = 'pastor'::public.user_role);

-- Policies for `profiles`
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can see other profiles from the same church" on public.profiles for select using (church_id = public.get_my_church_id());

-- Policies for `cells`
create policy "Users can view cells in their church" on public.cells for select using (church_id = public.get_my_church_id());
create policy "Leaders can create cells in their church" on public.cells for insert with check (church_id = public.get_my_church_id() and public.get_my_role() in ('leader', 'supervisor', 'pastor'));
create policy "Leaders can update their own cell" on public.cells for update with check (leader_id = auth.uid());
-- Add more granular policies for supervisors and pastors later as needed.

-- Policies for `cell_members`
create policy "Users can view memberships in their church" on public.cell_members
  for select
  using (
    exists (
      select 1 from public.cells c where c.id = cell_members.cell_id and c.church_id = public.get_my_church_id()
    )
  );

create policy "Leaders can manage members in their own cell" on public.cell_members
  for all
  using (
    exists (
      select 1 from public.cells c
      where c.id = cell_members.cell_id and c.leader_id = auth.uid()
    )
  )
  with check (
     exists (
      select 1 from public.cells c
      where c.id = cell_members.cell_id and c.leader_id = auth.uid()
    )
  );


-- 6. INDEXES
-- Create indexes for performance on frequently queried columns.
create index on public.profiles (church_id);
create index on public.cells (church_id);
create index on public.cells (leader_id);
create index on public.cells (parent_id);
create index on public.cell_members (profile_id);
create index on public.cell_members (cell_id);