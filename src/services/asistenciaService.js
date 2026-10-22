import { supabase } from '../supabase';

const conLimiteDeTiempo = (promesa, ms = 3000) => {
  return Promise.race([
    promesa,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_CONEXION')), ms)
    )
  ]);
};

const esColumnaActualizadoNoDisponible = (error) =>
  error?.code === '42703' ||
  String(error?.message || '').includes('actualizado_at');

const esConflictoSinRestriccion = (error) =>
  error?.code === '42P10';

const esDuplicado = (error) =>
  error?.code === '23505';

const prepararFilaOficial = (fila, incluirTimestamp = true) => ({
  fecha: fila.fecha,
  estudiante_id: String(fila.estudiante_id),
  estudiante_nombre: fila.estudiante_nombre,
  seccion: fila.seccion,
  estado: fila.estado,
  registrado_por: fila.registrado_por,
  ...(incluirTimestamp
    ? { actualizado_at: new Date().toISOString() }
    : {})
});

const actualizarExistente = async (fila, incluirTimestamp = true) => {
  const payload = prepararFilaOficial(
    fila,
    incluirTimestamp
  );

  const {
    fecha,
    estudiante_id,
    ...camposActualizar
  } = payload;

  return conLimiteDeTiempo(
    supabase
      .from('asistencias')
      .update(camposActualizar)
      .eq('fecha', fecha)
      .eq('estudiante_id', estudiante_id)
      .select('id'),
    3000
  );
};

const insertarNuevo = async (fila, incluirTimestamp = true) =>
  conLimiteDeTiempo(
    supabase
      .from('asistencias')
      .insert([
        prepararFilaOficial(
          fila,
          incluirTimestamp
        )
      ])
      .select('id'),
    3000
  );

const guardarConUpdateInsert = async (
  fila,
  incluirTimestamp = true
) => {
  let resultado = await actualizarExistente(
    fila,
    incluirTimestamp
  );

  if (
    resultado.error &&
    incluirTimestamp &&
    esColumnaActualizadoNoDisponible(
      resultado.error
    )
  ) {
    return guardarConUpdateInsert(
      fila,
      false
    );
  }

  if (resultado.error) {
    throw resultado.error;
  }

  if (
    resultado.data &&
    resultado.data.length > 0
  ) {
    return true;
  }

  let insercion = await insertarNuevo(
    fila,
    incluirTimestamp
  );

  if (
    insercion.error &&
    incluirTimestamp &&
    esColumnaActualizadoNoDisponible(
      insercion.error
    )
  ) {
    return guardarConUpdateInsert(
      fila,
      false
    );
  }

  // Si otro dispositivo insertó la misma asistencia
  // entre nuestro UPDATE e INSERT, repetimos el UPDATE.
  if (esDuplicado(insercion.error)) {
    resultado = await actualizarExistente(
      fila,
      incluirTimestamp
    );

    if (resultado.error) {
      throw resultado.error;
    }

    return true;
  }

  if (insercion.error) {
    throw insercion.error;
  }

  return true;
};

export const guardarAsistenciaOficial = async (
  fila
) => {
  let payload = prepararFilaOficial(
    fila,
    true
  );

  let resultado = await conLimiteDeTiempo(
    supabase
      .from('asistencias')
      .upsert(
        [payload],
        {
          onConflict:
            'fecha,estudiante_id'
        }
      )
      .select('id'),
    3000
  );

  if (
    resultado.error &&
    esColumnaActualizadoNoDisponible(
      resultado.error
    )
  ) {
    payload = prepararFilaOficial(
      fila,
      false
    );

    resultado = await conLimiteDeTiempo(
      supabase
        .from('asistencias')
        .upsert(
          [payload],
          {
            onConflict:
              'fecha,estudiante_id'
          }
        )
        .select('id'),
      3000
    );
  }

  if (!resultado.error) {
    return true;
  }

  // Hasta que la migración SQL de unicidad esté aplicada,
  // mantenemos compatibilidad con la base actual.
  if (
    esConflictoSinRestriccion(
      resultado.error
    )
  ) {
    return guardarConUpdateInsert(
      fila,
      true
    );
  }

  throw resultado.error;
};

export const guardarAsistenciasOficiales = async (
  filas = []
) => {
  for (const fila of filas) {
    await guardarAsistenciaOficial(fila);
  }

  return true;
};

const actualizarDocenteExistente = async ({
  fecha,
  estudianteId,
  estadoDocente,
  nombreDocente,
  ahoraIso
}) =>
  conLimiteDeTiempo(
    supabase
      .from('asistencias')
      .update({
        estado_docente: estadoDocente,
        registrado_docente_por:
          nombreDocente || 'Docente',
        actualizado_docente_at:
          ahoraIso
      })
      .eq('fecha', fecha)
      .eq(
        'estudiante_id',
        estudianteId
      )
      .select('id'),
    3000
  );

export const guardarAsistenciaDocente = async ({
  fecha,
  alumnos,
  estados,
  seccion,
  nombreDocente
}) => {
  const ahoraIso =
    new Date().toISOString();

  for (const alumno of alumnos) {
    const estudianteId =
      String(alumno.id);

    const estadoDocente =
      estados[alumno.id];

    if (
      !['P', 'T', 'F', 'E', 'J'].includes(
        estadoDocente
      )
    ) {
      continue;
    }

    let resultado =
      await actualizarDocenteExistente({
        fecha,
        estudianteId,
        estadoDocente,
        nombreDocente,
        ahoraIso
      });

    if (resultado.error) {
      throw resultado.error;
    }

    if (
      resultado.data &&
      resultado.data.length > 0
    ) {
      continue;
    }

    const { error: errorInsert } =
      await conLimiteDeTiempo(
        supabase
          .from('asistencias')
          .insert([
            {
              fecha,
              estudiante_id:
                estudianteId,
              estudiante_nombre:
                alumno.name,
              seccion,
              estado: 'P',
              registrado_por:
                'Sistema - sin control previo',
              estado_docente:
                estadoDocente,
              registrado_docente_por:
                nombreDocente ||
                'Docente',
              actualizado_docente_at:
                ahoraIso
            }
          ]),
        3000
      );

    if (esDuplicado(errorInsert)) {
      resultado =
        await actualizarDocenteExistente({
          fecha,
          estudianteId,
          estadoDocente,
          nombreDocente,
          ahoraIso
        });

      if (resultado.error) {
        throw resultado.error;
      }

      continue;
    }

    if (errorInsert) {
      throw errorInsert;
    }
  }

  return true;
};

export const registrarIngresoQR = async ({
  alumno,
  fecha,
  horaRegistro,
  dispositivo = 'PUERTA'
}) => {
  const estudianteId =
    String(alumno.id);

  const {
    data: existente,
    error: errorConsulta
  } = await supabase
    .from('asistencias')
    .select(
      'id, estado, registrado_por, created_at'
    )
    .eq('fecha', fecha)
    .eq(
      'estudiante_id',
      estudianteId
    )
    .maybeSingle();

  if (errorConsulta) {
    throw errorConsulta;
  }

  if (
    existente?.registrado_por?.includes(
      'QR'
    )
  ) {
    return {
      yaRegistrado: true,
      mensaje:
        'ASISTENCIA YA REGISTRADA HOY',
      estado: existente.estado
    };
  }

  const [hora, minuto] =
    horaRegistro
      .split(':')
      .map(Number);

  const minutosActuales =
    hora * 60 + minuto;

  const limiteIngreso = 8 * 60;

  const estado =
    minutosActuales <= limiteIngreso
      ? 'P'
      : 'T';

  const registradoPor =
    `CONTROL DE INGRESO QR - ${dispositivo}`;

  await guardarAsistenciaOficial({
    fecha,
    estudiante_id:
      estudianteId,
    estudiante_nombre:
      alumno.name,
    seccion:
      `${alumno.grade || ''} - ${alumno.section || ''}`.trim(),
    estado,
    registrado_por:
      registradoPor
  });

  return {
    yaRegistrado: false,
    estado,
    mensaje:
      estado === 'P'
        ? 'INGRESO REGISTRADO - PRESENTE'
        : 'INGRESO REGISTRADO - TARDANZA'
  };
};
