-- Integridad y sincronización de asistencias
-- I.E.E. Daniel Hernández

begin;

-- 1) Hora real de última actualización de la asistencia oficial.
alter table public.asistencias
  add column if not exists actualizado_at timestamptz;

update public.asistencias
set actualizado_at = coalesce(actualizado_at, created_at, now())
where actualizado_at is null;

create or replace function public.actualizar_marca_asistencia()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_at = now();
  return new;
end;
$$;

drop trigger if exists trg_actualizar_marca_asistencia on public.asistencias;

create trigger trg_actualizar_marca_asistencia
before update on public.asistencias
for each row
execute function public.actualizar_marca_asistencia();

-- 2) Eliminar duplicados técnicos de la misma fecha/estudiante.
-- Conserva el registro más reciente.
with ordenados as (
  select
    ctid,
    row_number() over (
      partition by fecha, estudiante_id
      order by
        coalesce(actualizado_at, created_at) desc nulls last,
        created_at desc nulls last
    ) as rn
  from public.asistencias
)
delete from public.asistencias a
using ordenados o
where a.ctid = o.ctid
  and o.rn > 1;

-- 3) Un estudiante solo puede tener un registro oficial por fecha.
create unique index if not exists ux_asistencias_fecha_estudiante
  on public.asistencias (fecha, estudiante_id);

-- 4) Estados permitidos.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'asistencias_estado_valido'
  ) then
    alter table public.asistencias
      add constraint asistencias_estado_valido
      check (estado in ('P','T','F','E','J'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'asistencias_estado_docente_valido'
  ) then
    alter table public.asistencias
      add constraint asistencias_estado_docente_valido
      check (
        estado_docente is null
        or estado_docente in ('P','T','F','E','J')
      );
  end if;
end $$;

-- 5) Índices útiles para reportes.
create index if not exists ix_asistencias_fecha
  on public.asistencias (fecha);

create index if not exists ix_asistencias_estudiante
  on public.asistencias (estudiante_id);

commit;
