create extension if not exists "pgcrypto";

create table if not exists repositories (
  id text primary key,
  github_owner text not null,
  github_repo text not null,
  github_url text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (github_owner, github_repo)
);

create table if not exists repository_snapshots (
  id uuid primary key default gen_random_uuid(),
  repository_id text not null references repositories(id) on delete cascade,
  stars integer not null default 0,
  forks integer not null default 0,
  open_issues integer not null default 0,
  contributors integer not null default 0,
  recent_commits integer not null default 0,
  recent_releases integer not null default 0,
  captured_at timestamptz not null default now()
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  repository_id text not null references repositories(id) on delete cascade,
  hype_score integer not null check (hype_score >= 0 and hype_score <= 100),
  reality_score integer not null check (reality_score >= 0 and reality_score <= 100),
  risk_score integer not null check (risk_score >= 0 and risk_score <= 100),
  confidence_level text not null check (confidence_level in ('High', 'Medium', 'Low')),
  quantitative_details jsonb not null default '{}'::jsonb,
  qualitative_summary jsonb not null default '{}'::jsonb,
  canva_prompt text not null,
  analysis_status text not null default 'complete',
  created_at timestamptz not null default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analyses(id) on delete cascade,
  external_source_id text not null,
  source_type text not null,
  title text not null,
  summary text not null,
  url text not null,
  sentiment text not null,
  category text not null,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists repository_snapshots_repository_id_captured_at_idx
  on repository_snapshots(repository_id, captured_at desc);

create index if not exists analyses_repository_id_created_at_idx
  on analyses(repository_id, created_at desc);

create index if not exists sources_analysis_id_idx
  on sources(analysis_id);
