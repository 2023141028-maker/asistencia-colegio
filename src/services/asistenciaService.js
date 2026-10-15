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
