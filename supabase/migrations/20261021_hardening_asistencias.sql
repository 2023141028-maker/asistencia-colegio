-- ============================================================
-- ENDURECIMIENTO DE ASISTENCIAS
-- I.E.E. DANIEL HERNÁNDEZ
-- Fecha: 2026-10-21
-- ============================================================
-- Objetivos:
-- 1. Mantener la hora real de última actualización oficial.
-- 2. Consolidar duplicados existentes sin perder verificación docente.
-- 3. Impedir duplicados futuros por fecha + estudiante.
-- 4. Asegurar que Realtime incluya la tabla asistencias.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1) COLUMNA DE ÚLTIMA ACTUALIZACIÓN OFICIAL
-- ------------------------------------------------------------

alter table public.asistencias
  add column if not exists actualizado_at timestamptz;

update public.asistencias
set actualizado_at = coalesce(
  actualizado_at,
  created_at,
  now()
)
where actualizado_at is null;

alter table public.asistencias
  alter column actualizado_at set default now();

alter table public.asistencias
  alter column actualizado_at set not null;

-- ------------------------------------------------------------
-- 2) CONSOLIDAR POSIBLES DUPLICADOS EXISTENTES
-- ------------------------------------------------------------
-- Se conserva un único registro por fecha + estudiante.
-- Para la asistencia oficial se prioriza un registro real de
-- Dirección/Auxiliar/QR frente al marcador provisional creado
-- cuando un docente registra antes que Dirección.
-- Los datos docentes se toman del registro docente más reciente.

with grupos as (
  select
    fecha,
    estudiante_id,

    (
      array_agg(
        id
        order by
          case
            when registrado_por is distinct from 'Sistema - sin control previo'
              then 0
            else 1
          end,
          coalesce(actualizado_at, created_at) desc,
          id desc
      )
    )[1] as keeper_id,

    (
      array_agg(
        estudiante_nombre
        order by
          coalesce(actualizado_at, created_at) desc
      )
      filter (where estudiante_nombre is not null)
    )[1] as estudiante_nombre,

    (
      array_agg(
        seccion
        order by
          coalesce(actualizado_at, created_at) desc
      )
      filter (where seccion is not null)
    )[1] as seccion,

    (
      array_agg(
        estado
        order by
          case
            when registrado_por is distinct from 'Sistema - sin control previo'
              then 0
            else 1
          end,
          coalesce(actualizado_at, created_at) desc
      )
      filter (where estado is not null)
    )[1] as estado,

    (
      array_agg(
        registrado_por
        order by
          case
            when registrado_por is distinct from 'Sistema - sin control previo'
              then 0
            else 1
          end,
          coalesce(actualizado_at, created_at) desc
      )
      filter (where registrado_por is not null)
    )[1] as registrado_por,

    (
      array_agg(
        estado_docente
        order by
          actualizado_docente_at desc nulls last,
          coalesce(actualizado_at, created_at) desc
      )
      filter (where estado_docente is not null)
    )[1] as estado_docente,

    (
      array_agg(
        registrado_docente_por
        order by
          actualizado_docente_at desc nulls last,
          coalesce(actualizado_at, created_at) desc
      )
      filter (where registrado_docente_por is not null)
    )[1] as registrado_docente_por,

    max(actualizado_docente_at)
      as actualizado_docente_at,

    max(actualizado_at)
      as actualizado_at

  from public.asistencias
  group by fecha, estudiante_id
  having count(*) > 1
),
actualizados as (
  update public.asistencias a
  set
    estudiante_nombre = coalesce(
      g.estudiante_nombre,
      a.estudiante_nombre
    ),
    seccion = coalesce(
      g.seccion,
      a.seccion
    ),
    estado = coalesce(
      g.estado,
      a.estado
    ),
    registrado_por = coalesce(
      g.registrado_por,
      a.registrado_por
    ),
    estado_docente = coalesce(
      g.estado_docente,
      a.estado_docente
    ),
    registrado_docente_por = coalesce(
      g.registrado_docente_por,
      a.registrado_docente_por
    ),
    actualizado_docente_at = coalesce(
      g.actualizado_docente_at,
      a.actualizado_docente_at
    ),
    actualizado_at = greatest(
      coalesce(g.actualizado_at, a.actualizado_at),
      a.actualizado_at
    )
  from grupos g
  where a.id = g.keeper_id
  returning a.id
)
delete from public.asistencias a
using grupos g
where
  a.fecha = g.fecha
  and a.estudiante_id = g.estudiante_id
  and a.id <> g.keeper_id;

-- ------------------------------------------------------------
-- 3) IMPEDIR DUPLICADOS FUTUROS
-- ------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'asistencias_fecha_estudiante_unique'
      and conrelid = 'public.asistencias'::regclass
  ) then
    alter table public.asistencias
      add constraint asistencias_fecha_estudiante_unique
      unique (fecha, estudiante_id);
  end if;
end
$$;

create index if not exists asistencias_fecha_idx
  on public.asistencias (fecha);

create index if not exists asistencias_estudiante_idx
  on public.asistencias (estudiante_id);

-- ------------------------------------------------------------
-- 4) ACTUALIZAR AUTOMÁTICAMENTE actualizado_at
-- ------------------------------------------------------------

create or replace function public.set_asistencias_actualizado_at()
returns trigger
language plpgsql
as $$
begin
  -- Solo se cambia la hora oficial si cambió algún campo oficial.
  if
    new.estado is distinct from old.estado
    or new.registrado_por is distinct from old.registrado_por
    or new.estudiante_nombre is distinct from old.estudiante_nombre
    or new.seccion is distinct from old.seccion
  then
    new.actualizado_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_asistencias_actualizado_at
  on public.asistencias;

create trigger trg_asistencias_actualizado_at
before update on public.asistencias
for each row
execute function public.set_asistencias_actualizado_at();

-- ------------------------------------------------------------
-- 5) REALTIME
-- ------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'asistencias'
  ) then
    alter publication supabase_realtime
      add table public.asistencias;
  end if;
end
$$;

commit;
