import React from 'react';
import {
  AlertTriangle, Check, CheckCircle2, Clock, MessageCircle, Phone,
  School, Search, ShieldAlert, X, XCircle
} from 'lucide-react';
import { obtenerNombreEstado } from '../../utils/estados';

export default function ControlAsistencia({ ctx }) {
  const {
    esDireccion,
    vistaDirector,
    esDocente,
    esAuxiliar,
    subVistaAuxiliar,
    busquedaUniversal,
    setBusquedaUniversal,
    estudiantesFiltradosBuscador,
    cambiarEstadoAlumno,
    asistencias,
    fechaHoy,
    metricasDirector,
    discrepanciasDirector,
    estudiantes,
    alumnosAula,
    asistenciaAula,
    alternarEstadoAlumno,
    aulasPermitidasUsuario,
    gradoSel,
    seccionSel,
    setGradoSel,
    setSeccionSel,
    guardadoExitoso,
    mensajeGuardado,
    guardarAsistenciaAula,
    evadieronHoyLista,
    enviarWhatsApp
  } = ctx;

  return (
    <>
        {/* =========================================================================
            VISTA 1: CONTROL DE ASISTENCIA Y RONDAS
           ========================================================================= */}
        {((esDireccion && vistaDirector === 'asistencia') || esDocente || (esAuxiliar && subVistaAuxiliar === 'salones')) && (
          <div className="space-y-3.5">
            
            {/* BUSCADOR UNIVERSAL DIRECTO DEL DIRECTOR (AUTO-GUARDADO) */}
            {esDireccion && (
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border-2 border-emerald-500">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-600" />
                    Buscador de Alumnos (Auto-guardado en 1 toque)
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Total: {estudiantes.length} alumnos</span>
                </div>
                
                <p className="text-[11px] text-slate-500 mb-2">
                  Escriba el apellido o DNI del alumno y toque su estado. <b>Se guarda solo, no necesita elegir salón.</b>
                </p>

                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Escriba Apellidos o DNI de cualquier alumno..."
                    value={busquedaUniversal}
                    onChange={(e) => setBusquedaUniversal(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {busquedaUniversal && (
                    <button 
                      onClick={() => setBusquedaUniversal('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {estudiantesFiltradosBuscador.length > 0 && (
                  <div className="mt-2.5 space-y-2 border-t border-slate-100 pt-2 max-h-72 overflow-y-auto">
                    {estudiantesFiltradosBuscador.map(alumno => {
                      const st = asistencias[fechaHoy]?.[alumno.id]?.status || 'P';
                      return (
                        <div key={alumno.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{alumno.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              DNI: <b>{alumno.dni || 'S/D'}</b> • <span className="text-emerald-700 font-bold">{alumno.grade} - {alumno.section}</span>
                            </p>
                          </div>

                          {/* BOTONES DIRECTOS: AL TOCAR SE GUARDA AL INSTANTE */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'P')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'P' ? 'bg-emerald-600 text-white border-emerald-700 shadow' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Marcar Presente (Auto-guardado)"
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'T')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'T' ? 'bg-amber-500 text-white border-amber-600 shadow' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Marcar Tardanza (Auto-guardado)"
                            >
                              T
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'F')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'F' ? 'bg-rose-600 text-white border-rose-700 shadow' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Marcar Falta (Auto-guardado)"
                            >
                              F
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'E')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'E' ? 'bg-purple-700 text-white border-purple-800 shadow animate-pulse' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Marcar Evasión (Auto-guardado)"
                            >
                              E
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'J')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'J' ? 'bg-sky-600 text-white border-sky-700 shadow' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Marcar Permiso (Auto-guardado)"
                            >
                              J
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CONTADORES GENERALES */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Presentes</p>
                <p className="text-base sm:text-xl font-black text-emerald-600">{metricasDirector.presentesHoy}</p>
              </div>

              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Tardanzas</p>
                <p className="text-base sm:text-xl font-black text-amber-500">{metricasDirector.tardanzasHoy}</p>
              </div>

              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Faltas</p>
                <p className="text-base sm:text-xl font-black text-rose-600">{metricasDirector.faltasHoy}</p>
              </div>

              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-purple-300 shadow-sm text-center">
                <p className="text-[8px] sm:text-[9px] font-bold text-purple-600 uppercase">Evasión</p>
                <p className="text-base sm:text-xl font-black text-purple-700">{metricasDirector.evasionesHoy}</p>
              </div>

              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-sky-300 shadow-sm text-center">
                <p className="text-[8px] sm:text-[9px] font-bold text-sky-600 uppercase">Permisos</p>
                <p className="text-base sm:text-xl font-black text-sky-700">{metricasDirector.permisosHoy}</p>
              </div>
            </div>
            
            {/* DIFERENCIAS ENTRE DIRECCIÓN Y DOCENTE */}
            {esDireccion && discrepanciasDirector.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-3.5 shadow-sm">
            
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
            
                  <div>
                    <h3 className="text-sm font-black text-amber-900">
                      Registros que requieren revisión
                    </h3>
            
                    <p className="text-[11px] text-amber-700 font-semibold">
                      {discrepanciasDirector.length} diferencia(s) entre Dirección y Docente
                    </p>
                  </div>
                </div>
            
                <div className="space-y-2 max-h-72 overflow-y-auto">
            
                  {discrepanciasDirector.map(item => (
            
                    <div
                      key={item.id}
                      className="bg-white border border-amber-200 rounded-xl p-3"
                    >
            
                      <div className="mb-2">
            
                        <p className="text-xs font-black text-slate-800">
                          {item.nombre}
                        </p>
            
                        <p className="text-[10px] text-slate-500">
                          DNI: {item.dni} • {item.grado} - {item.seccion}
                        </p>
            
                      </div>
            
                      <div className="grid grid-cols-2 gap-2">
            
                        <div className="bg-slate-100 rounded-lg p-2 text-center">
            
                          <p className="text-[9px] font-bold text-slate-500 uppercase">
                            Dirección
                          </p>
            
                          <p className="text-sm font-black text-slate-800">
                            {obtenerNombreEstado(item.estadoDireccion)}
                          </p>
            
                          <p className="text-[9px] text-slate-500 truncate">
                            {item.registradoPor || 'Sin responsable'}
                          </p>
            
                        </div>
            
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
            
                          <p className="text-[9px] font-bold text-blue-600 uppercase">
                            Docente
                          </p>
            
                          <p className="text-sm font-black text-blue-700">
                            {obtenerNombreEstado(item.estadoDocente)}
                          </p>
            
                          <p className="text-[9px] text-blue-500 truncate">
                            {item.registradoDocentePor || 'Sin docente'}
                          </p>
            
                        </div>
            
                      </div>
            
                    </div>
            
                  ))}
            
                </div>
            
              </div>
            )}

            {/* ALERTAS DE EVASIÓN */}
            {metricasDirector.evadieronHoyLista.length > 0 && (
              <div className="bg-purple-900 text-white p-3.5 rounded-2xl shadow-lg border border-purple-700 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-5 h-5 text-purple-300 animate-bounce" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide">
                      🚨 Evasión Confirmada Hoy ({metricasDirector.evadieronHoyLista.length} alumnos)
                    </h3>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {metricasDirector.evadieronHoyLista.map(alumno => (
                    <div key={alumno.id} className="bg-purple-800/90 p-2 rounded-xl border border-purple-600 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs truncate">{alumno.name}</p>
                        <p className="text-[10px] text-purple-300 truncate">{alumno.grade} - {alumno.section}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a 
                          href={`tel:${alumno.phone}`} 
                          className="bg-blue-600 text-white p-1.5 rounded-lg text-xs"
                          title="Llamar"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button 
                          onClick={() => enviarWhatsApp(alumno, 'evasion')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Avisar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVISIÓN POR SALONES */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <School className="w-3.5 h-3.5" /> 
                  {esDireccion ? 'Revisión por Salón (Opcional)' : `Mis Salones (${aulasPermitidasUsuario.length})`}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">{alumnosAula.length} estudiantes</span>
              </div>

              <select 
                value={`${gradoSel}|${seccionSel}`} 
                onChange={(e) => {
                  const [g, s] = e.target.value.split('|');
                  setGradoSel(g);
                  setSeccionSel(s);
                }}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {aulasPermitidasUsuario.map(a => (
                  <option key={`${a.grade}|${a.section}`} value={`${a.grade}|${a.section}`}>
                    {a.grade} - {a.section}
                  </option>
                ))}
              </select>
            </div>

            {/* LISTA DEL SALÓN */}
            <div className="space-y-2">
              {alumnosAula.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                  No hay alumnos en el padrón para {gradoSel} - {seccionSel}.
                </div>
              ) : (
                alumnosAula.map((alumno, index) => {
                  const estado = asistenciaAula[alumno.id] || 'P';
                  return (
                    <div 
                      key={alumno.id}
                      onClick={() => alternarEstadoAlumno(alumno.id)}
                      className={`cursor-pointer select-none p-3 rounded-2xl border-2 transition-all flex items-center justify-between shadow-sm active:scale-[0.98] ${
                        estado === 'P' 
                          ? 'bg-emerald-50/80 border-emerald-300' 
                          : estado === 'T' 
                            ? 'bg-amber-50/80 border-amber-400' 
                            : estado === 'F'
                              ? 'bg-rose-50/80 border-rose-400'
                              : estado === 'E'
                                ? 'bg-purple-50/90 border-purple-400 shadow-purple-100'
                                : 'bg-sky-50/90 border-sky-400 shadow-sky-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-xs font-black text-slate-400 w-5 shrink-0">#{index + 1}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs sm:text-sm leading-tight truncate">{alumno.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {alumno.dni && alumno.dni !== 'S/D' ? `DNI: ${alumno.dni} • ` : ''}Apod: {alumno.phone}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {estado === 'P' && (
                          <div className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-black shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> P
                          </div>
                        )}
                        {estado === 'T' && (
                          <div className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-black shadow-sm">
                            <Clock className="w-3.5 h-3.5" /> T
                          </div>
                        )}
                        {estado === 'F' && (
                          <div className="flex items-center gap-1 bg-rose-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-black shadow-sm">
                            <XCircle className="w-3.5 h-3.5" /> F
                          </div>
                        )}
                        {estado === 'E' && (
                          <div className="flex items-center gap-1 bg-purple-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-black shadow-sm animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5" /> Evasión
                          </div>
                        )}
                        {estado === 'J' && (
                          <div className="flex items-center gap-1 bg-sky-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-black shadow-sm">
                            <FileText className="w-3.5 h-3.5" /> Permiso (J)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {alumnosAula.length > 0 && (
              <div className="pt-2">
                <button 
                  onClick={guardarAsistenciaAula}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-base transition-transform active:scale-[0.99]"
                >
                  {guardadoExitoso ? (
                    <>
                      <Check className="w-6 h-6 text-white shrink-0" /> 
                      <span className="truncate">{mensajeGuardado}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 shrink-0" /> 
                      <span className="truncate">Guardar Salón Completo ({seccionSel})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* PUERTA AUXILIARES */}
        {esAuxiliar && subVistaAuxiliar === 'puerta' && (
          <div className="space-y-3.5">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">Control de Puerta (08:00 AM)</h2>
                <div className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" /> Tardanzas
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">Busque a un estudiante por DNI o Apellido:</p>
              
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Escriba DNI o Apellidos..."
                  value={busquedaUniversal}
                  onChange={(e) => setBusquedaUniversal(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              {estudiantesFiltradosBuscador.map(alumno => (
                <div key={alumno.id} className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{alumno.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      DNI: {alumno.dni || 'S/D'} • <span className="text-emerald-700 font-semibold">{alumno.grade} - {alumno.section}</span>
                    </p>
                  </div>

                  <button 
                    onClick={() => cambiarEstadoAlumno(alumno.id, 'T')}
                    className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow shrink-0"
                  >
                    <Clock className="w-4 h-4" /> Tardanza
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}


    </>
  );
}
