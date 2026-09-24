import { supabase } from './supabase';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, AlertTriangle, Phone, 
  MessageCircle, Search, Calendar, School, ShieldAlert, 
  FileSpreadsheet, Check, Lock, LogOut, UserCheck, Eye, EyeOff, 
  HelpCircle, X, Download, UserPlus, Trash2, ShieldCheck, BookOpen,
  Upload, Edit3, Plus, Layers, Wifi, WifiOff, RefreshCw, Smartphone,
  CalendarRange, Filter, Sparkles, KeyRound, Save, CheckSquare, Square,
  Loader2, Footprints, FileText, UserCog
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
    const local = localStorage.getItem('colegio_cola_offline_v18');
    return local ? JSON.parse(local) : [];
  });
  const [sincronizando, setSincronizando] = useState(false);
  const [avisoSync, setAvisoSync] = useState('');

  useEffect(() => {
    localStorage.setItem('colegio_cola_offline_v18', JSON.stringify(colaPendientes));
  }, [colaPendientes]);

  const sincronizarColaConSupabase = useCallback(async () => {
    const colaActual = JSON.parse(localStorage.getItem('colegio_cola_offline_v18') || '[]');
    if (!navigator.onLine || colaActual.length === 0) return;

    setSincronizando(true);
    let enviadosConExito = 0;
    const restantes = [];

    for (const item of colaActual) {
      try {
        if (item.tipo === 'aula') {
          await supabase.from('asistencias').delete().eq('fecha', item.fecha).eq('seccion', item.seccion);
          const { error } = await supabase.from('asistencias').insert(item.filas);
          if (error) throw error;
        } else if (item.tipo === 'puerta') {
          await supabase.from('asistencias').delete().eq('fecha', item.fecha).eq('estudiante_id', item.estudiante_id);
          const { error } = await supabase.from('asistencias').insert(item.filas);
          if (error) throw error;
        }
        enviadosConExito++;
      } catch (err) {
        restantes.push(item);
      }
    }

    setColaPendientes(restantes);
    localStorage.setItem('colegio_cola_offline_v18', JSON.stringify(restantes));
    setSincronizando(false);

    if (enviadosConExito > 0) {
      setAvisoSync(`¡Conexión restaurada! Se sincronizaron ${enviadosConExito} asistencia(s) con la nube.`);
      setTimeout(() => setAvisoSync(''), 4500);
    }
  }, []);

  useEffect(() => {
    const alConectar = () => {
      setEstaEnLinea(true);
      sincronizarColaConSupabase();
    };
    const alDesconectar = () => setEstaEnLinea(false);

    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);

    if (navigator.onLine) sincronizarColaConSupabase();

    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
    };
  }, [sincronizarColaConSupabase]);

  // USUARIOS
  const [usuarios, setUsuarios] = useState(() => {
    const local = localStorage.getItem('colegio_usuarios_v18');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('colegio_usuarios_v18', JSON.stringify(usuarios));
  }, [usuarios]);

  // PADRÓN DE ESTUDIANTES
  const [estudiantes, setEstudiantes] = useState(() => {
    const local = localStorage.getItem('colegio_estudiantes_v18');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('colegio_estudiantes_v18', JSON.stringify(estudiantes));
  }, [estudiantes]);

  // ASISTENCIAS
  const [asistencias, setAsistencias] = useState(() => {
    const local = localStorage.getItem('colegio_asistencias_v18');
    return local ? JSON.parse(local) : {};
  });

  useEffect(() => {
    localStorage.setItem('colegio_asistencias_v18', JSON.stringify(asistencias));
  }, [asistencias]);

  // DESCARGA INICIAL DESDE SUPABASE
  useEffect(() => {
    const sincronizarNubeCompleta = async () => {
      if (!navigator.onLine) {
        setCargandoInicial(false);
        return;
      }

      try {
        const resUser = await supabase.from('usuarios').select('*');
        if (!resUser.error && resUser.data && resUser.data.length > 0) {
          const formateados = resUser.data.map(u => ({
            id: u.id,
            usuario: u.usuario,
            clave: u.clave,
            rol: u.rol,
            nombre: u.nombre,
            aulasAsignadas: u.aulas_asignadas || []
          }));
          setUsuarios(formateados);
          localStorage.setItem('colegio_usuarios_v18', JSON.stringify(formateados));
        }

        const resEst = await supabase.from('estudiantes').select('*');
        if (!resEst.error && resEst.data && resEst.data.length > 0) {
          setEstudiantes(resEst.data);
          localStorage.setItem('colegio_estudiantes_v18', JSON.stringify(resEst.data));
        }

        const resAsis = await supabase.from('asistencias').select('*');
        if (!resAsis.error && resAsis.data && resAsis.data.length > 0) {
          const agrupadas = {};
          resAsis.data.forEach(reg => {
            if (!agrupadas[reg.fecha]) agrupadas[reg.fecha] = {};
            agrupadas[reg.fecha][reg.estudiante_id] = {
              status: reg.estado,
              time: reg.created_at ? new Date(reg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00'
            };
          });
          setAsistencias(prev => ({ ...prev, ...agrupadas }));
          localStorage.setItem('colegio_asistencias_v18', JSON.stringify(agrupadas));
        }
      } catch (err) {
        console.warn('Conexión con Supabase:', err);
      } finally {
        setCargandoInicial(false);
      }
    };

    sincronizarNubeCompleta();
  }, []);

  const existeDirector = useMemo(() => {
    return usuarios.some(u => u.rol === 'director');
  }, [usuarios]);

  // REGISTRO INICIAL DEL DIRECTOR
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

    try {
      const { error } = await supabase.from('usuarios').upsert([{
        id: directorNuevo.id,
        usuario: directorNuevo.usuario,
        clave: directorNuevo.clave,
        rol: directorNuevo.rol,
        nombre: directorNuevo.nombre,
        aulas_asignadas: []
      }]);

      if (error) {
        alert('Error al guardar en Supabase: ' + error.message);
        setGuardandoDirector(false);
        return;
      }

      setUsuarios([directorNuevo]);
      setUsuarioAutenticado(directorNuevo);
      localStorage.setItem('colegio_usuarios_v18', JSON.stringify([directorNuevo]));
      localStorage.setItem('colegio_sesion_v18', JSON.stringify(directorNuevo));
    } catch (err) {
      alert('Error al registrar: ' + err.message);
    } finally {
      setGuardandoDirector(false);
    }
  };

  // SESIÓN
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => {
    const sesion = localStorage.getItem('colegio_sesion_v18');
    return sesion ? JSON.parse(sesion) : null;
  });

  const [inputUsuario, setInputUsuario] = useState('');
  const [inputClave, setInputClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');

  const [fechaHoy, setFechaHoy] = useState(new Date().toISOString().split('T')[0]);
  const [rolActivo, setRolActivo] = useState('docente');

  const handleLogin = (e) => {
    e.preventDefault();
    const encontrado = usuarios.find(
      u => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.clave === inputClave
    );

    if (encontrado) {
      setUsuarioAutenticado(encontrado);
      setRolActivo(encontrado.rol);
      if (recordarSesion) {
        localStorage.setItem('colegio_sesion_v18', JSON.stringify(encontrado));
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
      localStorage.removeItem('colegio_sesion_v18');
    }
  };

  const restablecerSistemaDeFabrica = async () => {
    const claveSeguridad = window.prompt('ATENCIÓN: Esto restablecerá el sistema a cero tanto en este dispositivo como en la nube.\n\nEscriba "LIMPIAR" para confirmar:');
    if (claveSeguridad === 'LIMPIAR') {
      try {
        await supabase.from('usuarios').delete().neq('id', 'cero');
        await supabase.from('estudiantes').delete().neq('id', 'cero');
        await supabase.from('asistencias').delete().neq('id', 0);
      } catch (e) {}
      localStorage.clear();
      window.location.reload();
    }
  };

  const esDirector = usuarioAutenticado?.rol === 'director';
  const esAuxiliar = usuarioAutenticado?.rol === 'auxiliar';

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

  // ROTACIÓN CON EVASIÓN Y PERMISO JUSTIFICADO: P -> T -> F -> E -> J -> P
  const alternarEstadoAlumno = (id) => {
    setAsistenciaAula(prev => {
      const actual = prev[id] || 'P';
      const siguiente = 
        actual === 'P' ? 'T' :
        actual === 'T' ? 'F' :
        actual === 'F' ? 'E' :
        actual === 'E' ? 'J' : 'P';
      return { ...prev, [id]: siguiente };
    });
  };

  const guardarAsistenciaAula = async () => {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setAsistencias(prev => {
      const dia = { ...(prev[fechaHoy] || {}) };
      Object.keys(asistenciaAula).forEach(id => {
        dia[id] = { status: asistenciaAula[id], time: hora };
      });
      return { ...prev, [fechaHoy]: dia };
    });

    const seccionCompleta = `${gradoSel} - ${seccionSel}`;
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

    if (!navigator.onLine) {
      setColaPendientes(prev => [...prev.filter(p => !(p.tipo === 'aula' && p.fecha === fechaHoy && p.seccion === seccionCompleta)), paquete]);
      setMensajeGuardado('¡Guardado en el Teléfono! 📱 (Offline)');
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
      return;
    }

    try {
      await supabase.from('asistencias').delete().eq('fecha', fechaHoy).eq('seccion', seccionCompleta);
      const { error } = await supabase.from('asistencias').insert(filas);
      if (error) throw error;

      setMensajeGuardado('¡Guardado en la Nube! ☁️');
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 2500);
    } catch (err) {
      setColaPendientes(prev => [...prev.filter(p => !(p.tipo === 'aula' && p.fecha === fechaHoy && p.seccion === seccionCompleta)), paquete]);
      setMensajeGuardado('Sin señal: Guardado en teléfono 📱');
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
    }
  };

  const [busquedaAux, setBusquedaAux] = useState('');
  const [mensajePuerta, setMensajePuerta] = useState('');

  const estudiantesPermitidosAuxiliar = useMemo(() => {
    if (esDirector) return estudiantes;
    if (!usuarioAutenticado?.aulasAsignadas || usuarioAutenticado.aulasAsignadas.length === 0) return [];
    
    return estudiantes.filter(e => 
      usuarioAutenticado.aulasAsignadas.some(a => a.grade === e.grade && a.section === e.section)
    );
  }, [esDirector, estudiantes, usuarioAutenticado]);

  const resultadosAux = useMemo(() => {
    if (!busquedaAux.trim()) return [];
    const t = busquedaAux.toUpperCase();
    return estudiantesPermitidosAuxiliar.filter(e => 
      e.name.includes(t) || 
      (e.dni && e.dni.includes(t)) || 
      e.grade.includes(t) || 
      e.section.includes(t)
    ).slice(0, 8);
  }, [busquedaAux, estudiantesPermitidosAuxiliar]);

  const registrarIngresoPuerta = async (alumno) => {
    const ahora = new Date();
    const horas = ahora.getHours();
    const minutos = ahora.getMinutes();
    const horaTexto = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const esTarde = horas > 8 || (horas === 8 && minutos > 0);
    const estadoAsignado = esTarde ? 'T' : 'P';

    setAsistencias(prev => {
      const dia = { ...(prev[fechaHoy] || {}) };
      dia[alumno.id] = { status: estadoAsignado, time: horaTexto };
      return { ...prev, [fechaHoy]: dia };
    });

    if (esTarde) {
      setMensajePuerta(`⚠️ Tardanza: ${alumno.name} (${horaTexto})`);
    } else {
      setMensajePuerta(`✅ Ingreso Puntual: ${alumno.name} (${horaTexto})`);
    }
    
    setBusquedaAux('');
    setTimeout(() => setMensajePuerta(''), 3500);

    const filaPuerta = [{
      fecha: fechaHoy,
      estudiante_id: String(alumno.id),
      estudiante_nombre: alumno.name,
      seccion: `${alumno.grade} - ${alumno.section}`,
      estado: estadoAsignado,
      registrado_por: usuarioAutenticado?.nombre || 'Auxiliar de Puerta'
    }];

    const paquetePuerta = {
      id: `puerta_${Date.now()}`,
      tipo: 'puerta',
      fecha: fechaHoy,
      estudiante_id: String(alumno.id),
      filas: filaPuerta
    };

    if (!navigator.onLine) {
      setColaPendientes(prev => [...prev.filter(p => !(p.tipo === 'puerta' && p.fecha === fechaHoy && p.estudiante_id === String(alumno.id))), paquetePuerta]);
      return;
    }

    try {
      await supabase.from('asistencias').delete().eq('fecha', fechaHoy).eq('estudiante_id', String(alumno.id));
      const { error } = await supabase.from('asistencias').insert(filaPuerta);
      if (error) throw error;
    } catch (err) {
      setColaPendientes(prev => [...prev.filter(p => !(p.tipo === 'puerta' && p.fecha === fechaHoy && p.estudiante_id === String(alumno.id))), paquetePuerta]);
    }
  };

  // MÉTRICAS Y DETECCIÓN
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

    const acumulados = estudiantes.map(e => {
      let tCount = 0;
      let fCount = 0;
      let eCount = 0;
      let jCount = 0;
      Object.values(asistencias).forEach(diaReg => {
        if (diaReg[e.id]?.status === 'T') tCount++;
        if (diaReg[e.id]?.status === 'F') fCount++;
        if (diaReg[e.id]?.status === 'E') eCount++;
        if (diaReg[e.id]?.status === 'J') jCount++;
      });
      return { ...e, tardanzasMes: tCount, faltasMes: fCount, evasionesMes: eCount, permisosMes: jCount };
    });

    const enRiesgo = acumulados.filter(e => e.tardanzasMes >= 3 || e.faltasMes >= 3 || e.evasionesMes >= 1);
    const faltaronHoyLista = estudiantes.filter(e => dia[e.id]?.status === 'F');
    const evadieronHoyLista = estudiantes.filter(e => dia[e.id]?.status === 'E');
    const permisoHoyLista = estudiantes.filter(e => dia[e.id]?.status === 'J');

    return { faltasHoy, tardanzasHoy, presentesHoy, evasionesHoy, permisosHoy, enRiesgo, faltaronHoyLista, evadieronHoyLista, permisoHoyLista, acumulados };
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

  const descargarPlantillaExcel = async () => {
    try {
      const XLSX = await cargarLibreriaExcel();
      const wb = XLSX.utils.book_new();
      const plantilla = [
        ['DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCION', 'TELEFONO'],
        ['74125890', 'ALVARADO PAUCAR JOSHUA SAMIR', 'PRIMERO', 'RESPONSABILIDAD', '964112233'],
        ['74125891', 'ATOCCSA ARANCEL JORAN DAVID', 'PRIMERO', 'HONRADEZ', '964223344']
      ];
      const ws = XLSX.utils.aoa_to_sheet(plantilla);
      ws['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
      XLSX.writeFile(wb, 'Plantilla_Oficial_Alumnos.xlsx');
    } catch (err) {
      alert('Error al descargar plantilla: ' + err.message);
    }
  };

  // LECTOR INTEGRADO DE ARCHIVOS SIAGIE Y EXCEL ESTÁNDAR
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
            if (clean.includes('GRADO') && colGrado === -1) colGrado = idx;
            if (clean.includes('SECCION') && colSeccion === -1) colSeccion = idx;
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
        try {
          await supabase.from('estudiantes').delete().neq('id', 'cero');
          const { error } = await supabase.from('estudiantes').insert(cargados);
          if (error) alert('Aviso Supabase: ' + error.message);
          else alert(`¡Éxito! Se cargaron ${cargados.length} estudiantes del SIAGIE en la nube.`);
        } catch (err) {
          console.warn('Error al guardar en Supabase:', err);
        }
      } else {
        alert('No se detectaron estudiantes válidos. Verifique el archivo.');
      }
    } catch (err) {
      alert('Error al procesar el archivo Excel: ' + err.message);
    }
    e.target.value = '';
  };

  const enviarWhatsApp = (alumno, tipoAlerta) => {
    let mensaje = '';
    if (tipoAlerta === 'evasion') {
      mensaje = `ALERTA URGENTE DE EVASIÓN: Estimado(a) apoderado de *${alumno.name}* (${alumno.grade} - ${alumno.section}): La Dirección y Auxiliaría de la I.E.E. Daniel Hernández le informan con carácter de urgencia que el menor ingresó a la institución pero ha EVADIDO clases / se encuentra no habido en este momento. Rogamos comunicarse inmediatamente con el colegio.`;
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

  const [pestanaDirector, setPestanaDirector] = useState('metricas');
  
  // GESTIÓN PERSONAL (REGISTRO Y EDICIÓN)
  const [nuevoRolPersonal, setNuevoRolPersonal] = useState('auxiliar');
  const [nuevoNombreDocente, setNuevoNombreDocente] = useState('');
  const [nuevoUserDocente, setNuevoUserDocente] = useState('');
  const [nuevaClaveDocente, setNuevaClaveDocente] = useState('');
  const [aulasSeleccionadasNuevas, setAulasSeleccionadasNuevas] = useState([]);
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  // MODAL DE EDICIÓN DE PERSONAL (DOCENTE O AUXILIAR)
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

    setUsuarios(prev => prev.map(u => u.id === personalEditando.id ? personalActualizado : u));

    try {
      const { error } = await supabase.from('usuarios').update({
        nombre: personalActualizado.nombre,
        usuario: personalActualizado.usuario,
        clave: personalActualizado.clave,
        rol: personalActualizado.rol,
        aulas_asignadas: personalActualizado.aulasAsignadas
      }).eq('id', personalEditando.id);

      if (error) alert('Aviso Supabase: ' + error.message);
      else {
        setMensajeAdmin('✅ Datos del personal actualizados en la nube.');
        setTimeout(() => setMensajeAdmin(''), 3000);
      }
    } catch (err) {
      console.warn('Error al actualizar en Supabase:', err);
    }

    setPersonalEditando(null);
  };

  const [busquedaDirector, setBusquedaDirector] = useState('');
  const [nuevoDniAlumno, setNuevoDniAlumno] = useState('');
  const [nuevoNombreAlumno, setNuevoNombreAlumno] = useState('');
  const [nuevoGradoAlumno, setNuevoGradoAlumno] = useState('PRIMERO');
  const [nuevaSeccionAlumno, setNuevaSeccionAlumno] = useState('RESPONSABILIDAD');
  const [nuevoCelularAlumno, setNuevoCelularAlumno] = useState('');
  
  // EDICIÓN ALUMNO
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

    setEstudiantes(prev => prev.map(a => a.id === alumnoEditando.id ? estudianteActualizado : a));

    try {
      const { error } = await supabase.from('estudiantes').update({
        dni: estudianteActualizado.dni,
        name: estudianteActualizado.name,
        grade: estudianteActualizado.grade,
        section: estudianteActualizado.section,
        phone: estudianteActualizado.phone
      }).eq('id', alumnoEditando.id);
      if (error) alert('Aviso Supabase: ' + error.message);
    } catch (err) {
      console.warn('Error al actualizar en Supabase:', err);
    }

    setAlumnoEditando(null);
  };

  const registrarPersonal = async (e) => {
    e.preventDefault();
    if (!nuevoNombreDocente || !nuevoUserDocente || !nuevaClaveDocente) return;

    if (usuarios.some(u => u.usuario.toLowerCase() === nuevoUserDocente.trim().toLowerCase())) {
      setMensajeAdmin('⚠️ Ese nombre de usuario ya está registrado.');
      return;
    }

    if (aulasSeleccionadasNuevas.length === 0) {
      setMensajeAdmin('⚠️ Debe seleccionar al menos un grado o sección para este personal.');
      return;
    }

    const aulasAsignadas = aulasSeleccionadasNuevas.map(clave => {
      const [grade, section] = clave.split('|');
      return { grade, section };
    });

    const nuevo = {
      id: `usr_${Date.now()}`,
      usuario: nuevoUserDocente.trim().toLowerCase(),
      clave: nuevaClaveDocente,
      rol: nuevoRolPersonal,
      nombre: nuevoNombreDocente.trim(),
      aulasAsignadas: aulasAsignadas
    };

    setUsuarios(prev => [...prev, nuevo]);
    setNuevoNombreDocente('');
    setNuevoUserDocente('');
    setNuevaClaveDocente('');
    setAulasSeleccionadasNuevas([]);
    setMensajeAdmin(`✅ ${nuevoRolPersonal === 'docente' ? 'Docente' : 'Auxiliar'} registrado con ${aulasAsignadas.length} aulas asignadas.`);
    setTimeout(() => setMensajeAdmin(''), 3500);

    try {
      const { error } = await supabase.from('usuarios').upsert([{
        id: nuevo.id,
        usuario: nuevo.usuario,
        clave: nuevo.clave,
        rol: nuevo.rol,
        nombre: nuevo.nombre,
        aulas_asignadas: nuevo.aulasAsignadas
      }]);
      if (error) alert('Aviso Supabase: ' + error.message);
    } catch (err) {
      console.warn('Error al guardar usuario en Supabase:', err);
    }
  };

  const eliminarDocente = async (id) => {
    if (window.confirm('¿Está seguro de revocar el acceso a este usuario?')) {
      setUsuarios(prev => prev.filter(u => u.id !== id));
      try {
        await supabase.from('usuarios').delete().eq('id', id);
      } catch (e) {}
    }
  };

  const registrarAlumnoNuevo = async (e) => {
    e.preventDefault();
    if (!nuevoNombreAlumno.trim()) return;

    const nuevo = {
      id: `est_${Date.now()}`,
      dni: nuevoDniAlumno.trim() || 'S/D',
      name: nuevoNombreAlumno.trim().toUpperCase(),
      grade: nuevoGradoAlumno,
      section: nuevaSeccionAlumno,
      phone: nuevoCelularAlumno.trim() || '999999999'
    };

    setEstudiantes(prev => [...prev, nuevo]);
    setNuevoDniAlumno('');
    setNuevoNombreAlumno('');
    setNuevoCelularAlumno('');
    setMensajeAdmin('✅ Alumno matriculado correctamente.');
    setTimeout(() => setMensajeAdmin(''), 3000);

    try {
      const { error } = await supabase.from('estudiantes').insert([nuevo]);
      if (error) alert('Aviso Supabase: ' + error.message);
    } catch (err) {}
  };

  const retirarAlumno = async (id, nombre) => {
    if (window.confirm(`¿Confirmas el retiro definitivo del estudiante "${nombre}"?`)) {
      setEstudiantes(prev => prev.filter(e => e.id !== id));
      try {
        await supabase.from('estudiantes').delete().eq('id', id);
      } catch (e) {}
    }
  };

  const alumnosFiltradosDirector = useMemo(() => {
    if (!busquedaDirector.trim()) return estudiantes;
    const t = busquedaDirector.toUpperCase();
    return estudiantes.filter(e => 
      e.name.includes(t) || 
      (e.dni && e.dni.includes(t)) || 
      e.grade.includes(t) || 
      e.section.includes(t)
    );
  }, [estudiantes, busquedaDirector]);

  if (cargandoInicial) {
    return (
      <div className="min-h-screen bg-emerald-800 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="w-16 h-16 bg-emerald-900 rounded-3xl flex items-center justify-center shadow-2xl mb-4 border border-emerald-600 animate-bounce">
          <School className="w-8 h-8 text-emerald-300" />
        </div>
        <h2 className="text-lg font-black tracking-tight">I.E.E. "Daniel Hernández"</h2>
        <p className="text-xs text-emerald-200 mt-1 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Conectando con la base de datos...
        </p>
      </div>
    );
  }

  if (!existeDirector) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-emerald-800 p-6 text-center text-white">
            <div className="w-16 h-16 bg-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-emerald-700">
              <Sparkles className="w-9 h-9 text-emerald-300" />
            </div>
            <h1 className="text-xl font-black tracking-tight">I.E.E. "Daniel Hernández"</h1>
            <p className="text-xs text-emerald-200 mt-1">Configuración Inicial del Sistema</p>
          </div>

          <form onSubmit={registrarPrimerDirector} className="p-5 sm:p-6 space-y-3.5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 font-medium leading-relaxed">
              El sistema se encuentra en <b>estado virgen</b>. Como primer paso, registre la cuenta del <b>Director / Administrador General</b>.
            </div>

            {errorPrimerRegistro && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorPrimerRegistro}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre Completo del Director(a)</label>
              <input
                type="text"
                placeholder="Ej: Lic. Rafael Moisés Velarde Rico"
                value={primerNombreDirector}
                onChange={(e) => setPrimerNombreDirector(e.target.value)}
                required
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Usuario para Iniciar Sesión</label>
              <input
                type="text"
                placeholder="Ej: director o miusuario"
                value={primerUserDirector}
                onChange={(e) => setPrimerUserDirector(e.target.value)}
                required
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={primerClaveDirector}
                  onChange={(e) => setPrimerClaveDirector(e.target.value)}
                  required
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Repetir Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={primerClaveConfirm}
                  onChange={(e) => setPrimerClaveConfirm(e.target.value)}
                  required
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardandoDirector}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3.5 rounded-xl shadow-lg text-sm flex items-center justify-center gap-2 transition mt-2"
            >
              {guardandoDirector ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{guardandoDirector ? 'Guardando en la Nube...' : 'Activar Sistema y Crear Director'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!usuarioAutenticado) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-emerald-700 p-5 sm:p-6 text-center text-white">
            <div className="w-14 h-14 bg-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <School className="w-8 h-8 text-emerald-200" />
            </div>
            <h1 className="text-xl font-black tracking-tight">I.E.E. "Daniel Hernández"</h1>
            <p className="text-xs text-emerald-200 mt-0.5">Control de Asistencia Escolar 2026</p>
          </div>

          <form onSubmit={handleLogin} className="p-4 sm:p-6 space-y-4">
            {!estaEnLinea ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold p-2.5 rounded-xl flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Modo Sin Señal: Ingreso habilitado con cuentas en memoria.</span>
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold p-2 rounded-xl flex items-center justify-center gap-1.5 border border-emerald-100">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Acceso Móvil Institucional</span>
              </div>
            )}

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
                placeholder="Ingrese su usuario asignado"
                value={inputUsuario}
                onChange={(e) => setInputUsuario(e.target.value)}
                required
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-600 uppercase">Contraseña</label>
                <button
                  type="button"
                  onClick={() => setModalRecuperar(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold hover:underline"
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={mostrarClave ? "text" : "password"} 
                  placeholder="••••••••"
                  value={inputClave}
                  onChange={(e) => setInputClave(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave(!mostrarClave)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  title={mostrarClave ? "Ocultar" : "Mostrar"}
                >
                  {mostrarClave ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5 text-slate-500" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="recordar"
                checked={recordarSesion}
                onChange={(e) => setRecordarSesion(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="recordar" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                Mantener sesión iniciada en este celular
              </label>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Lock className="w-4 h-4" /> Iniciar Sesión
            </button>
          </form>
        </div>

        {modalRecuperar && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <HelpCircle className="w-5 h-5" />
                  <h3>Recuperar Contraseña</h3>
                </div>
                <button onClick={() => setModalRecuperar(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Comuníquese directamente con la Dirección del Colegio para solicitar la restauración de sus credenciales.
              </p>

              <div className="space-y-2">
                <a
                  href={`https://wa.me/51964123456?text=${encodeURIComponent('Hola Dirección, solicito recuperar mi clave de acceso al sistema.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <MessageCircle className="w-4 h-4" /> Contactar a Dirección por WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => setModalRecuperar(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  Regresar al login
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-12">
      {!estaEnLinea && (
        <div className="bg-amber-500 text-amber-950 px-3 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm sticky top-0 z-40">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="truncate">MODO OFFLINE: Se guarda en tu celular</span>
        </div>
      )}

      {avisoSync && (
        <div className="bg-emerald-600 text-white px-3 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm sticky top-0 z-40">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{avisoSync}</span>
        </div>
      )}

      {colaPendientes.length > 0 && estaEnLinea && (
        <div className="bg-blue-600 text-white px-3 py-2 text-xs font-bold flex items-center justify-between shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-1.5 truncate">
            <Wifi className="w-3.5 h-3.5 text-blue-200 shrink-0" />
            <span className="truncate">{colaPendientes.length} guardado(s) por subir</span>
          </div>
          <button
            onClick={sincronizarColaConSupabase}
            disabled={sincronizando}
            className="bg-white text-blue-800 px-2.5 py-1 rounded-lg text-xs font-black shrink-0 shadow"
          >
            {sincronizando ? 'Subiendo...' : 'Subir Ahora'}
          </button>
        </div>
      )}

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
              <span className="text-[11px] text-emerald-200 font-bold shrink-0">Fecha:</span>
              <input
                type="date"
                value={fechaHoy}
                onChange={(e) => setFechaHoy(e.target.value)}
                className="bg-transparent text-white font-black focus:outline-none cursor-pointer text-xs w-full"
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto flex text-center border-t border-emerald-600/60 bg-emerald-800/40">
          {(usuarioAutenticado.rol === 'director' || usuarioAutenticado.rol === 'docente' || usuarioAutenticado.rol === 'auxiliar') && (
            <button 
              onClick={() => setRolActivo('docente')}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                rolActivo === 'docente' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" /> 
              <span>{esAuxiliar ? 'Mis Salones' : 'En Aula'}</span>
            </button>
          )}

          {(usuarioAutenticado.rol === 'director' || usuarioAutenticado.rol === 'auxiliar') && (
            <button 
              onClick={() => setRolActivo('auxiliar')}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                rolActivo === 'auxiliar' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" /> 
              <span>Puerta (8:00 AM)</span>
            </button>
          )}

          {usuarioAutenticado.rol === 'director' && (
            <button 
              onClick={() => setRolActivo('director')}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                rolActivo === 'director' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" /> 
              <span>Director</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-3.5 pt-3.5 flex-1">
        {/* EN AULA / MIS SALONES */}
        {rolActivo === 'docente' && (
          <div className="space-y-3.5">
            {aulasPermitidasUsuario.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
                <School className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">No tienes secciones asignadas</h3>
                <p className="text-xs text-slate-500 mt-1">
                  La Dirección debe asignarte tus grados y secciones en el panel "Personal y Aulas".
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 
                      {esDirector ? 'Modo Auditoría General' : `Tus Secciones a Cargo (${aulasPermitidasUsuario.length})`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">Salón actual</span>
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

                <div className="flex items-center justify-between gap-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800 flex items-center gap-1.5 flex-1 overflow-x-auto">
                    <span>Estado:</span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold text-[11px]">P</span>
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-bold text-[11px]">T</span>
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-bold text-[11px]">F</span>
                    <span className="bg-purple-700 text-white px-2 py-0.5 rounded font-bold text-[11px] flex items-center gap-0.5">
                      <Footprints className="w-3 h-3" /> E
                    </span>
                    <span className="bg-sky-600 text-white px-2 py-0.5 rounded font-bold text-[11px] flex items-center gap-0.5">
                      <FileText className="w-3 h-3" /> J (Permiso)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setTipoPeriodoReporte('dia');
                      setAlcanceReporte('aula');
                      setFiltroGradoReporte(gradoSel);
                      setFiltroSeccionReporte(seccionSel);
                      generarReporteExcelAvanzado();
                    }}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 shadow transition-all shrink-0"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>Excel (.xlsx)</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {alumnosAula.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                      No hay alumnos en el padrón para {gradoSel} - {seccionSel}. Suba el Excel de estudiantes en el Panel de Director.
                    </div>
                  ) : (
                    alumnosAula.map((alumno, index) => {
                      const estado = asistenciaAula[alumno.id] || 'P';
                      return (
                        <div 
                          key={alumno.id}
                          onClick={() => alternarEstadoAlumno(alumno.id)}
                          className={`cursor-pointer select-none p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between shadow-sm active:scale-[0.98] ${
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
                                <Footprints className="w-3.5 h-3.5" /> Evasión
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
              </>
            )}
          </div>
        )}

        {/* PUERTA */}
        {rolActivo === 'auxiliar' && (
          <div className="space-y-3.5">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">
                  {esDirector ? 'Control General de Puerta' : `Control de Ingreso (${usuarioAutenticado?.aulasAsignadas?.length || 0} aulas asignadas)`}
                </h2>
                <div className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" /> 8:00 AM
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">
                Busque a un estudiante por <b>DNI</b> o <b>Apellido</b>:
              </p>
              
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Escriba DNI o Apellidos..."
                  value={busquedaAux}
                  onChange={(e) => setBusquedaAux(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {mensajePuerta && (
                <div className="mt-3 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold p-3 rounded-xl text-xs sm:text-sm text-center animate-pulse">
                  {mensajePuerta}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {resultadosAux.map(alumno => (
                <div 
                  key={alumno.id} 
                  className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{alumno.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {alumno.dni && alumno.dni !== 'S/D' ? `DNI: ${alumno.dni} • ` : ''}
                      <span className="text-emerald-700 font-semibold">{alumno.grade} - {alumno.section}</span>
                    </p>
                  </div>

                  <button 
                    onClick={() => registrarIngresoPuerta(alumno)}
                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow shrink-0"
                  >
                    <UserCheck className="w-4 h-4" /> Marcar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIRECTOR */}
        {rolActivo === 'director' && (
          <div className="space-y-3.5">
            <div className="flex bg-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setPestanaDirector('metricas')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  pestanaDirector === 'metricas' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 Reportes
              </button>
              <button
                onClick={() => setPestanaDirector('alumnos')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  pestanaDirector === 'alumnos' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎓 Padrón ({estudiantes.length})
              </button>
              <button
                onClick={() => setPestanaDirector('docentes')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  pestanaDirector === 'docentes' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Personal y Aulas
              </button>
            </div>

            {/* REPORTES */}
            {pestanaDirector === 'metricas' && (
              <>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
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

                {/* ALERTA DE EVASIONES */}
                {metricasDirector.evadieronHoyLista.length > 0 && (
                  <div className="bg-purple-900 text-white p-4 rounded-2xl shadow-lg border border-purple-700 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Footprints className="w-5 h-5 text-purple-300 animate-bounce" />
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide">
                          🚨 Alerta de Evasión Hoy ({metricasDirector.evadieronHoyLista.length} alumnos)
                        </h3>
                      </div>
                      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        Acción Inmediata
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200 mb-3 leading-relaxed">
                      Estudiantes registrados como presentes que evadieron clases o se retiraron del aula sin autorización:
                    </p>

                    <div className="space-y-2">
                      {metricasDirector.evadieronHoyLista.map(alumno => (
                        <div key={alumno.id} className="bg-purple-800/90 p-2.5 rounded-xl border border-purple-600 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs truncate">{alumno.name}</p>
                            <p className="text-[10px] text-purple-300 truncate">{alumno.grade} - {alumno.section}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a 
                              href={`tel:${alumno.phone}`} 
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <button 
                              onClick={() => enviarWhatsApp(alumno, 'evasion')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Avisar Evasión
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-300">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold mb-3">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-black">Centro de Reportes en Excel (.xlsx)</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5 flex items-center gap-1">
                        <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
                        1. Seleccione el período:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTipoPeriodoReporte('dia')}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                            tipoPeriodoReporte === 'dia'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          📅 Por Día
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoPeriodoReporte('semana')}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                            tipoPeriodoReporte === 'semana'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          📆 Por Semana
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoPeriodoReporte('mes')}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                            tipoPeriodoReporte === 'mes'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          📊 Por Mes
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5 text-emerald-600" />
                        2. Seleccione el alcance:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAlcanceReporte('todos')}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                            alcanceReporte === 'todos'
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🌐 Todo el Colegio
                        </button>
                        <button
                          type="button"
                          onClick={() => setAlcanceReporte('grado')}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                            alcanceReporte === 'grado'
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🏫 Por Grado
                        </button>
                        <button
                          type="button"
                          onClick={() => setAlcanceReporte('aula')}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                            alcanceReporte === 'aula'
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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

                {/* AUSENTES */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Ausentes Hoy ({metricasDirector.faltaronHoyLista.length})</h3>
                    </div>
                  </div>

                  {metricasDirector.faltaronHoyLista.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No hay ausencias registradas hoy.</p>
                  ) : (
                    <div className="space-y-2">
                      {metricasDirector.faltaronHoyLista.map(alumno => (
                        <div key={alumno.id} className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{alumno.name}</p>
                            <p className="text-[10px] text-rose-700 truncate">{alumno.grade} - {alumno.section}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a 
                              href={`tel:${alumno.phone}`} 
                              className="bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <button 
                              onClick={() => enviarWhatsApp(alumno, 'falta_hoy')}
                              className="bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PERMISOS HOY */}
                {metricasDirector.permisoHoyLista.length > 0 && (
                  <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-sky-300">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5 text-sky-800">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <h3 className="font-bold text-xs sm:text-sm">Con Permiso Justificado Hoy ({metricasDirector.permisoHoyLista.length})</h3>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {metricasDirector.permisoHoyLista.map(alumno => (
                        <div key={alumno.id} className="bg-sky-50/70 p-2.5 rounded-xl border border-sky-200 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{alumno.name}</p>
                            <p className="text-[10px] text-sky-700 truncate">{alumno.grade} - {alumno.section}</p>
                          </div>

                          <button 
                            onClick={() => enviarWhatsApp(alumno, 'permiso')}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Constancia
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ALERTAS DISCIPLINARIAS */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Alertas (Evasiones o 3+ Tardanzas/Faltas)</h3>
                    </div>
                    <span className="bg-rose-100 text-rose-700 font-black text-[10px] px-2 py-0.5 rounded-full">
                      {metricasDirector.enRiesgo.length} en riesgo
                    </span>
                  </div>

                  {metricasDirector.enRiesgo.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">Sin incidencias acumuladas.</p>
                  ) : (
                    <div className="space-y-2">
                      {metricasDirector.enRiesgo.map(alumno => (
                        <div key={alumno.id} className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-300 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{alumno.name}</p>
                            <p className="text-[10px] text-slate-600 truncate">{alumno.grade} - {alumno.section}</p>
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {alumno.evasionesMes > 0 && (
                                <span className="text-[9px] font-black text-white bg-purple-700 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                  <Footprints className="w-2.5 h-2.5" /> {alumno.evasionesMes} Evasión(es)
                                </span>
                              )}
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded">
                                {alumno.tardanzasMes} Tardanzas
                              </span>
                              <span className="text-[9px] font-bold text-rose-800 bg-rose-200/80 px-1.5 py-0.2 rounded">
                                {alumno.faltasMes} Faltas
                              </span>
                              {alumno.permisosMes > 0 && (
                                <span className="text-[9px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded">
                                  {alumno.permisosMes} Permiso(s)
                                </span>
                              )}
                            </div>
                          </div>

                          <button 
                            onClick={() => enviarWhatsApp(alumno, 'citacion')}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Citar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* PADRÓN */}
            {pestanaDirector === 'alumnos' && (
              <div className="space-y-3.5">
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-600" /> Buscador de Alumnos
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por DNI, Nombre o Grado..."
                      value={busquedaDirector}
                      onChange={(e) => setBusquedaDirector(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>Carga Masiva Excel / SIAGIE (.xlsx)</span>
                    </div>
                    <button
                      onClick={descargarPlantillaExcel}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Modelo
                    </button>
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

                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase mb-2.5">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Matricular Alumno Individual</span>
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
                        placeholder="Sección"
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
                      <Plus className="w-4 h-4" /> Agregar al Padrón
                    </button>
                  </form>
                </div>

                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2.5">
                    Padrón ({alumnosFiltradosDirector.length} alumnos)
                  </h3>

                  {estudiantes.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No hay estudiantes cargados. Suba el archivo Excel arriba.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {alumnosFiltradosDirector.map(alumno => (
                        <div key={alumno.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{alumno.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                DNI: {alumno.dni || 'S/D'}
                              </span>
                              {' • '}
                              <span className="font-semibold text-slate-600">{alumno.grade} - {alumno.section}</span>
                            </p>
                            <p className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" /> {alumno.phone}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => abrirModalEditarAlumno(alumno)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                              title="Editar DNI, nombre, grado o sección"
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
                  )}
                </div>

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
              </div>
            )}

            {/* GESTIÓN DE PERSONAL Y AULAS */}
            {pestanaDirector === 'docentes' && (
              <div className="space-y-3.5">
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-2.5 text-xs">
                    <UserPlus className="w-4 h-4" />
                    <h3>Registrar Personal y Asignar Secciones a Cargo</h3>
                  </div>

                  {mensajeAdmin && (
                    <div className="mb-2.5 p-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {mensajeAdmin}
                    </div>
                  )}

                  <form onSubmit={registrarPersonal} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cargo / Función</label>
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
                        placeholder="Usuario para login"
                        value={nuevoUserDocente}
                        onChange={(e) => setNuevoUserDocente(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Contraseña"
                        value={nuevaClaveDocente}
                        onChange={(e) => setNuevaClaveDocente(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">
                          {nuevoRolPersonal === 'auxiliar' ? 'Secciones que supervisará este auxiliar:' : 'Aulas que dictará este docente:'}
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
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
                      <UserPlus className="w-4 h-4" /> Crear Cuenta y Guardar en la Nube
                    </button>
                  </form>
                </div>

                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2.5">
                    Personal Registrado ({usuarios.filter(u => u.rol !== 'director').length})
                  </h3>

                  <div className="space-y-2">
                    {usuarios.filter(u => u.rol !== 'director').map(usr => (
                      <div key={usr.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{usr.nombre}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            Cargo: <b className="uppercase text-emerald-800">{usr.rol}</b> | User: <b>{usr.usuario}</b> | Clave: <code>{usr.clave}</code>
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
                          {/* BOTÓN EDITAR DOCENTE O AUXILIAR */}
                          <button
                            onClick={() => abrirModalEditarPersonal(usr)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                            title="Editar contraseña, usuario o salones asignados"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>

                          <button
                            onClick={() => eliminarDocente(usr.id)}
                            className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition"
                            title="Revocar acceso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MODAL PARA EDITAR DOCENTE O AUXILIAR */}
                {personalEditando && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-fadeIn max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                          <UserCog className="w-4 h-4" />
                          <h4>Editar Credenciales y Aulas del Personal</h4>
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

                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
                  <h4 className="text-xs font-bold text-rose-800 uppercase mb-1">Zona de Entrega de Software</h4>
                  <p className="text-[11px] text-rose-700 mb-2.5">
                    Permite borrar cuentas y registros para entregar la aplicación 100% limpia a la institución:
                  </p>
                  <button
                    onClick={restablecerSistemaDeFabrica}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Restablecer a Cero de Fábrica
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col items-center gap-2">
          <p className="text-[11px] text-slate-400 font-medium">
            Conectado como <b>{usuarioAutenticado.nombre}</b>
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
