# Prueba final del sistema de asistencia

## 1. Director
- Iniciar sesión.
- Verificar que alumnos no registrados aparezcan como **SIN REGISTRO**.
- Marcar un alumno como P, T, F, E y J.
- Confirmar que los contadores cambien en tiempo real.
- Descargar Excel diario, semanal y mensual.
- Confirmar que el Excel diario muestre ESTADO, OBSERVACIONES y ACCIÓN.
- Confirmar que 3 tardanzas o 3 faltas activen seguimiento.

## 2. Subdirector
- Iniciar sesión.
- Ver todos los grados y secciones.
- Consultar asistencia y reportes.
- Confirmar que no pueda gestionar personal si esa función es exclusiva del Director.

## 3. Auxiliar
- Iniciar sesión.
- Ver solo sus aulas asignadas.
- Registrar un salón completo.
- Registrar tardanza desde Control de Puerta.
- Confirmar que el cambio aparezca en otro dispositivo.

## 4. Docente opcional
- Iniciar sesión con una cuenta docente.
- Confirmar que vea el estado oficial sin modificarlo.
- Registrar una verificación docente.
- Confirmar que no cambie la asistencia oficial de Dirección/Auxiliar/QR.

## 5. Sincronización multi-dispositivo
- Abrir el sistema en dos dispositivos.
- Marcar un alumno en el dispositivo A.
- Confirmar que aparezca en el dispositivo B sin recargar.
- Cambiar el estado desde B y comprobar que A se actualice.

## 6. Sin conexión
- Desconectar Internet.
- Registrar asistencia.
- Volver a conectar Internet.
- Confirmar que la cola local se sincronice con Supabase.

## 7. Excel
- Diario: Estado, hora, observaciones y acción.
- Semanal: P, T, F, E, J y seguimiento.
- Mensual: acumulados, porcentaje y condición.
- Confirmar que registros docentes provisionales no cuenten como asistencia oficial.

## 8. Antes de producción definitiva
- Aplicar la migración SQL `supabase/migrations/20261021_integridad_asistencias.sql` en Supabase.
- Identificar y eliminar únicamente registros de prueba, nunca datos reales.
- Pasar la rama `mejora-asistencia-sincronizada` a `main` después de aprobar todas las pruebas.
