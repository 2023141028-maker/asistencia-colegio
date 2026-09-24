import { supabase } from './supabase';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, AlertTriangle, Phone, 
  MessageCircle, Search, Calendar, School, ShieldAlert, 
  FileSpreadsheet, Check, Lock, LogOut, UserCheck, Eye, EyeOff, 
  HelpCircle, X, Download, UserPlus, Trash2, ShieldCheck,
  Upload, Edit3, Plus, Wifi, WifiOff, Smartphone,
  CalendarRange, Filter, Sparkles, KeyRound, Save, CheckSquare, Square,
  Loader2, FileText, Settings
} from 'lucide-react';

// Catálogo oficial de las 30 secciones de la I.E.E. "Daniel Hernández"
const AULAS_OFICIALES_DH = [
  // 1ro de Secundaria
  { grade: 'PRIMERO', section: 'RESPONSABILIDAD' },
  { grade: 'PRIMERO', section: 'HONRADEZ' },
  { grade: 'PRIMERO', section: 'RESPETO' },
  { grade: 'PRIMERO', section: 'SOLIDARIDAD' },
  { grade: 'PRIMERO', section: 'PERSEVERANCIA' },
  { grade: 'PRIMERO', section: 'LABORIOSIDAD' },
  // 2do de Secundaria
  { grade: 'SEGUNDO', section: 'D. A. CARRIÓN' },
  { grade: 'SEGUNDO', section: 'SAN MARTÍN' },
  { grade: 'SEGUNDO', section: 'MIGUEL GRAU' },
  { grade: 'SEGUNDO', section: 'JOSÉ OLAYA' },
  { grade: 'SEGUNDO', section: 'F. BOLOGNESI' },
  { grade: 'SEGUNDO', section: 'A. A. CÁCERES' },
  // 3ro de Secundaria
  { grade: 'TERCERO', section: 'A. VALDELOMAR' },
  { grade: 'TERCERO', section: 'C. ALEGRÍA' },
  { grade: 'TERCERO', section: 'J. C. MARIÁTEGUI' },
  { grade: 'TERCERO', section: 'C. VALLEJO' },
  { grade: 'TERCERO', section: 'R. PALMA' },
  { grade: 'TERCERO', section: 'M. V. LLOSA' },
  // 4to de Secundaria
  { grade: 'CUARTO', section: 'N. TESLA' },
  { grade: 'CUARTO', section: 'R. DESCARTES' },
  { grade: 'CUARTO', section: 'P. FERMAT' },
  { grade: 'CUARTO', section: 'I. NEWTON' },
  { grade: 'CUARTO', section: 'T. ALVA' },
  { grade: 'CUARTO', section: 'F. GAUSS' },
  // 5to de Secundaria
  { grade: 'QUINTO', section: 'SÓCRATES' },
  { grade: 'QUINTO', section: 'T. MILETO' },
  { grade: 'QUINTO', section: 'PLATÓN' },
  { grade: 'QUINTO', section: 'ARISTÓTELES' },
  { grade: 'QUINTO', section: 'PITÁGORAS' },
  { grade: 'QUINTO', section: 'I. KANT' }
];

const conLimiteDeTiempo = (promesa, ms = 2500) => {
  return Promise.race([
    promesa,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_CONEXION')), ms))
  ]);
};

const cargarLibreriaExcel = () => {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('No se pudo cargar el procesador de Excel'));
    document.head.appendChild(script);
  });
};

export default function App() {
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // RED Y COLA OFFLINE
  const [estaEnLinea, setEstaEnLinea] = useState(navigator.onLine);
  const [colaPendientes, setColaPendientes] = useState(() => {
    try {
      const local = localStorage.getItem('dh_cola_offline_v22');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const [sincronizando, setSincronizando] = useState(false);
  const [avisoSync, setAvisoSync] = useState('');

  const sincronizarColaConSupabase = useCallback(async () => {
    let colaActual = [];
    try {
      colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v22') || '[]');
    } catch {
      colaActual = [];
    }

    if (colaActual.length === 0) return;

    setSincronizando(true);
    let subidosConExito = 0;
    const fallidos = [];

    for (const item of colaActual) {
      try {
        if (item.tipo === 'aula') {
          await conLimiteDeTiempo(
            supabase.from('asistencias').delete().eq('fecha', item.fecha).eq('seccion', item.seccion),
            3000
          );
          const { error } = await conLimiteDeTiempo(
            supabase.from('asistencias').insert(item.filas),
            3000
          );
          if (error) throw error;
        } else if (item.tipo === 'alumno_individual') {
          await conLimiteDeTiempo(
            supabase.from('asistencias').delete().eq('fecha', item.fecha).eq('estudiante_id', item.estudiante_id),
            3000
          );
          const { error } = await conLimiteDeTiempo(
            supabase.from('asistencias').insert(item.filas),
            3000
          );
          if (error) throw error;
        }
        subidosConExito++;
      } catch (err) {
        fallidos.push(item);
      }
    }

    setColaPendientes(fallidos);
    localStorage.setItem('dh_cola_offline_v22', JSON.stringify(fallidos));
    setSincronizando(false);

    if (subidosConExito > 0) {
      setAvisoSync(`¡Conexión restaurada! Se sincronizaron ${subidosConExito} registro(s) con la nube.`);
      setTimeout(() => setAvisoSync(''), 4500);
    }
  }, []);

  useEffect(() => {
    const alVolverInternet = () => {
      setEstaEnLinea(true);
      sincronizarColaConSupabase();
    };
    const alPerderInternet = () => setEstaEnLinea(false);

    window.addEventListener('online', alVolverInternet);
    window.addEventListener('offline', alPerderInternet);

    return () => {
      window.removeEventListener('online', alVolverInternet);
      window.removeEventListener('offline', alPerderInternet);
    };
  }, [sincronizarColaConSupabase]);

  // USUARIOS
  const [usuarios, setUsuarios] = useState(() => {
    try {
      const local = localStorage.getItem('dh_usuarios_v22');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  // ESTUDIANTES
  const [estudiantes, setEstudiantes] = useState(() => {
    try {
      const local = localStorage.getItem('dh_estudiantes_v22');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  // ASISTENCIAS
  const [asistencias, setAsistencias] = useState(() => {
    try {
      const local = localStorage.getItem('dh_asistencias_v22');
      return local ? JSON.parse(local) : {};
    } catch {
      return {};
    }
  });

  // CARGA INICIAL
  useEffect(() => {
    let montado = true;

    const iniciarApp = async () => {
      try {
        if (navigator.onLine) {
          const resUser = await conLimiteDeTiempo(supabase.from('usuarios').select('*'), 2000).catch(() => null);
          if (resUser && !resUser.error && resUser.data && resUser.data.length > 0 && montado) {
            const formateados = resUser.data.map(u => ({
              id: u.id,
              usuario: u.usuario,
              clave: u.clave,
              rol: u.rol,
              nombre: u.nombre,
              aulasAsignadas: u.aulas_asignadas || []
            }));
            setUsuarios(formateados);
            localStorage.setItem('dh_usuarios_v22', JSON.stringify(formateados));
          }

          const resEst = await conLimiteDeTiempo(supabase.from('estudiantes').select('*'), 2000).catch(() => null);
          if (resEst && !resEst.error && resEst.data && resEst.data.length > 0 && montado) {
            setEstudiantes(resEst.data);
            localStorage.setItem('dh_estudiantes_v22', JSON.stringify(resEst.data));
          }

          const resAsis = await conLimiteDeTiempo(supabase.from('asistencias').select('*'), 2000).catch(() => null);
          if (resAsis && !resAsis.error && resAsis.data && resAsis.data.length > 0 && montado) {
            const agrupadas = {};
            resAsis.data.forEach(reg => {
              if (!agrupadas[reg.fecha]) agrupadas[reg.fecha] = {};
              agrupadas[reg.fecha][reg.estudiante_id] = {
                status: reg.estado,
                time: reg.created_at ? new Date(reg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00'
              };
            });
            setAsistencias(prev => ({ ...prev, ...agrupadas }));
            localStorage.setItem('dh_asistencias_v22', JSON.stringify(agrupadas));
          }
        }
      } catch (e) {
        console.warn('Iniciando en modo local/offline.');
      } finally {
        if (montado) setCargandoInicial(false);
      }
    };

    iniciarApp();
    return () => { montado = false; };
  }, []);

  const existeDirector = useMemo(() => {
    return usuarios.some(u => u.rol === 'director');
  }, [usuarios]);

  // REGISTRO INICIAL DIRECTOR
  const [primerNombreDirector, setPrimerNombreDirector] = useState('');
  const [primerUserDirector, setPrimerUserDirector] = useState('');
  const [primerClaveDirector, setPrimerClaveDirector] = useState('');
  const [primerClaveConfirm, setPrimerClaveConfirm] = useState('');
  const [errorPrimerRegistro, setErrorPrimerRegistro] = useState('');
  const [guardandoDirector, setGuardandoDirector] = useState(false);

  const registrarPrimerDirector = async (e) => {
    e.preventDefault();
    if (!primerNombreDirector.trim() || !primerUserDirector.trim() || !primerClaveDirector) return;

    if (primerClaveDirector !== primerClaveConfirm) {
      setErrorPrimerRegistro('Las contraseñas no coinciden.');
      return;
    }

    setGuardandoDirector(true);
    const directorNuevo = {
      id: 'dir_master',
      usuario: primerUserDirector.trim().toLowerCase(),
      clave: primerClaveDirector,
      rol: 'director',
      nombre: primerNombreDirector.trim(),
      aulasAsignadas: []
    };

    setUsuarios([directorNuevo]);
    setUsuarioAutenticado(directorNuevo);
    localStorage.setItem('dh_usuarios_v22', JSON.stringify([directorNuevo]));
    localStorage.setItem('dh_sesion_v22', JSON.stringify(directorNuevo));

    try {
      await conLimiteDeTiempo(
        supabase.from('usuarios').upsert([{
          id: directorNuevo.id,
          usuario: directorNuevo.usuario,
          clave: directorNuevo.clave,
          rol: directorNuevo.rol,
          nombre: directorNuevo.nombre,
          aulas_asignadas: []
        }]),
        3000
      );
    } catch (err) {
      console.warn('Director guardado en memoria.');
    } finally {
      setGuardandoDirector(false);
    }
  };

  // SESIÓN
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => {
    try {
      const sesion = localStorage.getItem('dh_sesion_v22');
      return sesion ? JSON.parse(sesion) : null;
    } catch {
      return null;
    }
  });

  const [inputUsuario, setInputUsuario] = useState('');
  const [inputClave, setInputClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');

  const [fechaHoy, setFechaHoy] = useState(new Date().toISOString().split('T')[0]);

  // NAVEGACIÓN PRINCIPAL
  const [vistaDirector, setVistaDirector] = useState('asistencia'); // 'asistencia', 'reportes', 'gestion'
  const [subPestanaGestion, setSubPestanaGestion] = useState('personal'); // 'personal', 'estudiantes'
  const [subVistaAuxiliar, setSubVistaAuxiliar] = useState('salones'); // 'salones', 'puerta'

  const handleLogin = (e) => {
    e.preventDefault();
    const encontrado = usuarios.find(
      u => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.clave === inputClave
    );

    if (encontrado) {
      setUsuarioAutenticado(encontrado);
      if (recordarSesion) {
        localStorage.setItem('dh_sesion_v22', JSON.stringify(encontrado));
      }
      setErrorLogin('');
      setInputClave('');
    } else {
      setErrorLogin('Credenciales inválidas. Verifique su usuario o contraseña.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Desea cerrar la sesión actual?')) {
      setUsuarioAutenticado(null);
      localStorage.removeItem('dh_sesion_v22');
    }
  };

  const esDirector = usuarioAutenticado?.rol === 'director';
  const esAuxiliar = usuarioAutenticado?.rol === 'auxiliar';
  const esDocente = usuarioAutenticado?.rol === 'docente';

  const todasLasAulasColegio = useMemo(() => {
    const mapa = new Map();
    AULAS_OFICIALES_DH.forEach(a => mapa.set(`${a.grade}|${a.section}`, a));
    estudiantes.forEach(e => {
      const clave = `${e.grade}|${e.section}`;
      if (!mapa.has(clave)) {
        mapa.set(clave, { grade: e.grade, section: e.section });
      }
    });
    return Array.from(mapa.values());
  }, [estudiantes]);

  const aulasPermitidasUsuario = useMemo(() => {
    if (esDirector) return todasLasAulasColegio;
    return usuarioAutenticado?.aulasAsignadas && usuarioAutenticado.aulasAsignadas.length > 0
      ? usuarioAutenticado.aulasAsignadas
      : (todasLasAulasColegio.length > 0 ? [todasLasAulasColegio[0]] : []);
  }, [esDirector, todasLasAulasColegio, usuarioAutenticado]);

  const [gradoSel, setGradoSel] = useState('');
  const [seccionSel, setSeccionSel] = useState('');

  useEffect(() => {
    if (aulasPermitidasUsuario.length > 0) {
      const existe = aulasPermitidasUsuario.some(a => a.grade === gradoSel && a.section === seccionSel);
      if (!existe) {
        setGradoSel(aulasPermitidasUsuario[0].grade);
        setSeccionSel(aulasPermitidasUsuario[0].section);
      }
    }
  }, [aulasPermitidasUsuario, gradoSel, seccionSel]);

  const alumnosAula = useMemo(() => {
    if (!gradoSel || !seccionSel) return [];
    return estudiantes.filter(e => e.grade === gradoSel && e.section === seccionSel);
  }, [estudiantes, gradoSel, seccionSel]);

  const [asistenciaAula, setAsistenciaAula] = useState({});
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState('');

  useEffect(() => {
    const diaActual = asistencias[fechaHoy] || {};
    const inicial = {};
    alumnosAula.forEach(e => {
      inicial[e.id] = diaActual[e.id]?.status || 'P';
    });
    setAsistenciaAula(inicial);
  }, [alumnosAula, fechaHoy, asistencias]);

  // CAMBIO DIRECTO DE ESTADO
  const cambiarEstadoAlumno = (alumnoId, nuevoEstado) => {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAsistencias(prev => {
      const dia = { ...(prev[fechaHoy] || {}) };
      dia[alumnoId] = { status: nuevoEstado, time: hora };
      const res = { ...prev, [fechaHoy]: dia };
      localStorage.setItem('dh_asistencias_v22', JSON.stringify(res));
      return res;
    });

    setAsistenciaAula(prev => ({ ...prev, [alumnoId]: nuevoEstado }));

    const alum = estudiantes.find(e => String(e.id) === String(alumnoId));
    if (!alum) return;

    const fila = [{
      fecha: fechaHoy,
      estudiante_id: String(alumnoId),
      estudiante_nombre: alum.name,
      seccion: `${alum.grade} - ${alum.section}`,
      estado: nuevoEstado,
      registrado_por: usuarioAutenticado?.nombre || 'Director/Auxiliar'
    }];

    const paquete = {
      id: `ind_${Date.now()}_${alumnoId}`,
      tipo: 'alumno_individual',
      fecha: fechaHoy,
      estudiante_id: String(alumnoId),
      filas: fila
    };

    if (!navigator.onLine) {
      let colaActual = [];
      try { colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v22') || '[]'); } catch {}
      const nuevaCola = [...colaActual.filter(p => !(p.fecha === fechaHoy && p.estudiante_id === String(alumnoId))), paquete];
      setColaPendientes(nuevaCola);
      localStorage.setItem('dh_cola_offline_v22', JSON.stringify(nuevaCola));
      return;
    }

    conLimiteDeTiempo(
      supabase.from('asistencias').delete().eq('fecha', fechaHoy).eq('estudiante_id', String(alumnoId)),
      2000
    ).then(() => {
      return conLimiteDeTiempo(supabase.from('asistencias').insert(fila), 2000);
    }).catch(() => {
      let colaActual = [];
      try { colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v22') || '[]'); } catch {}
      const nuevaCola = [...colaActual.filter(p => !(p.fecha === fechaHoy && p.estudiante_id === String(alumnoId))), paquete];
      setColaPendientes(nuevaCola);
      localStorage.setItem('dh_cola_offline_v22', JSON.stringify(nuevaCola));
    });
  };

  const alternarEstadoAlumno = (id) => {
    const actual = asistenciaAula[id] || 'P';
    const siguiente = 
      actual === 'P' ? 'T' :
      actual === 'T' ? 'F' :
      actual === 'F' ? 'E' :
      actual === 'E' ? 'J' : 'P';
    cambiarEstadoAlumno(id, siguiente);
  };

  const guardarAsistenciaAula = async () => {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const seccionCompleta = `${gradoSel} - ${seccionSel}`;

    const nuevoDia = { ...(asistencias[fechaHoy] || {}) };
    Object.keys(asistenciaAula).forEach(id => {
      nuevoDia[id] = { status: asistenciaAula[id], time: hora };
    });
    const asistenciasActualizadas = { ...asistencias, [fechaHoy]: nuevoDia };
    setAsistencias(asistenciasActualizadas);
    localStorage.setItem('dh_asistencias_v22', JSON.stringify(asistenciasActualizadas));

    const filas = alumnosAula.map(alumno => ({
      fecha: fechaHoy,
      estudiante_id: String(alumno.id),
      estudiante_nombre: alumno.name,
      seccion: seccionCompleta,
      estado: asistenciaAula[alumno.id] || 'P',
      registrado_por: usuarioAutenticado?.nombre || 'Docente/Auxiliar'
    }));

    const paquete = {
      id: `aula_${Date.now()}`,
      tipo: 'aula',
      fecha: fechaHoy,
      seccion: seccionCompleta,
      filas: filas
    };

    const guardarEnColaLocal = () => {
      let colaActual = [];
      try { colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v22') || '[]'); } catch {}
      const nuevaCola = [...colaActual.filter(p => !(p.tipo === 'aula' && p.fecha === fechaHoy && p.seccion === seccionCompleta)), paquete];
      setColaPendientes(nuevaCola);
      localStorage.setItem('dh_cola_offline_v22', JSON.stringify(nuevaCola));

      setMensajeGuardado('¡Guardado en el Teléfono! 📱 (Sin señal)');
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
    };

    if (!navigator.onLine) {
      guardarEnColaLocal();
      return;
    }

    try {
      await conLimiteDeTiempo(
        supabase.from('asistencias').delete().eq('fecha', fechaHoy).eq('seccion', seccionCompleta),
        2500
      );
      const { error } = await conLimiteDeTiempo(
        supabase.from('asistencias').insert(filas),
        2500
      );
      if (error) throw error;

      let colaActual = [];
      try { colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v22') || '[]'); } catch {}
      const nuevaCola = colaActual.filter(p => !(p.tipo === 'aula' && p.fecha === fechaHoy && p.seccion === seccionCompleta));
      setColaPendientes(nuevaCola);
      localStorage.setItem('dh_cola_offline_v22', JSON.stringify(nuevaCola));

      setMensajeGuardado('¡Guardado en la Nube! ☁️');
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 2500);
    } catch (err) {
      guardarEnColaLocal();
    }
  };

  // BUSCADOR UNIVERSAL
  const [busquedaUniversal, setBusquedaUniversal] = useState('');
  
  const estudiantesFiltradosBuscador = useMemo(() => {
    if (!busquedaUniversal.trim()) return [];
    const t = busquedaUniversal.toUpperCase().trim();
    return estudiantes.filter(e => 
      e.name.includes(t) || 
      (e.dni && e.dni.includes(t)) ||
      e.grade.includes(t) ||
      e.section.includes(t)
    ).slice(0, 10);
  }, [busquedaUniversal, estudiantes]);

  // MÉTRICAS
  const metricasDirector = useMemo(() => {
    const dia = asistencias[fechaHoy] || {};
    let faltasHoy = 0;
    let tardanzasHoy = 0;
    let presentesHoy = 0;
    let evasionesHoy = 0;
    let permisosHoy = 0;

    estudiantes.forEach(e => {
      const st = dia[e.id]?.status || 'P';
      if (st === 'F') faltasHoy++;
      else if (st === 'T') tardanzasHoy++;
      else if (st === 'E') evasionesHoy++;
      else if (st === 'J') permisosHoy++;
      else presentesHoy++;
    });

    const faltaronHoyLista = estudiantes.filter(e => dia[e.id]?.status === 'F');
    const evadieronHoyLista = estudiantes.filter(e => dia[e.id]?.status === 'E');
    const permisoHoyLista = estudiantes.filter(e => dia[e.id]?.status === 'J');

    return { faltasHoy, tardanzasHoy, presentesHoy, evasionesHoy, permisosHoy, faltaronHoyLista, evadieronHoyLista, permisoHoyLista };
  }, [asistencias, estudiantes, fechaHoy]);

  // REPORTES EXCEL
  const [tipoPeriodoReporte, setTipoPeriodoReporte] = useState('dia');
  const [alcanceReporte, setAlcanceReporte] = useState('todos');
  const [filtroGradoReporte, setFiltroGradoReporte] = useState('PRIMERO');
  const [filtroSeccionReporte, setFiltroSeccionReporte] = useState('RESPONSABILIDAD');

  const obtenerDiasSemana = (fechaStr) => {
    const d = new Date(fechaStr + 'T00:00:00');
    const diaSem = d.getDay();
    const diffALunes = diaSem === 0 ? -6 : 1 - diaSem;
    const lunes = new Date(d);
    lunes.setDate(d.getDate() + diffALunes);
    
    const dias = [];
    for (let i = 0; i < 5; i++) {
      const temp = new Date(lunes);
      temp.setDate(lunes.getDate() + i);
      dias.push(temp.toISOString().split('T')[0]);
    }
    return dias;
  };

  const obtenerDiasMes = (fechaStr) => {
    const [anioStr, mesStr] = fechaStr.split('-');
    const anio = parseInt(anioStr, 10);
    const mes = parseInt(mesStr, 10);
    const totalDias = new Date(anio, mes, 0).getDate();
    const diasHabiles = [];

    for (let d = 1; d <= totalDias; d++) {
      const f = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dt = new Date(f + 'T00:00:00');
      if (dt.getDay() >= 1 && dt.getDay() <= 5) {
        diasHabiles.push(f);
      }
    }
    return diasHabiles;
  };

  const generarReporteExcelAvanzado = async () => {
    if (estudiantes.length === 0) {
      alert('El padrón escolar no tiene alumnos registrados.');
      return;
    }

    try {
      const XLSX = await cargarLibreriaExcel();
      const wb = XLSX.utils.book_new();

      let listaExportar = estudiantes;
      let tituloAlcance = 'GENERAL - TODOS LOS GRADOS';

      if (alcanceReporte === 'grado') {
        listaExportar = estudiantes.filter(e => e.grade === filtroGradoReporte);
        tituloAlcance = `GRADO: ${filtroGradoReporte}`;
      } else if (alcanceReporte === 'aula') {
        listaExportar = estudiantes.filter(e => e.grade === filtroGradoReporte && e.section === filtroSeccionReporte);
        tituloAlcance = `AULA: ${filtroGradoReporte} - ${filtroSeccionReporte}`;
      }

      listaExportar.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
        if (a.section !== b.section) return a.section.localeCompare(b.section);
        return a.name.localeCompare(b.name);
      });

      let datos = [];
      let nombreArchivo = '';
      let anchosCols = [];

      if (tipoPeriodoReporte === 'dia') {
        nombreArchivo = `Asistencia_Diaria_${fechaHoy}_${alcanceReporte.toUpperCase()}.xlsx`;
        datos.push(['REPORTE DIARIO DE ASISTENCIA ESCOLAR']);
        datos.push(['Institución:', 'I.E.E. DANIEL HERNÁNDEZ']);
        datos.push(['Fecha:', fechaHoy]);
        datos.push(['Alcance:', tituloAlcance]);
        datos.push(['Total Alumnos:', listaExportar.length]);
        datos.push([]);
        datos.push(['N°', 'DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCIÓN', 'ESTADO', 'HORA REGISTRO', 'CELULAR APODERADO']);

        const diaActual = asistencias[fechaHoy] || {};
        listaExportar.forEach((alumno, i) => {
          const st = diaActual[alumno.id]?.status || 'P';
          const hora = diaActual[alumno.id]?.time || '--:--';
          const estadoDesc = 
            st === 'P' ? 'PRESENTE' : 
            st === 'T' ? 'TARDANZA' : 
            st === 'F' ? 'FALTA' : 
            st === 'E' ? 'EVASIÓN' : 'PERMISO (J)';
          datos.push([i + 1, alumno.dni || 'S/D', alumno.name, alumno.grade, alumno.section, estadoDesc, hora, alumno.phone || '']);
        });

        anchosCols = [{ wch: 6 }, { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 25 }, { wch: 16 }, { wch: 15 }, { wch: 18 }];

      } else if (tipoPeriodoReporte === 'semana') {
        const diasSemana = obtenerDiasSemana(fechaHoy);
        const nombresDias = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];
        nombreArchivo = `Asistencia_Semanal_${diasSemana[0]}_al_${diasSemana[4]}_${alcanceReporte.toUpperCase()}.xlsx`;

        datos.push(['CONSOLIDADO SEMANAL DE ASISTENCIA']);
        datos.push(['Institución:', 'I.E.E. DANIEL HERNÁNDEZ']);
        datos.push(['Semana Lectiva:', `Del ${diasSemana[0]} al ${diasSemana[4]}`]);
        datos.push(['Alcance:', tituloAlcance]);
        datos.push([]);

        const filaEncabezados = ['N°', 'DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCIÓN'];
        diasSemana.forEach((d, idx) => filaEncabezados.push(`${nombresDias[idx]} (${d.slice(5)})`));
        filaEncabezados.push('TOTAL P', 'TOTAL T', 'TOTAL F', 'EVASIONES', 'PERMISOS (J)', '% ASISTENCIA', 'CELULAR');
        datos.push(filaEncabezados);

        listaExportar.forEach((alumno, i) => {
          let countP = 0, countT = 0, countF = 0, countE = 0, countJ = 0;
          const filaAlumno = [i + 1, alumno.dni || 'S/D', alumno.name, alumno.grade, alumno.section];

          diasSemana.forEach(d => {
            const estado = asistencias[d]?.[alumno.id]?.status || '-';
            filaAlumno.push(estado);
            if (estado === 'P') countP++;
            else if (estado === 'T') countT++;
            else if (estado === 'F') countF++;
            else if (estado === 'E') countE++;
            else if (estado === 'J') countJ++;
          });

          const totalRegistrados = countP + countT + countF + countE + countJ;
          const porcentaje = totalRegistrados > 0 ? Math.round(((countP + countT + countJ) / totalRegistrados) * 100) : 100;
          filaAlumno.push(countP, countT, countF, countE, countJ, `${porcentaje}%`, alumno.phone || '');
          datos.push(filaAlumno);
        });

        anchosCols = [
          { wch: 6 }, { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 22 },
          { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
          { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 15 }, { wch: 16 }
        ];

      } else if (tipoPeriodoReporte === 'mes') {
        const mesActual = fechaHoy.slice(0, 7);
        const diasHabilesMes = obtenerDiasMes(fechaHoy);
        nombreArchivo = `Consolidado_Mensual_${mesActual}_${alcanceReporte.toUpperCase()}.xlsx`;

        datos.push(['REGISTRO CONSOLIDADO MENSUAL DE ASISTENCIA']);
        datos.push(['Institución:', 'I.E.E. DANIEL HERNÁNDEZ']);
        datos.push(['Mes de Evaluación:', mesActual]);
        datos.push(['Días Hábiles:', diasHabilesMes.length]);
        datos.push(['Alcance:', tituloAlcance]);
        datos.push([]);

        datos.push(['N°', 'DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCIÓN', 'PUNTUALES (P)', 'TARDANZAS (T)', 'FALTAS (F)', 'EVASIONES (E)', 'PERMISOS (J)', 'TOTAL REGISTROS', '% ASISTENCIA', 'CONDICIÓN', 'CELULAR APODERADO']);

        listaExportar.forEach((alumno, i) => {
          let countP = 0, countT = 0, countF = 0, countE = 0, countJ = 0;
          diasHabilesMes.forEach(d => {
            const st = asistencias[d]?.[alumno.id]?.status;
            if (st === 'P') countP++;
            else if (st === 'T') countT++;
            else if (st === 'F') countF++;
            else if (st === 'E') countE++;
            else if (st === 'J') countJ++;
          });

          const totalRegistrados = countP + countT + countF + countE + countJ;
          const porcentaje = totalRegistrados > 0 ? Math.round(((countP + countT + countJ) / totalRegistrados) * 100) : 100;
          const condicion = (countE >= 1 || countT >= 3 || countF >= 3) ? 'EN RIESGO DISCIPLINARIO' : 'REGULAR';

          datos.push([i + 1, alumno.dni || 'S/D', alumno.name, alumno.grade, alumno.section, countP, countT, countF, countE, countJ, totalRegistrados, `${porcentaje}%`, condicion, alumno.phone || '']);
        });

        anchosCols = [
          { wch: 6 }, { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 22 },
          { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 15 }, { wch: 15 },
          { wch: 26 }, { wch: 18 }
        ];
      }

      const ws = XLSX.utils.aoa_to_sheet(datos);
      ws['!cols'] = anchosCols;
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
      XLSX.writeFile(wb, nombreArchivo);

    } catch (err) {
      alert('Error al generar Excel: ' + err.message);
    }
  };

  const enviarWhatsApp = (alumno, tipoAlerta) => {
    let mensaje = '';
    if (tipoAlerta === 'evasion') {
      mensaje = `ALERTA URGENTE DE EVASIÓN: Estimado(a) apoderado de *${alumno.name}* (${alumno.grade} - ${alumno.section}): La Dirección de la I.E.E. Daniel Hernández le informa con carácter de urgencia que el menor ingresó a la institución pero ha EVADIDO clases / se encuentra no habido en este momento. Rogamos comunicarse inmediatamente con el colegio.`;
    } else if (tipoAlerta === 'permiso') {
      mensaje = `CONSTANCIA DE PERMISO: Estimado(a) apoderado de *${alumno.name}* (${alumno.grade} - ${alumno.section}). Se deja constancia de que el estudiante cuenta con permiso justificado / papeleta de salida autorizada el día de hoy ${fechaHoy}.`;
    } else if (tipoAlerta === 'falta_hoy') {
      mensaje = `Estimado(a) apoderado de *${alumno.name}* (${alumno.grade} - ${alumno.section}): Le saluda la I.E.E. Daniel Hernández. Le informamos que el día de hoy ${fechaHoy} el estudiante no se ha presentado al colegio. Por favor comunicarse para justificar su inasistencia. Gracias.`;
    } else {
      mensaje = `CITACIÓN FORMAL: Estimado(a) apoderado de *${alumno.name}* (${alumno.grade} - ${alumno.section}). La I.E.E. Daniel Hernández le notifica que su menor hijo(a) registra a la fecha incidencias disciplinarias acumuladas en el mes. Solicitamos su presencia en la Dirección para coordinar su situación escolar.`;
    }
    const url = `https://wa.me/51${alumno.phone}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // =========================================================================
  // GESTIÓN DE PERSONAL (CREAR, EDITAR Y ELIMINAR)
  // =========================================================================
  const [nuevoRolPersonal, setNuevoRolPersonal] = useState('docente');
  const [nuevoNombreDocente, setNuevoNombreDocente] = useState('');
  const [nuevoUserDocente, setNuevoUserDocente] = useState('');
  const [nuevaClaveDocente, setNuevaClaveDocente] = useState('');
  const [aulasSeleccionadasNuevas, setAulasSeleccionadasNuevas] = useState([]);
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  const alternarSeleccionAula = (claveAula) => {
    setAulasSeleccionadasNuevas(prev => 
      prev.includes(claveAula) ? prev.filter(c => c !== claveAula) : [...prev, claveAula]
    );
  };

  const alternarGradoCompleto = (gradoNombre) => {
    const aulasDelGrado = todasLasAulasColegio.filter(a => a.grade === gradoNombre).map(a => `${a.grade}|${a.section}`);
    const todasMarcadas = aulasDelGrado.every(c => aulasSeleccionadasNuevas.includes(c));

    if (todasMarcadas) {
      setAulasSeleccionadasNuevas(prev => prev.filter(c => !aulasDelGrado.includes(c)));
    } else {
      setAulasSeleccionadasNuevas(prev => Array.from(new Set([...prev, ...aulasDelGrado])));
    }
  };

  const registrarPersonal = async (e) => {
    e.preventDefault();
    if (!nuevoNombreDocente || !nuevoUserDocente || !nuevaClaveDocente) return;

    if (usuarios.some(u => u.usuario.toLowerCase() === nuevoUserDocente.trim().toLowerCase())) {
      setMensajeAdmin('⚠️ Ese nombre de usuario ya está en uso.');
      return;
    }

    if (aulasSeleccionadasNuevas.length === 0) {
      setMensajeAdmin('⚠️ Debe marcar al menos un grado o sección para este personal.');
      return;
    }

    const aulasAsignadas = aulasSeleccionadasNuevas.map(clave => {
      const [grade, section] = clave.split('|');
      return { grade, section };
    });

    const nuevo = {
      id: `usr_${Date.now()}`,
      usuario: nuevoUserDocente.trim().toLowerCase(),
      clave: nuevaClaveDocente.trim(),
      rol: nuevoRolPersonal,
      nombre: nuevoNombreDocente.trim(),
      aulasAsignadas: aulasAsignadas
    };

    const nuevosUsuarios = [...usuarios, nuevo];
    setUsuarios(nuevosUsuarios);
    localStorage.setItem('dh_usuarios_v22', JSON.stringify(nuevosUsuarios));

    setNuevoNombreDocente('');
    setNuevoUserDocente('');
    setNuevaClaveDocente('');
    setAulasSeleccionadasNuevas([]);
    setMensajeAdmin(`✅ ${nuevoRolPersonal === 'docente' ? 'Docente' : 'Auxiliar'} registrado exitosamente.`);
    setTimeout(() => setMensajeAdmin(''), 3500);

    try {
      await conLimiteDeTiempo(
        supabase.from('usuarios').upsert([{
          id: nuevo.id,
          usuario: nuevo.usuario,
          clave: nuevo.clave,
          rol: nuevo.rol,
          nombre: nuevo.nombre,
          aulas_asignadas: nuevo.aulasAsignadas
        }]),
        3000
      );
    } catch (err) {
      console.warn('Usuario guardado en memoria.');
    }
  };

  const eliminarDocente = async (id) => {
    if (window.confirm('¿Desea revocar el acceso a este usuario?')) {
      const restantes = usuarios.filter(u => u.id !== id);
      setUsuarios(restantes);
      localStorage.setItem('dh_usuarios_v22', JSON.stringify(restantes));
      try {
        await supabase.from('usuarios').delete().eq('id', id);
      } catch (e) {}
    }
  };

  // MODAL EDICIÓN PERSONAL
  const [personalEditando, setPersonalEditando] = useState(null);
  const [editNombrePersonal, setEditNombrePersonal] = useState('');
  const [editUserPersonal, setEditUserPersonal] = useState('');
  const [editClavePersonal, setEditClavePersonal] = useState('');
  const [editRolPersonal, setEditRolPersonal] = useState('docente');
  const [editAulasPersonal, setEditAulasPersonal] = useState([]);

  const abrirModalEditarPersonal = (p) => {
    setPersonalEditando(p);
    setEditNombrePersonal(p.nombre);
    setEditUserPersonal(p.usuario);
    setEditClavePersonal(p.clave);
    setEditRolPersonal(p.rol);
    setEditAulasPersonal((p.aulasAsignadas || []).map(a => `${a.grade}|${a.section}`));
  };

  const alternarSeleccionAulaEdicion = (claveAula) => {
    setEditAulasPersonal(prev => 
      prev.includes(claveAula) ? prev.filter(c => c !== claveAula) : [...prev, claveAula]
    );
  };

  const alternarGradoCompletoEdicion = (gradoNombre) => {
    const aulasDelGrado = todasLasAulasColegio.filter(a => a.grade === gradoNombre).map(a => `${a.grade}|${a.section}`);
    const todasMarcadas = aulasDelGrado.every(c => editAulasPersonal.includes(c));

    if (todasMarcadas) {
      setEditAulasPersonal(prev => prev.filter(c => !aulasDelGrado.includes(c)));
    } else {
      setEditAulasPersonal(prev => Array.from(new Set([...prev, ...aulasDelGrado])));
    }
  };

  const guardarEdicionPersonal = async (e) => {
    e.preventDefault();
    if (!personalEditando) return;

    const aulasFormateadas = editAulasPersonal.map(clave => {
      const [grade, section] = clave.split('|');
      return { grade, section };
    });

    const personalActualizado = {
      ...personalEditando,
      nombre: editNombrePersonal.trim(),
      usuario: editUserPersonal.trim().toLowerCase(),
      clave: editClavePersonal.trim(),
      rol: editRolPersonal,
      aulasAsignadas: aulasFormateadas
    };

    const nuevosUsuarios = usuarios.map(u => u.id === personalEditando.id ? personalActualizado : u);
    setUsuarios(nuevosUsuarios);
    localStorage.setItem('dh_usuarios_v22', JSON.stringify(nuevosUsuarios));

    try {
      await supabase.from('usuarios').update({
        nombre: personalActualizado.nombre,
        usuario: personalActualizado.usuario,
        clave: personalActualizado.clave,
        rol: personalActualizado.rol,
        aulas_asignadas: personalActualizado.aulasAsignadas
      }).eq('id', personalEditando.id);

      setMensajeAdmin('✅ Datos del personal actualizados en la nube.');
      setTimeout(() => setMensajeAdmin(''), 3000);
    } catch (err) {
      setMensajeAdmin('✅ Guardado en memoria.');
      setTimeout(() => setMensajeAdmin(''), 3000);
    }

    setPersonalEditando(null);
  };

  // =========================================================================
  // GESTIÓN DE ESTUDIANTES (MATRICULAR, SUBIR EXCEL, EDITAR Y RETIRAR)
  // =========================================================================
  const [nuevoDniAlumno, setNuevoDniAlumno] = useState('');
  const [nuevoNombreAlumno, setNuevoNombreAlumno] = useState('');
  const [nuevoGradoAlumno, setNuevoGradoAlumno] = useState('PRIMERO');
  const [nuevaSeccionAlumno, setNuevaSeccionAlumno] = useState('RESPONSABILIDAD');
  const [nuevoCelularAlumno, setNuevoCelularAlumno] = useState('');
  const [busquedaPadron, setBusquedaPadron] = useState('');

  const registrarAlumnoNuevo = async (e) => {
    e.preventDefault();
    if (!nuevoNombreAlumno.trim()) return;

    const nuevo = {
      id: `est_${nuevoDniAlumno.trim() || Date.now()}`,
      dni: nuevoDniAlumno.trim() || 'S/D',
      name: nuevoNombreAlumno.trim().toUpperCase(),
      grade: nuevoGradoAlumno,
      section: nuevaSeccionAlumno,
      phone: nuevoCelularAlumno.trim() || '999999999'
    };

    const listaActualizada = [...estudiantes, nuevo];
    setEstudiantes(listaActualizada);
    localStorage.setItem('dh_estudiantes_v22', JSON.stringify(listaActualizada));

    setNuevoDniAlumno('');
    setNuevoNombreAlumno('');
    setNuevoCelularAlumno('');
    setMensajeAdmin('✅ Estudiante matriculado correctamente.');
    setTimeout(() => setMensajeAdmin(''), 3000);

    try {
      await supabase.from('estudiantes').insert([nuevo]);
    } catch (err) {
      console.warn('Estudiante guardado localmente.');
    }
  };

  const retirarAlumno = async (id, nombre) => {
    if (window.confirm(`¿Confirmas el retiro o traslado del estudiante "${nombre}"?`)) {
      const restantes = estudiantes.filter(e => e.id !== id);
      setEstudiantes(restantes);
      localStorage.setItem('dh_estudiantes_v22', JSON.stringify(restantes));
      try {
        await supabase.from('estudiantes').delete().eq('id', id);
      } catch (e) {}
    }
  };

  // MODAL EDICIÓN ESTUDIANTE
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [editDni, setEditDni] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editGrado, setEditGrado] = useState('PRIMERO');
  const [editSeccion, setEditSeccion] = useState('');
  const [editTelefono, setEditTelefono] = useState('');

  const abrirModalEditarAlumno = (alumno) => {
    setAlumnoEditando(alumno);
    setEditDni(alumno.dni === '1' || alumno.dni === 'S/D' ? '' : alumno.dni);
    setEditNombre(alumno.name);
    setEditGrado(alumno.grade);
    setEditSeccion(alumno.section);
    setEditTelefono(alumno.phone || '');
  };

  const guardarEdicionCompletaAlumno = async (e) => {
    e.preventDefault();
    if (!alumnoEditando) return;

    const estudianteActualizado = {
      ...alumnoEditando,
      dni: editDni.trim() || 'S/D',
      name: editNombre.trim().toUpperCase(),
      grade: editGrado.trim().toUpperCase(),
      section: editSeccion.trim().toUpperCase(),
      phone: editTelefono.trim() || '999999999'
    };

    const estudiantesActualizados = estudiantes.map(a => a.id === alumnoEditando.id ? estudianteActualizado : a);
    setEstudiantes(estudiantesActualizados);
    localStorage.setItem('dh_estudiantes_v22', JSON.stringify(estudiantesActualizados));

    try {
      await supabase.from('estudiantes').update({
        dni: estudianteActualizado.dni,
        name: estudianteActualizado.name,
        grade: estudianteActualizado.grade,
        section: estudianteActualizado.section,
        phone: estudianteActualizado.phone
      }).eq('id', alumnoEditando.id);
      setMensajeAdmin('✅ Datos del estudiante actualizados.');
      setTimeout(() => setMensajeAdmin(''), 3000);
    } catch (err) {
      console.warn('Actualizado en memoria local.');
    }

    setAlumnoEditando(null);
  };

  const alumnosFiltradosPadron = useMemo(() => {
    if (!busquedaPadron.trim()) return estudiantes;
    const t = busquedaPadron.toUpperCase().trim();
    return estudiantes.filter(e => 
      e.name.includes(t) || 
      (e.dni && e.dni.includes(t)) || 
      e.grade.includes(t) || 
      e.section.includes(t)
    );
  }, [estudiantes, busquedaPadron]);

  // LECTOR SIAGIE Y EXCEL
  const procesarArchivoExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const XLSX = await cargarLibreriaExcel();
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const primeraHoja = workbook.SheetNames[0];
      const hoja = workbook.Sheets[primeraHoja];
      const filas = XLSX.utils.sheet_to_json(hoja, { header: 1 });

      if (filas.length <= 1) {
        alert('El archivo no contiene filas de estudiantes.');
        return;
      }

      let isSiagie = false;
      let filaEncabezados = -1;
      let colDni = -1, colApePat = -1, colApeMat = -1, colNombres = -1, colNombreUnico = -1;
      let colGrado = -1, colSeccion = -1, colTelefono = -1;

      for (let r = 0; r < Math.min(filas.length, 20); r++) {
        const row = (filas[r] || []).map(c => String(c || '').toUpperCase().trim());
        row.forEach((colText, idx) => {
          const clean = colText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (clean.includes('APELLIDO PATERNO')) { colApePat = idx; isSiagie = true; filaEncabezados = r; }
          if (clean.includes('APELLIDO MATERNO')) { colApeMat = idx; }
          if (clean === 'NOMBRES' || clean.includes('NOMBRE(S)')) { colNombres = idx; }
          if (clean.includes('NUMERO DE DOCUMENTO') || clean.includes('NRO DOCUMENTO') || clean.includes('N° DOCUMENTO')) { colDni = idx; }
          else if (colDni === -1 && (clean === 'DNI' || clean.includes('DOCUMENTO'))) { colDni = idx; }
          if (clean.includes('GRADO') || clean.includes('ANO')) { colGrado = idx; }
          if (clean.includes('SECCION') || clean.includes('AULA')) { colSeccion = idx; }
          if (clean.includes('TEL') || clean.includes('CEL') || clean.includes('APODERADO')) { colTelefono = idx; }
          if (!isSiagie && (clean.includes('APELLIDOS Y NOMBRES') || clean.includes('ESTUDIANTE') || clean.includes('ALUMNO'))) {
            colNombreUnico = idx;
            filaEncabezados = r;
          }
        });
        if (isSiagie && colApePat !== -1 && colNombres !== -1) break;
      }

      if (isSiagie && (colGrado === -1 || colSeccion === -1)) {
        for (let r = 0; r < filaEncabezados; r++) {
          const row = (filas[r] || []).map(c => String(c || '').toUpperCase().trim());
          row.forEach((colText, idx) => {
            const clean = colText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (clean.includes('GRADO')) colGrado = idx;
            if (clean.includes('SECCION')) colSeccion = idx;
          });
        }
      }

      const mapaSeccionesSIAGIE = {
        'RESPONSABILIDD': 'RESPONSABILIDAD',
        'DANIEL ALCIDES CARRION': 'D. A. CARRIÓN',
        'JOSE DE SAN MARTIN': 'SAN MARTÍN',
        'JOSE OLAYA': 'JOSÉ OLAYA',
        'FRANCISCO BOLOGNESI': 'F. BOLOGNESI',
        'ANDRES AVELINO CACERES': 'A. A. CÁCERES',
        'ABRAHAM VALDELOMAR': 'A. VALDELOMAR',
        'CIRO ALEGRIA': 'C. ALEGRÍA',
        'JOSE CARLOS MAREATEGUI': 'J. C. MARIÁTEGUI',
        'CESAR VALLEJO': 'C. VALLEJO',
        'RICARDO PALMA': 'R. PALMA',
        'MARIO VARGAS LLOSA': 'M. V. LLOSA',
        'NIKOLA TESLA': 'N. TESLA',
        'RENE DESCARTES': 'R. DESCARTES',
        'PIERRE DE FERMAT': 'P. FERMAT',
        'ISAAC NEWTON': 'I. NEWTON',
        'THOMAS ALVA EDISON': 'T. ALVA',
        'JHON CARL FRIEDRICH GAUSS': 'F. GAUSS',
        'SOCRATES': 'SÓCRATES',
        'TALES DE MILETO': 'T. MILETO',
        'PLATON': 'PLATÓN',
        'ARISTOTELES': 'ARISTÓTELES',
        'PITAGORAS': 'PITÁGORAS',
        'IMMANUEL KANT': 'I. KANT'
      };

      const inicio = filaEncabezados !== -1 ? filaEncabezados + 1 : 1;
      const cargados = [];

      for (let i = inicio; i < filas.length; i++) {
        const fila = filas[i];
        if (!fila || fila.length === 0) continue;

        let nombreCompleto = '';
        if (isSiagie && colApePat !== -1 && colNombres !== -1) {
          const pat = String(fila[colApePat] || '').trim().toUpperCase();
          const mat = colApeMat !== -1 ? String(fila[colApeMat] || '').trim().toUpperCase() : '';
          const nom = String(fila[colNombres] || '').trim().toUpperCase();
          nombreCompleto = `${pat} ${mat} ${nom}`.trim();
        } else if (colNombreUnico !== -1) {
          nombreCompleto = String(fila[colNombreUnico] || '').trim().toUpperCase();
        }

        if (!nombreCompleto) continue;

        let dniExtraido = colDni !== -1 ? String(fila[colDni] || '').replace(/\D/g, '').trim() : '';
        if (dniExtraido.length < 5) dniExtraido = 'S/D';

        let gradoVal = colGrado !== -1 ? String(fila[colGrado] || 'PRIMERO').trim().toUpperCase() : 'PRIMERO';
        let seccionRaw = colSeccion !== -1 ? String(fila[colSeccion] || 'RESPONSABILIDAD').trim().toUpperCase() : 'RESPONSABILIDAD';
        let seccionVal = mapaSeccionesSIAGIE[seccionRaw] || seccionRaw;

        cargados.push({
          id: `est_${dniExtraido !== 'S/D' ? dniExtraido : Date.now() + i}`,
          dni: dniExtraido,
          name: nombreCompleto,
          grade: gradoVal,
          section: seccionVal,
          phone: colTelefono !== -1 ? String(fila[colTelefono] || '999999999').trim() : '999999999'
        });
      }

      if (cargados.length > 0) {
        setEstudiantes(cargados);
        localStorage.setItem('dh_estudiantes_v22', JSON.stringify(cargados));

        try {
          await supabase.from('estudiantes').delete().neq('id', 'cero');
          const { error } = await supabase.from('estudiantes').insert(cargados);
          if (error) alert('Aviso Supabase: ' + error.message);
          else alert(`¡Éxito! Se cargaron ${cargados.length} estudiantes del SIAGIE.`);
        } catch (err) {
          console.warn('Estudiantes guardados en memoria del celular.');
        }
      } else {
        alert('No se detectaron estudiantes válidos. Verifique el archivo.');
      }
    } catch (err) {
      alert('Error al procesar el archivo Excel: ' + err.message);
    }
    e.target.value = '';
  };

  // =========================================================================
  // VISTAS
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-12">
      
      {/* COLA OFFLINE */}
      {colaPendientes.length > 0 && (
        <div className="bg-amber-600 text-white px-3 py-2 text-xs font-black flex items-center justify-between shadow sticky top-0 z-50 animate-pulse">
          <div className="flex items-center gap-1.5 truncate">
            <Smartphone className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="truncate">Tienes {colaPendientes.length} asistencia(s) en este teléfono</span>
          </div>
          <button
            onClick={sincronizarColaConSupabase}
            disabled={sincronizando}
            className="bg-white text-amber-900 px-3 py-1 rounded-lg text-xs font-black shrink-0 shadow flex items-center gap-1 active:scale-95 transition"
          >
            {sincronizando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-amber-700" />}
            <span>{sincronizando ? 'Subiendo...' : 'Subir Ahora ☁️'}</span>
          </button>
        </div>
      )}

      {avisoSync && (
        <div className="bg-emerald-600 text-white px-3 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm sticky top-0 z-40">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{avisoSync}</span>
        </div>
      )}

      {/* ENCABEZADO */}
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 bg-emerald-800 rounded-xl flex items-center justify-center shrink-0 border border-emerald-600">
                <School className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black tracking-tight leading-none truncate">I.E.E. Daniel Hernández</h1>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-200">
                  <UserCheck className="w-3 h-3 shrink-0" />
                  <span className="font-semibold truncate max-w-[130px] sm:max-w-[200px]">{usuarioAutenticado.nombre}</span>
                  <span className="bg-emerald-900/90 text-[9px] px-1.5 py-0.2 rounded font-black uppercase shrink-0">
                    {usuarioAutenticado.rol}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition-transform active:scale-95"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-emerald-600/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 bg-emerald-800/90 px-3 py-1.5 rounded-xl text-xs font-medium w-full">
              <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="text-[11px] text-emerald-200 font-bold shrink-0">Fecha de Asistencia:</span>
              <input
                type="date"
                value={fechaHoy}
                onChange={(e) => setFechaHoy(e.target.value)}
                className="bg-transparent text-white font-black focus:outline-none cursor-pointer text-xs w-full"
              />
            </div>
          </div>
        </div>

        {/* MENÚ DIRECTOR (3 BOTONES DIRECTOS) */}
        {esDirector && (
          <div className="max-w-2xl mx-auto flex text-center border-t border-emerald-600/60 bg-emerald-800/40">
            <button 
              onClick={() => setVistaDirector('asistencia')}
              className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                vistaDirector === 'asistencia' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 
              <span>Control de Asistencia</span>
            </button>

            <button 
              onClick={() => setVistaDirector('reportes')}
              className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                vistaDirector === 'reportes' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" /> 
              <span>Descargar Excel</span>
            </button>

            <button 
              onClick={() => setVistaDirector('gestion')}
              className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                vistaDirector === 'gestion' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Settings className="w-4 h-4 text-emerald-300 shrink-0" /> 
              <span>Personal y Padrón</span>
            </button>
          </div>
        )}

        {/* MENÚ AUXILIAR */}
        {esAuxiliar && (
          <div className="max-w-2xl mx-auto flex text-center border-t border-emerald-600/60 bg-emerald-800/40">
            <button 
              onClick={() => setSubVistaAuxiliar('salones')}
              className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-1.5 ${
                subVistaAuxiliar === 'salones' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500' : 'text-emerald-100'
              }`}
            >
              <Users className="w-4 h-4" /> Mis Salones
            </button>
            <button 
              onClick={() => setSubVistaAuxiliar('puerta')}
              className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-1.5 ${
                subVistaAuxiliar === 'puerta' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500' : 'text-emerald-100'
              }`}
            >
              <Clock className="w-4 h-4" /> Puerta (8:00 AM)
            </button>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto w-full px-3.5 pt-3.5 flex-1 space-y-3.5">
        
        {/* =========================================================================
            VISTA 1: CONTROL DE ASISTENCIA Y RONDAS
           ========================================================================= */}
        {((esDirector && vistaDirector === 'asistencia') || esDocente || (esAuxiliar && subVistaAuxiliar === 'salones')) && (
          <div className="space-y-3.5">
            
            {/* BUSCADOR UNIVERSAL DIRECTO DEL DIRECTOR */}
            {esDirector && (
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-300">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-600" />
                    Buscador de Alumno para Marcar Estado
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Total: {estudiantes.length} alumnos</span>
                </div>
                
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Escriba Apellidos o DNI del alumno..."
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
                        <div key={alumno.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{alumno.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              DNI: <b>{alumno.dni || 'S/D'}</b> • <span className="text-emerald-700 font-bold">{alumno.grade} - {alumno.section}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'P')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'P' ? 'bg-emerald-600 text-white border-emerald-700 shadow' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Presente"
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'T')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'T' ? 'bg-amber-500 text-white border-amber-600 shadow' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Tardanza"
                            >
                              T
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'F')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'F' ? 'bg-rose-600 text-white border-rose-700 shadow' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Falta"
                            >
                              F
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'E')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'E' ? 'bg-purple-700 text-white border-purple-800 shadow animate-pulse' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Evasión"
                            >
                              E
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoAlumno(alumno.id, 'J')}
                              className={`px-2 py-1.5 rounded-lg text-xs font-black border transition ${
                                st === 'J' ? 'bg-sky-600 text-white border-sky-700 shadow' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                              title="Permiso Justificado"
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

            {/* SELECTOR DE AULA */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <School className="w-3.5 h-3.5" /> 
                  {esDirector ? 'Control de Asistencia por Salón' : `Mis Salones (${aulasPermitidasUsuario.length})`}
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
                      <span className="truncate">Guardar Asistencia de {seccionSel}</span>
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

        {/* =========================================================================
            VISTA 2: DESCARGAS EXCEL
           ========================================================================= */}
        {esDirector && vistaDirector === 'reportes' && (
          <div className="space-y-3.5">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-300">
              <div className="flex items-center gap-2 text-emerald-900 font-bold mb-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black">Descargar Reportes en Excel (.xlsx)</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5 flex items-center gap-1">
                    <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
                    1. Período:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTipoPeriodoReporte('dia')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                        tipoPeriodoReporte === 'dia' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      📅 Día
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoPeriodoReporte('semana')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                        tipoPeriodoReporte === 'semana' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      📆 Semana
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoPeriodoReporte('mes')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                        tipoPeriodoReporte === 'mes' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      📊 Mes
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-emerald-600" />
                    2. Alcance:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAlcanceReporte('todos')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                        alcanceReporte === 'todos' ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🌐 Todo el Colegio
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlcanceReporte('grado')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                        alcanceReporte === 'grado' ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🏫 Por Grado
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlcanceReporte('aula')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                        alcanceReporte === 'aula' ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🚪 Por Aula
                    </button>
                  </div>
                </div>

                {(alcanceReporte === 'grado' || alcanceReporte === 'aula') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fadeIn">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Grado</label>
                      <select
                        value={filtroGradoReporte}
                        onChange={(e) => setFiltroGradoReporte(e.target.value)}
                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                      >
                        <option value="PRIMERO">PRIMERO</option>
                        <option value="SEGUNDO">SEGUNDO</option>
                        <option value="TERCERO">TERCERO</option>
                        <option value="CUARTO">CUARTO</option>
                        <option value="QUINTO">QUINTO</option>
                      </select>
                    </div>

                    {alcanceReporte === 'aula' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Sección</label>
                        <select
                          value={filtroSeccionReporte}
                          onChange={(e) => setFiltroSeccionReporte(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                        >
                          {todasLasAulasColegio.filter(a => a.grade === filtroGradoReporte).map(a => (
                            <option key={a.section} value={a.section}>{a.section}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={generarReporteExcelAvanzado}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3.5 px-4 rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] mt-2"
                >
                  <Download className="w-5 h-5 text-emerald-200" />
                  <span>Descargar Reporte en Excel (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VISTA 3: PERSONAL Y PADRÓN (TODO RESTITUIDO Y ORGANIZADO)
           ========================================================================= */}
        {esDirector && vistaDirector === 'gestion' && (
          <div className="space-y-3.5">
            
            {/* SUB-PESTAÑAS CLARAS PARA EL DIRECTOR */}
            <div className="flex bg-slate-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSubPestanaGestion('personal')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                  subPestanaGestion === 'personal' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Personal Docente y Auxiliares ({usuarios.filter(u => u.rol !== 'director').length})
              </button>
              <button
                type="button"
                onClick={() => setSubPestanaGestion('estudiantes')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                  subPestanaGestion === 'estudiantes' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎓 Padrón de Estudiantes ({estudiantes.length})
              </button>
            </div>

            {mensajeAdmin && (
              <div className="p-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 text-center animate-pulse">
                {mensajeAdmin}
              </div>
            )}

            {/* SECCIÓN A: GESTIÓN DE PERSONAL (CREAR NUEVO + LISTA CON EDITAR/ELIMINAR) */}
            {subPestanaGestion === 'personal' && (
              <div className="space-y-3.5">
                
                {/* FORMULARIO PARA REGISTRAR DOCENTE O AUXILIAR NUEVO */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-2.5 text-xs">
                    <UserPlus className="w-4 h-4" />
                    <h3>Registrar Nuevo Docente o Auxiliar de Educación</h3>
                  </div>

                  <form onSubmit={registrarPersonal} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cargo a desempeñar</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNuevoRolPersonal('auxiliar')}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                            nuevoRolPersonal === 'auxiliar' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Auxiliar de Educación
                        </button>
                        <button
                          type="button"
                          onClick={() => setNuevoRolPersonal('docente')}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                            nuevoRolPersonal === 'docente' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" /> Docente de Aula
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder={nuevoRolPersonal === 'auxiliar' ? "Nombre del Auxiliar (ej: Ronald Alarcón)" : "Nombre del Docente y Área (ej: Ana Yance - COM)"}
                      value={nuevoNombreDocente}
                      onChange={(e) => setNuevoNombreDocente(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Usuario de acceso"
                        value={nuevoUserDocente}
                        onChange={(e) => setNuevoUserDocente(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Contraseña (DNI)"
                        value={nuevaClaveDocente}
                        onChange={(e) => setNuevaClaveDocente(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">
                          {nuevoRolPersonal === 'auxiliar' ? 'Secciones asignadas al auxiliar:' : 'Aulas a cargo del docente:'}
                        </label>
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          {aulasSeleccionadasNuevas.length} seleccionadas
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO'].map(g => (
                          <button
                            type="button"
                            key={g}
                            onClick={() => alternarGradoCompleto(g)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold py-1 px-2 rounded-lg transition"
                          >
                            + Todo {g.slice(0, 3)}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {todasLasAulasColegio.map(aula => {
                          const clave = `${aula.grade}|${aula.section}`;
                          const estaMarcada = aulasSeleccionadasNuevas.includes(clave);
                          return (
                            <button
                              type="button"
                              key={clave}
                              onClick={() => alternarSeleccionAula(clave)}
                              className={`p-2 rounded-lg text-xs font-bold border text-left flex items-center justify-between transition-all ${
                                estaMarcada 
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate">{aula.grade} - {aula.section}</span>
                              {estaMarcada ? (
                                <CheckSquare className="w-4 h-4 shrink-0 text-white" />
                              ) : (
                                <Square className="w-4 h-4 shrink-0 text-slate-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <UserPlus className="w-4 h-4" /> Registrar Personal en el Sistema
                    </button>
                  </form>
                </div>

                {/* LISTA DE PERSONAL ACTUAL */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-black text-slate-700 uppercase mb-2.5">
                    Personal Registrado ({usuarios.filter(u => u.rol !== 'director').length})
                  </h3>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {usuarios.filter(u => u.rol !== 'director').map(usr => (
                      <div key={usr.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{usr.nombre}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            Cargo: <b className="uppercase text-emerald-800">{usr.rol}</b> • Usuario: <b>{usr.usuario}</b> • Clave: <code>{usr.clave}</code>
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {usr.aulasAsignadas && usr.aulasAsignadas.length > 0 ? (
                              usr.aulasAsignadas.map((a, i) => (
                                <span key={i} className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {a.grade} - {a.section}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-400">Sin salones asignados</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => abrirModalEditarPersonal(usr)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                            title="Editar usuario, clave o aulas"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => eliminarDocente(usr.id)}
                            className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition"
                            title="Eliminar acceso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN B: GESTIÓN DE ESTUDIANTES */}
            {subPestanaGestion === 'estudiantes' && (
              <div className="space-y-3.5">
                
                {/* CARGA MASIVA DE EXCEL / SIAGIE */}
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>Carga Masiva Excel / SIAGIE (.xlsx)</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold">Formato Oficial MINEDU</span>
                  </div>
                  
                  <label className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition">
                    <Upload className="w-4 h-4" /> Subir Padrón en Excel (.xlsx)
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={procesarArchivoExcel}
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* MATRICULAR ALUMNO INDIVIDUAL */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase mb-2.5">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Matricular Alumno Nuevo Individual</span>
                  </div>

                  <form onSubmit={registrarAlumnoNuevo} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="DNI (8 dígitos)"
                        maxLength={8}
                        value={nuevoDniAlumno}
                        onChange={(e) => setNuevoDniAlumno(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="APELLIDOS Y NOMBRES"
                        value={nuevoNombreAlumno}
                        onChange={(e) => setNuevoNombreAlumno(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={nuevoGradoAlumno}
                        onChange={(e) => setNuevoGradoAlumno(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                      >
                        <option value="PRIMERO">1°</option>
                        <option value="SEGUNDO">2°</option>
                        <option value="TERCERO">3°</option>
                        <option value="CUARTO">4°</option>
                        <option value="QUINTO">5°</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Sección (ej: HONRADEZ)"
                        value={nuevaSeccionAlumno}
                        onChange={(e) => setNuevaSeccionAlumno(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />

                      <input
                        type="tel"
                        placeholder="Celular"
                        value={nuevoCelularAlumno}
                        onChange={(e) => setNuevoCelularAlumno(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" /> Agregar Alumno al Padrón
                    </button>
                  </form>
                </div>

                {/* BUSCADOR Y LISTA DEL PADRÓN */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase">
                      Padrón ({alumnosFiltradosPadron.length} de {estudiantes.length} alumnos)
                    </h3>
                  </div>

                  <div className="relative mb-2.5">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por DNI, Nombre o Aula..."
                      value={busquedaPadron}
                      onChange={(e) => setBusquedaPadron(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {alumnosFiltradosPadron.map(alumno => (
                      <div key={alumno.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{alumno.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            DNI: <b>{alumno.dni || 'S/D'}</b> • <span className="text-emerald-700 font-bold">{alumno.grade} - {alumno.section}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => abrirModalEditarAlumno(alumno)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                            title="Editar datos"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>
                          
                          <button
                            onClick={() => retirarAlumno(alumno.id, alumno.name)}
                            className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition"
                            title="Dar de baja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* MODAL EDITAR PERSONAL */}
        {personalEditando && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                  <UserCheck className="w-4 h-4" />
                  <h4>Editar Credenciales y Aulas</h4>
                </div>
                <button onClick={() => setPersonalEditando(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={guardarEdicionPersonal} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Cargo / Función</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRolPersonal('auxiliar')}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                        editRolPersonal === 'auxiliar' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Auxiliar de Educación
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRolPersonal('docente')}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                        editRolPersonal === 'docente' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" /> Docente de Aula
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Nombre Completo y Área</label>
                  <input
                    type="text"
                    value={editNombrePersonal}
                    onChange={(e) => setEditNombrePersonal(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Usuario de Login</label>
                    <input
                      type="text"
                      value={editUserPersonal}
                      onChange={(e) => setEditUserPersonal(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Contraseña</label>
                    <input
                      type="text"
                      value={editClavePersonal}
                      onChange={(e) => setEditClavePersonal(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">
                      Secciones Asignadas ({editAulasPersonal.length}):
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO'].map(g => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => alternarGradoCompletoEdicion(g)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold py-1 px-2 rounded-lg transition"
                      >
                        + Todo {g.slice(0, 3)}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {todasLasAulasColegio.map(aula => {
                      const clave = `${aula.grade}|${aula.section}`;
                      const estaMarcada = editAulasPersonal.includes(clave);
                      return (
                        <button
                          type="button"
                          key={clave}
                          onClick={() => alternarSeleccionAulaEdicion(clave)}
                          className={`p-2 rounded-lg text-xs font-bold border text-left flex items-center justify-between transition-all ${
                            estaMarcada 
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{aula.grade} - {aula.section}</span>
                          {estaMarcada ? (
                            <CheckSquare className="w-4 h-4 shrink-0 text-white" />
                          ) : (
                            <Square className="w-4 h-4 shrink-0 text-slate-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPersonalEditando(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDITAR ESTUDIANTE */}
        {alumnoEditando && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                  <Edit3 className="w-4 h-4" />
                  <h4>Editar Datos del Estudiante</h4>
                </div>
                <button onClick={() => setAlumnoEditando(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={guardarEdicionCompletaAlumno} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Documento de Identidad (DNI):
                  </label>
                  <input
                    type="text"
                    value={editDni}
                    onChange={(e) => setEditDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Ingrese los 8 dígitos"
                    maxLength={8}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Apellidos y Nombres:
                  </label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    required
                    placeholder="APELLIDOS Y NOMBRES"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Grado:
                    </label>
                    <select
                      value={editGrado}
                      onChange={(e) => setEditGrado(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="PRIMERO">PRIMERO</option>
                      <option value="SEGUNDO">SEGUNDO</option>
                      <option value="TERCERO">TERCERO</option>
                      <option value="CUARTO">CUARTO</option>
                      <option value="QUINTO">QUINTO</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Sección:
                    </label>
                    <input
                      type="text"
                      value={editSeccion}
                      onChange={(e) => setEditSeccion(e.target.value.toUpperCase())}
                      required
                      placeholder="Ej: RESPONSABILIDAD"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Celular del Apoderado:
                  </label>
                  <input
                    type="tel"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    placeholder="Ej: 964123456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAlumnoEditando(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PIE DE PÁGINA */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col items-center gap-2">
          <p className="text-[11px] text-slate-400 font-medium">
            Sesión iniciada: <b>{usuarioAutenticado.nombre}</b>
          </p>
          <button
            onClick={handleLogout}
            className="w-full max-w-xs bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4 text-rose-600" /> Cerrar Sesión Segura
          </button>
        </div>
      </main>
    </div>
  );
}
