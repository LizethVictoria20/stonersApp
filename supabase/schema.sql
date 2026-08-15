-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.
-- Express guarda aquí los documentos operativos como JSONB.
-- GitHub Pages nunca accede directamente a esta tabla.

create table if not exists public.app_records (
  entity_type text not null check (
    entity_type in (
      'users', 'tasks', 'sops', 'goals', 'notifications',
      'activity_logs', 'sales_budgets', 'daily_sales', 'stores'
    )
  ),
  entity_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create index if not exists app_records_entity_type_created_at_idx
  on public.app_records (entity_type, created_at desc);

create or replace function public.set_app_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_records_set_updated_at on public.app_records;
create trigger app_records_set_updated_at
before update on public.app_records
for each row execute function public.set_app_records_updated_at();

alter table public.app_records enable row level security;

-- No se crean políticas para anon/authenticated. Solo el backend de Render,
-- mediante SUPABASE_SECRET_KEY, puede leer o modificar los registros.
