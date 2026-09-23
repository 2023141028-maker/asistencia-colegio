import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, AlertTriangle, Phone, 
  MessageCircle, Search, Calendar, School, ShieldAlert, 
  FileSpreadsheet, Upload, Check, Lock, LogOut, UserCheck
} from 'lucide-react';

// Cuentas predefinidas del personal del colegio
const USUARIOS_SISTEMA = [
  { usuario: 'director', clave: 'dir2026', rol: 'director', nombre: 'Dirección General' },
  { usuario: 'auxiliar', clave: 'aux2026', rol: 'auxiliar', nombre: 'Auxiliar de Puerta' },
  { usuario: 'docente', clave: 'doc2026', rol: 'docente', nombre: 'Profesor de Aula' }
];

const ESTUDIANTES_INICIALES = [
  { id: 1, name: 'ALVARADO PAUCAR JOSHUA SAMIR', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123451' },
  { id: 2, name: 'ATOCCSA ARANCEL JORAN DAVID', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123452' },
  { id: 3, name: 'AUCAYAURI BERROCAL HENRRY', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123453' },
  { id: 4, name: 'AYUQUE CAHUAYA VICTOR RAUL', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123454' },
  { id: 5, name: 'CAPCHA LLANO JHEREMY JAMPOOL', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123455' },
  { id: 6, name: 'CONCHA SOTO AHIDAN SANTOS', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123456' },
  { id: 7, name: 'ALFONSO DE LA CRUZ ANGEL GABRIEL', grade: 'SEGUNDO', section: 'ANDRES AVELINO CACERES', phone: '964234561' },
  { id: 8, name: 'BARRETO CONDOR KEVIN SMITH', grade: 'SEGUNDO', section: 'ANDRES AVELINO CACERES', phone: '964234562' },
  { id: 9, name: 'CARDENAS PAUCAR EDSON LEONEL', grade: 'SEGUNDO', section: 'ANDRES AVELINO CACERES', phone: '964234563' },
  { id: 10, name: 'CASAS OSORES JAIRO FABRIZIO', grade: 'SEGUNDO', section: 'ANDRES AVELINO CACERES', phone: '964234564' },
  { id: 11, name: 'AGUIRRE QUISPE LUIS ENRIQUE', grade: 'TERCERO', section: 'CESAR VALLEJO', phone: '964345671' },
  { id: 12, name: 'ARROYO MATAMOROS DIEGO ARMANDO', grade: 'TERCERO', section: 'CESAR VALLEJO', phone: '964345672' },
  { id: 13, name: 'CABRERA MEZA JHONATAN', grade: 'TERCERO', section: 'CESAR VALLEJO', phone: '964345673' },
  { id: 14, name: 'GOMEZ ROJAS KEVIN DANIEL', grade: 'TERCERO', section: 'CESAR VALLEJO', phone: '964345674' },
  { id: 15, name: 'BAUTISTA DE LA CRUZ JHON', grade: 'CUARTO', section: 'NIKOLA TESLA', phone: '964456781' },
  { id: 16, name: 'CHAHUA HUAMAN CRISTIAN', grade: 'CUARTO', section: 'NIKOLA TESLA', phone: '964456782' },
  { id: 17, name: 'DIAZ MENDOZA JHAN PIERO', grade: 'CUARTO', section: 'NIKOLA TESLA', phone: '964456783' },
  { id: 18, name: 'ARIAS CCANTO MIGUEL ANGEL', grade: 'QUINTO', section: 'SOCRATES', phone: '964567891' },
  { id: 19, name: 'CCORA TAYPE JUAN CARLOS', grade: 'QUINTO', section: 'SOCRATES', phone: '964567892' },
  { id: 20, name: 'QUISPE MENDOZA FLOR MARIA', grade: 'QUINTO', section: 'SOCRATES', phone: '964567893' },
];

export default function App() {
  // Estado de Sesión del Usuario
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => {
    const sesion = localStorage.getItem('colegio_sesion');
    return sesion ? JSON.parse(sesion) : null;
  });

  const [inputUsuario, setInputUsuario] = useState('');
  const [inputClave, setInputClave] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  // Estudiantes y Asistencias
  const [estudiantes, setEstudiantes] = useState(() => {
    const local = localStorage.getItem('colegio_estudiantes');
    return local ? JSON.parse(local) : ESTUDIANTES_INICIALES;
  });

  const [fechaHoy, setFechaHoy] = useState(new Date().toISOString().split('T')[0]);
  const [rolActivo, setRolActivo] = useState('docente');

  const [asistencias, setAsistencias] = useState(() => {
    const local = localStorage.getItem('colegio_asistencias');
    if (local) return JSON.parse(local);
    const mock = {};
    const hoy = new Date().toISOString().split('T')[0];
    mock[hoy] = {
      2: { status: 'T', time: '08:14' },
      4: { status: 'F', time: '08:00' },
      11: { status: 'T', time: '08:22' },
      14: { status: 'F', time: '08:00' }
    };
    return mock;
  });

  // Guardar en Storage
  useEffect(() => {
    localStorage.setItem('colegio_estudiantes', JSON.stringify(estudiantes));
  }, [estudiantes]);

  useEffect(() => {
    localStorage.setItem('colegio_asistencias', JSON.stringify(asistencias));
  }, [asistencias]);

  // Manejo de Inicio y Cierre de Sesión
  const handleLogin = (e) => {
    e.preventDefault();
    const encontrado = USUARIOS_SISTEMA.find(
      u => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.clave === inputClave
    );

    if (encontrado) {
      setUsuarioAutenticado(encontrado);
      setRolActivo(encontrado.rol);
      localStorage.setItem('colegio_sesion', JSON.stringify(encontrado));
      setErrorLogin('');
      setInputClave('');
    } else {
      setErrorLogin('Usuario o contraseña incorrectos. Solicítelos a Dirección.');
    }
  };

  const handleLogout = () => {
    setUsuarioAutenticado(null);
    localStorage.removeItem('colegio_sesion');
  };

  // Filtros del Docente
  const gradosDisponibles = useMemo(() => [...new Set(estudiantes.map(e => e.grade))], [estudiantes]);
  const [gradoSel, setGradoSel] = useState('PRIMERO');
  
  const seccionesDisponibles = useMemo(() => {
    return [...new Set(estudiantes.filter(e => e.grade === gradoSel).map(e => e.section))];
  }, [estudiantes, gradoSel]);

  const [seccionSel, setSeccionSel] = useState('');

  useEffect(() => {
    if (seccionesDisponibles.length > 0) {
      setSeccionSel(seccionesDisponibles[0]);
    }
  }, [gradoSel, seccionesDisponibles]);

  const alumnosAula = useMemo(() => {
    return estudiantes.filter(e => e.grade === gradoSel && e.section === seccionSel);
  }, [estudiantes, gradoSel, seccionSel]);

  const [asistenciaAula, setAsistenciaAula] = useState({});
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  useEffect(() => {
    const diaActual = asistencias[fechaHoy] || {};
    const inicial = {};
    alumnosAula.forEach(e => {
      inicial[e.id] = diaActual[e.id]?.status || 'P';
    });
    setAsistenciaAula(inicial);
  }, [alumnosAula, fechaHoy, asistencias]);

  const alternarEstadoAlumno = (id) => {
    setAsistenciaAula(prev => {
      const actual = prev[id] || 'P';
      const siguiente = actual === 'P' ? 'T' : actual === 'T' ? 'F' : 'P';
      return { ...prev, [id]: siguiente };
    });
  };

  const guardarAsistenciaAula = () => {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAsistencias(prev => {
      const dia = { ...(prev[fechaHoy] || {}) };
      Object.keys(asistenciaAula).forEach(id => {
        dia[id] = { status: asistenciaAula[id], time: hora };
      });
      return { ...prev, [fechaHoy]: dia };
    });
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2500);
  };

  // Buscador de Puerta
  const [busquedaAux, setBusquedaAux] = useState('');
  const [mensajePuerta, setMensajePuerta] = useState('');

  const resultadosAux = useMemo(() => {
    if (!busquedaAux.trim()) return [];
    const t = busquedaAux.toUpperCase();
    return estudiantes.filter(e => e.name.includes(t) || e.grade.includes(t) || e.section.includes(t)).slice(0, 6);
  }, [busquedaAux, estudiantes]);

  const registrarTardanzaPuerta = (alumno) => {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAsistencias(prev => {
      const dia = { ...(prev[fechaHoy] || {}) };
      dia[alumno.id] = { status: 'T', time: hora };
      return { ...prev, [fechaHoy]: dia };
    });
    setMensajePuerta(`⚠️ Tardanza marcada: ${alumno.name} (${hora})`);
    setBusquedaAux('');
    setTimeout(() => setMensajePuerta(''), 3000);
  };

  // Métricas Director
  const metricasDirector = useMemo(() => {
    const dia = asistencias[fechaHoy] || {};
    let faltasHoy = 0;
    let tardanzasHoy = 0;
    let presentesHoy = 0;

    estudiantes.forEach(e => {
      const st = dia[e.id]?.status || 'P';
      if (st === 'F') faltasHoy++;
      else if (st === 'T') tardanzasHoy++;
      else presentesHoy++;
    });

    const acumulados = estudiantes.map(e => {
      let tCount = 0;
      let fCount = 0;
      Object.values(asistencias).forEach(diaReg => {
        if (diaReg[e.id]?.status === 'T') tCount++;
        if (diaReg[e.id]?.status === 'F') fCount++;
      });
      return { ...e, tardanzasMes: tCount, faltasMes: fCount };
    });

    const enRiesgo = acumulados.filter(e => e.tardanzasMes >= 3 || e.faltasMes >= 3);
    const faltaronHoyLista = estudiantes.filter(e => dia[e.id]?.status === 'F');

    return { faltasHoy, tardanzasHoy, presentesHoy, enRiesgo, faltaronHoyLista, acumulados };
  }, [asistencias, estudiantes, fechaHoy]);

  const enviarWhatsApp = (alumno, tipoAlerta) => {
    let mensaje = '';
    if (tipoAlerta === 'falta_hoy') {
      mensaje = `Estimado(a) padre de familia de *${alumno.name}* (${alumno.grade} - ${alumno.section}): Le saluda la Dirección del Colegio. Le informamos que el día de hoy ${fechaHoy} el estudiante no se ha presentado a clases. Por favor comunicarse a la brevedad para justificar su inasistencia. Gracias.`;
    } else {
      mensaje = `CITACIÓN FORMAL: Estimado(a) apoderado de *${alumno.name}* (${alumno.grade} - ${alumno.section}). La Dirección del Colegio le notifica que su menor hijo(a) registra a la fecha *${alumno.tardanzasMes} tardanzas* y *${alumno.faltasMes} faltas* en el presente mes. Solicitamos su presencia el día de mañana a las 8:00 AM en la Dirección para coordinar su situación disciplinaria.`;
    }
    const url = `https://wa.me/51${alumno.phone}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // ==========================================
  // PANTALLA 1: BLOQUEO DE SEGURIDAD / LOGIN
  // ==========================================
  if (!usuarioAutenticado) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-emerald-700 p-6 text-center text-white">
            <div className="w-16 h-16 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <School className="w-9 h-9 text-emerald-200" />
            </div>
            <h1 className="text-xl font-bold">EduAsistencia</h1>
            <p className="text-xs text-emerald-200 mt-1">Acceso restringido al personal del colegio</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {errorLogin && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorLogin}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Usuario</label>
              <input 
                type="text" 
                placeholder="Ej: director, docente o auxiliar"
                value={inputUsuario}
                onChange={(e) => setInputUsuario(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={inputClave}
                onChange={(e) => setInputClave(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3 rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Lock className="w-4 h-4" /> Ingresar al Sistema
            </button>

            {/* Guía rápida de contraseñas de prueba para el desarrollo */}
            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg">
              <p className="font-bold text-slate-700 mb-1">Cuentas autorizadas:</p>
              <ul className="space-y-0.5">
                <li>• <b>Director:</b> <code>director</code> / <code>dir2026</code></li>
                <li>• <b>Docente:</b> <code>docente</code> / <code>doc2026</code></li>
                <li>• <b>Auxiliar:</b> <code>auxiliar</code> / <code>aux2026</code></li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // PANTALLA 2: SISTEMA PRINCIPAL AUTORIZADO
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-16">
      {/* Barra Superior con botón de Cerrar Sesión */}
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-emerald-200" />
            <div>
              <h1 className="text-base font-bold leading-tight">EduAsistencia</h1>
              <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> {usuarioAutenticado.nombre}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-800/90 px-2.5 py-1 rounded-lg text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <input 
                type="date" 
                value={fechaHoy} 
                onChange={(e) => setFechaHoy(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              />
            </div>

            <button 
              onClick={handleLogout}
              title="Cerrar Sesión para bloquear la app"
              className="bg-emerald-900/80 hover:bg-rose-700 p-1.5 rounded-lg text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pestañas restringidas según el rol del usuario */}
        <div className="max-w-2xl mx-auto flex text-center border-t border-emerald-600/50">
          {(usuarioAutenticado.rol === 'director' || usuarioAutenticado.rol === 'docente') && (
            <button 
              onClick={() => setRolActivo('docente')}
              className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rolActivo === 'docente' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Users className="w-4 h-4" /> En Aula
            </button>
          )}

          {(usuarioAutenticado.rol === 'director' || usuarioAutenticado.rol === 'auxiliar') && (
            <button 
              onClick={() => setRolActivo('auxiliar')}
              className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rolActivo === 'auxiliar' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Clock className="w-4 h-4" /> En Puerta
            </button>
          )}

          {usuarioAutenticado.rol === 'director' && (
            <button 
              onClick={() => setRolActivo('director')}
              className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rolActivo === 'director' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Panel Director
              {metricasDirector.enRiesgo.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                  {metricasDirector.enRiesgo.length}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 flex-1">
        {/* ==================== VISTA 1: EN AULA (DOCENTES) ==================== */}
        {rolActivo === 'docente' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Grado</label>
                <select 
                  value={gradoSel} 
                  onChange={(e) => setGradoSel(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {gradosDisponibles.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Sección</label>
                <select 
                  value={seccionSel} 
                  onChange={(e) => setSeccionSel(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {seccionesDisponibles.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 flex items-center justify-between">
              <span>👉 <b>Toca al alumno</b> para cambiar su estado:</span>
              <div className="flex gap-1.5">
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">P</span>
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-bold">T</span>
                <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-bold">F</span>
              </div>
            </div>

            <div className="space-y-2">
              {alumnosAula.map((alumno, index) => {
                const estado = asistenciaAula[alumno.id] || 'P';
                return (
                  <div 
                    key={alumno.id}
                    onClick={() => alternarEstadoAlumno(alumno.id)}
                    className={`cursor-pointer select-none p-3.5 rounded-xl border-2 transition-all flex items-center justify-between shadow-sm active:scale-[0.99] ${
                      estado === 'P' 
                        ? 'bg-emerald-50 border-emerald-300' 
                        : estado === 'T' 
                          ? 'bg-amber-50 border-amber-400' 
                          : 'bg-rose-50 border-rose-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-400 w-5">#{index + 1}</span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-snug">{alumno.name}</p>
                        <p className="text-[11px] text-slate-500">Apoderado: {alumno.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {estado === 'P' && (
                        <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-sm">
                          <CheckCircle2 className="w-4 h-4" /> PRESENTE
                        </div>
                      )}
                      {estado === 'T' && (
                        <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-sm">
                          <Clock className="w-4 h-4" /> TARDANZA
                        </div>
                      )}
                      {estado === 'F' && (
                        <div className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-sm">
                          <XCircle className="w-4 h-4" /> FALTA
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button 
                onClick={guardarAsistenciaAula}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-base transition-all"
              >
                {guardadoExitoso ? (
                  <>
                    <Check className="w-6 h-6 text-white" /> ¡Asistencia Guardada con Éxito!
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" /> Guardar Asistencia de {seccionSel}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ==================== VISTA 2: EN PUERTA (AUXILIAR) ==================== */}
        {rolActivo === 'auxiliar' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 text-base mb-1">Control Matutino de Ingreso</h2>
              <p className="text-xs text-slate-500 mb-3">Escribe el apellido para registrar la tardanza:</p>
              
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Escribe el apellido del alumno..."
                  value={busquedaAux}
                  onChange={(e) => setBusquedaAux(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {mensajePuerta && (
                <div className="mt-3 bg-amber-100 border border-amber-300 text-amber-900 font-bold p-3 rounded-lg text-sm text-center animate-pulse">
                  {mensajePuerta}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {resultadosAux.map(alumno => (
                <div 
                  key={alumno.id} 
                  className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{alumno.name}</p>
                    <p className="text-xs font-semibold text-emerald-700">{alumno.grade} - {alumno.section}</p>
                  </div>

                  <button 
                    onClick={() => registrarTardanzaPuerta(alumno)}
                    className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow"
                  >
                    <Clock className="w-4 h-4" /> Marcar Tardanza
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== VISTA 3: PANEL DEL DIRECTOR ==================== */}
        {rolActivo === 'director' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Presentes Hoy</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{metricasDirector.presentesHoy}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Tardanzas Hoy</p>
                <p className="text-xl font-black text-amber-500 mt-0.5">{metricasDirector.tardanzasHoy}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Faltas Hoy</p>
                <p className="text-xl font-black text-rose-600 mt-0.5">{metricasDirector.faltasHoy}</p>
              </div>
            </div>

            {/* FALTAS DE HOY */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Alumnos Ausentes Hoy ({metricasDirector.faltaronHoyLista.length})</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400">Avisar a padres</span>
              </div>

              {metricasDirector.faltaronHoyLista.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">No hay ausencias registradas el día de hoy.</p>
              ) : (
                <div className="space-y-2.5">
                  {metricasDirector.faltaronHoyLista.map(alumno => (
                    <div key={alumno.id} className="bg-rose-50/60 p-3 rounded-lg border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{alumno.name}</p>
                        <p className="text-xs text-rose-700 font-semibold">{alumno.grade} - {alumno.section}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:${alumno.phone}`} 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5" /> Llamar
                        </a>
                        <button 
                          onClick={() => enviarWhatsApp(alumno, 'falta_hoy')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEMÁFORO DE ALERTA: 3+ INCIDENCIAS */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Alerta: 3+ Faltas o Tardanzas en el Mes</h3>
                </div>
                <span className="bg-rose-100 text-rose-700 font-black text-xs px-2 py-0.5 rounded-full">
                  {metricasDirector.enRiesgo.length} en riesgo
                </span>
              </div>

              {metricasDirector.enRiesgo.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">No hay alumnos con 3 o más incidencias.</p>
              ) : (
                <div className="space-y-2.5">
                  {metricasDirector.enRiesgo.map(alumno => (
                    <div key={alumno.id} className="bg-amber-50/70 p-3 rounded-lg border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{alumno.name}</p>
                        <p className="text-xs text-slate-600">{alumno.grade} - {alumno.section}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                            {alumno.tardanzasMes} Tardanzas
                          </span>
                          <span className="text-[11px] font-bold text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded">
                            {alumno.faltasMes} Faltas
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => enviarWhatsApp(alumno, 'citacion')}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                      >
                        <MessageCircle className="w-4 h-4" /> Citar por WhatsApp
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}