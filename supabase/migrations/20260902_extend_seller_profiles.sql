-- Datos personales básicos adicionales para los perfiles del equipo.
-- Es una migración aditiva: no elimina ni modifica los registros existentes.

alter table public.users
  add column if not exists document_number text,
  add column if not exists birth_date date,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists hire_date date;

comment on column public.users.document_number is 'Documento de identidad del colaborador';
comment on column public.users.birth_date is 'Fecha de nacimiento del colaborador';
comment on column public.users.address is 'Dirección de residencia del colaborador';
comment on column public.users.city is 'Ciudad de residencia del colaborador';
comment on column public.users.hire_date is 'Fecha de ingreso a la empresa';
