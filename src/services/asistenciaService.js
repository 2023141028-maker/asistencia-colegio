import { supabase } from '../supabase';

const conLimiteDeTiempo = (promesa, ms = 3000) => {
  return Promise.race([
    promesa,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_CONEXION')), ms)
    )
  ]);
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
    const estadoDocente = estados[alumno.id] || 'P';

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

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      const { error: errorInsert } = await conLimiteDeTiempo(
        supabase
          .from('asistencias')
          .insert([
            {
              fecha,
              estudiante_id: estudianteId,
              estudiante_nombre: alumno.name,
              seccion,
              estado: 'P',
              registrado_por: 'Sistema - sin control previo',
              estado_docente: estadoDocente,
              registrado_docente_por: nombreDocente || 'Docente',
              actualizado_docente_at: ahoraIso
            }
          ]),
        3000
      );

      if (errorInsert) {
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
    .select(`
      id,
      estado,
      registrado_por,
      created_at
    `)
    .eq('fecha', fecha)
    .eq('estudiante_id', estudianteId)
    .maybeSingle();

  if (errorConsulta) {
    throw errorConsulta;
  }

  if (existente?.registrado_por?.includes('QR')) {
    return {
      yaRegistrado: true,
      mensaje: 'ASISTENCIA YA REGISTRADA HOY',
      estado: existente.estado
    };
  }

  const [hora, minuto] = horaRegistro
    .split(':')
    .map(Number);

  const minutosActuales =
    (hora * 60) + minuto;

  const limiteIngreso = 8 * 60;

  const estado =
    minutosActuales <= limiteIngreso
      ? 'P'
      : 'T';

  const registradoPor =
    `CONTROL DE INGRESO QR - ${dispositivo}`;

  if (existente) {
    const { error } = await supabase
      .from('asistencias')
      .update({
        estado,
        registrado_por: registradoPor,
        estudiante_nombre: alumno.name,
        seccion: alumno.section
      })
      .eq('id', existente.id);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('asistencias')
      .insert([
        {
          fecha,
          estudiante_id: estudianteId,
          estudiante_nombre: alumno.name,
          seccion: alumno.section,
          estado,
          registrado_por: registradoPor
        }
      ]);

    if (error) {
      throw error;
    }
  }

  return {
    yaRegistrado: false,
    estado,
    mensaje:
      estado === 'P'
        ? 'INGRESO REGISTRADO - PRESENTE'
        : 'INGRESO REGISTRADO - TARDANZA'
  };
};
