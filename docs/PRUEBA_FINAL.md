# Prueba final del sistema de asistencia

Rama: `mejora-asistencia-sincronizada`

## 1. Director
- Iniciar sesión y confirmar que no aparezca pantalla blanca.
- Verificar contadores: Presente, Tardanza, Falta, Evasión, Permiso y Sin registro.
- Buscar un estudiante y cambiar su estado.
- Abrir el sistema en otro celular y confirmar que el cambio aparezca en tiempo real.
- Cambiar nuevamente el estado y comprobar que la hora corresponda a la última modificación oficial.
- Descargar Excel diario, semanal y mensual.

## 2. Excel diario
Debe mostrar:
- N°
- DNI
- Apellidos y nombres
- Grado
- Sección
- Hora
- Estado
- Observaciones
- Acción

Validar colores:
- PRESENTE: verde.
- TARDANZA: amarillo.
- FALTA: rojo.
- PERMISO: celeste.
- EVASIÓN: morado.
- SIN REGISTRO: cuando Dirección/Auxiliar/QR todavía no registró al estudiante.

Validar seguimiento:
- 3 tardanzas → LLAMAR ATENCIÓN.
- 3 faltas → LLAMAR ATENCIÓN.
- 1 evasión → LLAMAR ATENCIÓN.

## 3. Excel semanal
- Verificar lunes a viernes.
- Verificar totales P, T, F, E y J.
- Verificar porcentaje de asistencia.
- Confirmar que un registro provisional del docente no cuente como asistencia oficial.

## 4. Excel mensual
- Verificar acumulados P, T, F, E y J.
- Confirmar que 3 tardanzas, 3 faltas o una evasión activen seguimiento.

## 5. Subdirector
- Debe poder revisar asistencia y reportes generales.
- No debe poder administrar personal y padrón.

## 6. Auxiliar
- Debe ver únicamente sus aulas asignadas.
- Debe poder registrar asistencia oficial.
- Los cambios deben aparecer en tiempo real al Director.

## 7. Docente opcional
- Debe ver el estado oficial registrado por Dirección/Auxiliar/QR.
- Su registro debe funcionar como verificación opcional.
- Si no marca a un alumno, no debe asumirlo como presente.
- La verificación docente no debe reemplazar la asistencia oficial.

## 8. QR
- Escanear un estudiante.
- Antes o a las 08:00 debe registrar PRESENTE.
- Después de las 08:00 debe registrar TARDANZA.
- El cambio debe aparecer en otro dispositivo.

## 9. Sin conexión
- Desactivar internet.
- Registrar una asistencia.
- Confirmar aviso de guardado en teléfono.
- Reactivar internet.
- Confirmar sincronización automática con la nube.

## 10. Base de datos
Antes de pasar a producción definitiva, aplicar:
`supabase/migrations/20261021_hardening_asistencias.sql`

Luego comprobar que no existan duplicados por fecha + estudiante.

## 11. Paso final
No fusionar a `main` hasta completar esta prueba.

Después de la prueba:
1. eliminar únicamente registros de prueba identificados;
2. confirmar la migración de Supabase;
3. repetir una prueba desde dos dispositivos;
4. fusionar la rama a `main`.
