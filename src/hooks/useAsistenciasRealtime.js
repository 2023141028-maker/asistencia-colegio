import { useEffect } from 'react';
import { supabase } from '../supabase';

const useAsistenciasRealtime = ({
  setAsistencias
}) => {
  useEffect(() => {
    const canalAsistencias = supabase
      .channel('asistencias-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asistencias'
        },
        (payload) => {
          const registro =
            payload.eventType === 'DELETE'
              ? payload.old
              : payload.new;

          if (
            !registro?.fecha ||
            !registro?.estudiante_id
          ) {
            return;
          }

          setAsistencias((prev) => {
            const nuevasAsistencias = {
              ...prev
            };

            const fecha = registro.fecha;

            const estudianteId = String(
              registro.estudiante_id
            );

            const diaActual = {
              ...(nuevasAsistencias[fecha] || {})
            };

            // ==================================================
            // ELIMINACIÓN
            // ==================================================

            if (payload.eventType === 'DELETE') {
              delete diaActual[estudianteId];

              nuevasAsistencias[fecha] =
                diaActual;

              localStorage.setItem(
                'dh_asistencias_v26',
                JSON.stringify(
                  nuevasAsistencias
                )
              );

              return nuevasAsistencias;
            }

            // ==================================================
            // INSERT / UPDATE
            // ==================================================

            diaActual[estudianteId] = {
              status:
                registro.estado || null,

              docenteStatus:
                registro.estado_docente || null,

              registradoPor:
                registro.registrado_por || '',

              registradoDocentePor:
                registro.registrado_docente_por || '',

              time:
                registro.created_at
                  ? new Date(
                      registro.created_at
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )
                  : '--:--'
            };

            nuevasAsistencias[fecha] =
              diaActual;

            localStorage.setItem(
              'dh_asistencias_v26',
              JSON.stringify(
                nuevasAsistencias
              )
            );

            return nuevasAsistencias;
          });
        }
      )
      .subscribe((estado) => {
        console.log(
          'Realtime asistencias:',
          estado
        );
      });

    return () => {
      supabase.removeChannel(
        canalAsistencias
      );
    };
  }, [setAsistencias]);
};

export default useAsistenciasRealtime;
