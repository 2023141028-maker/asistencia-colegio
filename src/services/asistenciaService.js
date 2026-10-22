import { supabase } from '../supabase';

const conLimiteDeTiempo = (promesa, ms = 3000) => {
  return Promise.race([
    promesa,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_CONEXION')), ms)
    )
  ]);
};

const esConflictoUnico = (error) =>
  error?.code === '23505' ||
  String(error?.message || '').toLowerCase().includes('duplicate');

export const guardarAsistenciaOficial = async ({
  fecha,
  estudianteId,
  estudianteNombre,
  seccion,
  estado,
  registradoPor
}) => {
  const id = String(estudianteId);

  const cambios = {
    estudiante_nombre: estudianteNombre,
    seccion,
    estado,
    registrado_por: registradoPor
  };

  const { data, error } = await conLimiteDeTiempo(
    supabase
      .from('asistencias')
      .update(cambios)
      .eq('fecha', fecha)
      .eq('estudiante_id', id)
      .select('id'),
    3000
  );

  if (error) throw error;
  if (data?.length) return data[0];

  const filaNueva = {
    fecha,
    estudiante_id: id,
    ...cambios
  };

  const { data: insertado, error: errorInsert } = await conLimiteDeTiempo(
    supabase
      .from('asistencias')
      .insert([filaNueva])
      .select('id')
      .single(),
    3000
  );

  // Si dos dispositivos intentaron insertar a la vez y la BD ya tiene
  // la restricción única, el segundo convierte el conflicto en UPDATE.
  if (errorInsert && esConflictoUnico(errorInsert)) {
    const { data: reintentado, error: errorReintento } = await conLimiteDeTiempo(
      supabase
        .from('asistencias')
        .update(cambios)
        .eq('fecha', fecha)
        .eq('estudiante_id', id)
        .select('id')
        .single(),
      3000
    );

    if (errorReintento) throw errorReintento;
    return reintentado;
  }

  if (errorInsert) throw errorInsert;
  return insertado;
};

export const guardarAsistenciaDocente = async ({
  fecha,
  alumnos,
  estados,
  seccion,
  nombreDocente
}) => {
  const ahoraIso = new Date().toISOString();

  for (const alumno of alumnos) {
    const estudianteId = String(alumno.id);
    const estadoDocente = estados[alumno.id];

    if (!['P', 'T', 'F', 'E', 'J'].includes(estadoDocente)) {
      continue;
    }

    const { data, error } = await conLimiteDeTiempo(
      supabase
        .from('asistencias')
        .update({
          estado_docente: estadoDocente,
          registrado_docente_por: nombreDocente || 'Docente',
          actualizado_docente_at: ahoraIso
        })
        .eq('fecha', fecha)
        .eq('estudiante_id', estudianteId)
        .select('id'),
      3000
    );

    if (error) throw error;

    if (!data || data.length === 0) {
      const fila = {
        fecha,
        estudiante_id: estudianteId,
        estudiante_nombre: alumno.name,
        seccion,
        estado: 'P',
        registrado_por: 'Sistema - sin control previo',
        estado_docente: estadoDocente,
        registrado_docente_por: nombreDocente || 'Docente',
        actualizado_docente_at: ahoraIso
      };

      const { error: errorInsert } = await conLimiteDeTiempo(
        supabase.from('asistencias').insert([fila]),
        3000
      );

      if (errorInsert && esConflictoUnico(errorInsert)) {
        const { error: errorReintento } = await conLimiteDeTiempo(
          supabase
            .from('asistencias')
            .update({
              estado_docente: estadoDocente,
              registrado_docente_por: nombreDocente || 'Docente',
              actualizado_docente_at: ahoraIso
            })
            .eq('fecha', fecha)
            .eq('estudiante_id', estudianteId),
          3000
        );

        if (errorReintento) throw errorReintento;
      } else if (errorInsert) {
        throw errorInsert;
      }
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
  const estudianteId = String(alumno.id);

  const { data: existente, error: errorConsulta } = await supabase
    .from('asistencias')
    .select('id, estado, registrado_por, created_at')
    .eq('fecha', fecha)
    .eq('estudiante_id', estudianteId)
    .maybeSingle();

  if (errorConsulta && errorConsulta.code !== 'PGRST116') {
    throw errorConsulta;
  }

  if (existente?.registrado_por?.includes('QR')) {
    return {
      yaRegistrado: true,
      mensaje: 'ASISTENCIA YA REGISTRADA HOY',
      estado: existente.estado
    };
  }

  const [hora, minuto] = horaRegistro.split(':').map(Number);
  const minutosActuales = (hora * 60) + minuto;
  const estado = minutosActuales <= (8 * 60) ? 'P' : 'T';
  const registradoPor = `CONTROL DE INGRESO QR - ${dispositivo}`;

  await guardarAsistenciaOficial({
    fecha,
    estudianteId,
    estudianteNombre: alumno.name,
    seccion: `${alumno.grade || ''} - ${alumno.section || ''}`.trim(),
    estado,
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
