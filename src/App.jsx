import { supabase } from './supabase';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, AlertTriangle, Phone, 
  MessageCircle, Search, Calendar, School, ShieldAlert, 
  FileSpreadsheet, Check, Lock, LogOut, UserCheck, Eye, EyeOff, 
  HelpCircle, X, Download, UserPlus, Trash2, ShieldCheck, BookOpen,
  Upload, Edit, Plus, Layers, Wifi, WifiOff, RefreshCw, Smartphone,
  CalendarRange, Filter, Sparkles, KeyRound
} from 'lucide-react';

// Motor oficial de Microsoft Excel (.xlsx)
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
  // 1. ESTADO DE CONECTIVIDAD Y COLA OFFLINE
  const [estaEnLinea, setEstaEnLinea] = useState(navigator.onLine);
  const [colaPendientes, setColaPendientes] = useState(() => {
    const local = localStorage.getItem('colegio_cola_offline_v10');
    return local ? JSON.parse(local) : [];
  });
  const [sincronizando, setSincronizando] = useState(false);
  const [avisoSync, setAvisoSync] = useState('');

  useEffect(() => {
    localStorage.setItem('colegio_cola_offline_v10', JSON.stringify(colaPendientes));
  }, [colaPendientes]);

  const sincronizarColaConSupabase = useCallback(async () => {
    const colaActual = JSON.parse(localStorage.getItem('colegio_cola_offline_v10') || '[]');
    if (!navigator.onLine || colaActual.length === 0) return;

    setSincronizando(true);
    let enviadosConExito = 0;
    const restantes = [];

    for (const item of colaActual) {
      try {
        if (item.tipo === 'aula') {
          await supabase
            .from('asistencias')
            .delete()
            .eq('fecha', item.fecha)
            .eq('seccion', item.seccion);
          await supabase.from('asistencias').insert(item.filas);
        } else if (item.tipo === 'puerta') {
          await supabase
            .from('asistencias')
            .delete()
            .eq('fecha', item.fecha)
            .eq('estudiante_id', item.estudiante_id);
          await supabase.from('asistencias').insert(item.filas);
        }
        enviadosConExito++;
      } catch (err) {
        restantes.push(item);
      }
    }

    setColaPendientes(restantes);
    localStorage.setItem('colegio_cola_offline_v10', JSON.stringify(restantes));
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

  // 2. GESTIÓN DE USUARIOS (INICIA VACÍO SI ESTÁ LIMPIO)
  const [usuarios, setUsuarios] = useState(() => {
    const local = localStorage.getItem('colegio_usuarios_v10');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('colegio_usuarios_v10', JSON.stringify(usuarios));
  }, [usuarios]);

  // Verificar si ya existe un Administrador / Director
  const existeDirector = useMemo(() => {
    return usuarios.some(u => u.rol === 'director');
  }, [usuarios]);

  // Formulario del Primer Registro del Director
  const [primerNombreDirector, setPrimerNombreDirector] = useState('');
  const [primerUserDirector, setPrimerUserDirector] = useState('');
  const [primerClaveDirector, setPrimerClaveDirector] = useState('');
  const [primerClaveConfirm, setPrimerClaveConfirm] = useState('');
  const [errorPrimerRegistro, setErrorPrimerRegistro] = useState('');

  const registrarPrimerDirector = (e) => {
    e.preventDefault();
    if (!primerNombreDirector.trim() || !primerUserDirector.trim() || !primerClaveDirector) return;

    if (primerClaveDirector !== primerClaveConfirm) {
      setErrorPrimerRegistro('Las contraseñas no coinciden. Verifíquelas.');
      return;
    }

    const directorNuevo = {
      id: 'dir_master',
      usuario: primerUserDirector.trim().toLowerCase(),
      clave: primerClaveDirector,
      rol: 'director',
      nombre: primerNombreDirector.trim(),
      aulasAsignadas: []
    };

    const nuevosUsuarios = [directorNuevo];
    setUsuarios(nuevosUsuarios);
    setUsuarioAutenticado(directorNuevo);
    localStorage.setItem('colegio_sesion_v10', JSON.stringify(directorNuevo));
  };

  // 3. SESIÓN ACTUAL
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => {
    const sesion = localStorage.getItem('colegio_sesion_v10');
    return sesion ? JSON.parse(sesion) : null;
  });

  const [inputUsuario, setInputUsuario] = useState('');
  const [inputClave, setInputClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');

  // 4. PADRÓN DE ESTUDIANTES (INICIA VACÍO O CON DATOS CARGADOS)
  const [estudiantes, setEstudiantes] = useState(() => {
    const local = localStorage.getItem('colegio_estudiantes_v10');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('colegio_estudiantes_v10', JSON.stringify(estudiantes));
  }, [estudiantes]);

  const [fechaHoy, setFechaHoy] = useState(new Date().toISOString().split('T')[0]);
  const [rolActivo, setRolActivo] = useState('docente');

  const [asistencias, setAsistencias] = useState(() => {
    const local = localStorage.getItem('colegio_asistencias_v10');
    return local ? JSON.parse(local) : {};
  });

  useEffect(() => {
    const cargarDesdeSupabase = async () => {
      if (!navigator.onLine) return;
      try {
        const { data, error } = await supabase.from('asistencias').select('*');
        if (!error && data && data.length > 0) {
          const agrupadas = {};
          data.forEach(reg => {
            if (!agrupadas[reg.fecha]) agrupadas[reg.fecha] = {};
            agrupadas[reg.fecha][reg.estudiante_id] = {
              status: reg.estado,
              time: reg.created_at ? new Date(reg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00'
            };
          });
          setAsistencias(prev => ({ ...prev, ...agrupadas }));
        }
      } catch (err) {
        console.warn('Operando con datos locales.');
      }
    };
    cargarDesdeSupabase();
  }, []);

  useEffect(() => {
    localStorage.setItem('colegio_asistencias_v10', JSON.stringify(asistencias));
  }, [asistencias]);

  const handleLogin = (e) => {
    e.preventDefault();
    const encontrado = usuarios.find(
      u => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.clave === inputClave
    );

    if (encontrado) {
      setUsuarioAutenticado(encontrado);
      setRolActivo(encontrado.rol);
      if (recordarSesion) {
        localStorage.setItem('colegio_sesion_v10', JSON.stringify(encontrado));
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
      localStorage.removeItem('colegio_sesion_v10');
    }
  };

  // Restablecer sistema a valores de fábrica
  const restablecerSistemaDeFabrica = () => {
    const claveSeguridad = window.prompt('ATENCIÓN: Esto borrará los usuarios y el padrón de este dispositivo para dejarlo virgen.\n\nEscriba "LIMPIAR" para confirmar:');
    if (claveSeguridad === 'LIMPIAR') {
      localStorage.clear();
      window.location.reload();
    }
  };

  const esDirector = usuarioAutenticado?.rol === 'director';

  const todasLasAulasColegio = useMemo(() => {
    const mapa = new Map();
    estudiantes.forEach(e => {
      const clave = `${e.grade}|${e.section}`;
      if (!mapa.has(clave)) {
        mapa.set(clave, { grade: e.grade, section: e.section });
      }
    });
    return Array.from(mapa.values());
  }, [estudiantes]);

  const aulasPermitidasDocente = useMemo(() => {
    if (esDirector) return todasLasAulasColegio;
    return usuarioAutenticado?.aulasAsignadas && usuarioAutenticado.aulasAsignadas.length > 0
      ? usuarioAutenticado.aulasAsignadas
      : (todasLasAulasColegio.length > 0 ? [todasLasAulasColegio[0]] : []);
  }, [esDirector, todasLasAulasColegio, usuarioAutenticado]);

  const [gradoSel, setGradoSel] = useState('');
  const [seccionSel, setSeccionSel] = useState('');

  useEffect(() => {
    if (aulasPermitidasDocente.length > 0) {
      const existe = aulasPermitidasDocente.some(a => a.grade === gradoSel && a.section === seccionSel);
      if (!existe) {
        setGradoSel(aulasPermitidasDocente[0].grade);
        setSeccionSel(aulasPermitidasDocente[0].section);
      }
    }
  }, [aulasPermitidasDocente, gradoSel, seccionSel]);

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

  const alternarEstadoAlumno = (id) => {
    setAsistenciaAula(prev => {
      const actual = prev[id] || 'P';
      const siguiente = actual === 'P' ? 'T' : actual === 'T' ? 'F' : 'P';
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
      estudiante_id: alumno.id,
      estudiante_nombre: alumno.name,
      seccion: seccionCompleta,
      estado: asistenciaAula[alumno.id] || 'P',
      registrado_por: usuarioAutenticado?.nombre || 'Docente'
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
      await supabase
        .from('asistencias')
        .delete()
        .eq('fecha', fechaHoy)
        .eq('seccion', seccionCompleta);

      await supabase.from('asistencias').insert(filas);
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

  // CONTROL DE PUERTA (AUXILIAR)
  const [busquedaAux, setBusquedaAux] = useState('');
  const [mensajePuerta, setMensajePuerta] = useState('');

  const resultadosAux = useMemo(() => {
    if (!busquedaAux.trim()) return [];
    const t = busquedaAux.toUpperCase();
    return estudiantes.filter(e => 
      e.name.includes(t) || 
      (e.dni && e.dni.includes(t)) || 
      e.grade.includes(t) || 
      e.section.includes(t)
    ).slice(0, 8);
  }, [busquedaAux, estudiantes]);

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
      estudiante_id: alumno.id,
      estudiante_nombre: alumno.name,
      seccion: `${alumno.grade} - ${alumno.section}`,
      estado: estadoAsignado,
      registrado_por: usuarioAutenticado?.nombre || 'Auxiliar de Puerta'
    }];

    const paquetePuerta = {
      id: `puerta_${Date.now()}`,
      tipo: 'puerta',
      fecha: fechaHoy,
      estudiante_id: alumno.id,
      filas: filaPuerta
    };

    if (!navigator.onLine) {
      setColaPendientes(prev => [...prev.filter(p => !(p.tipo === 'puerta' && p.fecha === fechaHoy && p.estudiante_id === alumno.id)), paquetePuerta]);
      return;
    }

    try {
      await supabase
        .from('asistencias')
        .delete()
        .eq('fecha', fechaHoy)
        .eq('estudiante_id', alumno.id);

      await supabase.from('asistencias').insert(filaPuerta);
    } catch (err) {
      setColaPendientes(prev => [...prev.filter(p => !(p.tipo === 'puerta' && p.fecha === fechaHoy && p.estudiante_id === alumno.id)), paquetePuerta]);
    }
  };

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

  // ==========================================
  // MOTOR DE REPORTES EN EXCEL (.XLSX)
  // ==========================================
  const [tipoPeriodoReporte, setTipoPeriodoReporte] = useState('dia');
  const [alcanceReporte, setAlcanceReporte] = useState('todos');
  const [filtroGradoReporte, setFiltroGradoReporte] = useState('PRIMERO');
  const [filtroSeccionReporte, setFiltroSeccionReporte] = useState('A');

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
        datos.push(['Institución Educativa:', 'EduAsistencia']);
        datos.push(['Fecha:', fechaHoy]);
        datos.push(['Alcance:', tituloAlcance]);
        datos.push(['Total Alumnos:', listaExportar.length]);
        datos.push([]);
        datos.push(['N°', 'DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCIÓN', 'ESTADO', 'HORA REGISTRO', 'CELULAR APODERADO']);

        const diaActual = asistencias[fechaHoy] || {};
        listaExportar.forEach((alumno, i) => {
          const st = diaActual[alumno.id]?.status || 'P';
          const hora = diaActual[alumno.id]?.time || '--:--';
          const estadoDesc = st === 'P' ? 'PRESENTE' : st === 'T' ? 'TARDANZA' : 'FALTA';
          datos.push([i + 1, alumno.dni || 'S/D', alumno.name, alumno.grade, alumno.section, estadoDesc, hora, alumno.phone || '']);
        });

        anchosCols = [{ wch: 6 }, { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];

      } else if (tipoPeriodoReporte === 'semana') {
        const diasSemana = obtenerDiasSemana(fechaHoy);
        const nombresDias = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];
        nombreArchivo = `Asistencia_Semanal_${diasSemana[0]}_al_${diasSemana[4]}_${alcanceReporte.toUpperCase()}.xlsx`;

        datos.push(['CONSOLIDADO SEMANAL DE ASISTENCIA']);
        datos.push(['Semana Lectiva:', `Del ${diasSemana[0]} al ${diasSemana[4]}`]);
        datos.push(['Alcance:', tituloAlcance]);
        datos.push(['Total Evaluados:', listaExportar.length]);
        datos.push([]);

        const filaEncabezados = ['N°', 'DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCIÓN'];
        diasSemana.forEach((d, idx) => filaEncabezados.push(`${nombresDias[idx]} (${d.slice(5)})`));
        filaEncabezados.push('TOTAL P', 'TOTAL T', 'TOTAL F', '% ASISTENCIA', 'CELULAR');
        datos.push(filaEncabezados);

        listaExportar.forEach((alumno, i) => {
          let countP = 0, countT = 0, countF = 0;
          const filaAlumno = [i + 1, alumno.dni || 'S/D', alumno.name, alumno.grade, alumno.section];

          diasSemana.forEach(d => {
            const estado = asistencias[d]?.[alumno.id]?.status || '-';
            filaAlumno.push(estado);
            if (estado === 'P') countP++;
            else if (estado === 'T') countT++;
            else if (estado === 'F') countF++;
          });

          const totalRegistrados = countP + countT + countF;
          const porcentaje = totalRegistrados > 0 ? Math.round(((countP + countT) / totalRegistrados) * 100) : 100;
          filaAlumno.push(countP, countT, countF, `${porcentaje}%`, alumno.phone || '');
          datos.push(filaAlumno);
        });

        anchosCols = [
          { wch: 6 }, { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 22 },
          { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
          { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 16 }
        ];

      } else if (tipoPeriodoReporte === 'mes') {
        const mesActual = fechaHoy.slice(0, 7);
        const diasHabilesMes = obtenerDiasMes(fechaHoy);
        nombreArchivo = `Consolidado_Mensual_${mesActual}_${alcanceReporte.toUpperCase()}.xlsx`;

        datos.push(['REGISTRO CONSOLIDADO MENSUAL DE ASISTENCIA']);
        datos.push(['Mes de Evaluación:', mesActual]);
        datos.push(['Días Hábiles:', diasHabilesMes.length]);
        datos.push(['Alcance:', tituloAlcance]);
        datos.push([]);

        datos.push(['N°', 'DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCIÓN', 'PUNTUALES (P)', 'TARDANZAS (T)', 'FALTAS (F)', 'TOTAL CLASES', '% ASISTENCIA', 'CONDICIÓN', 'CELULAR APODERADO']);

        listaExportar.forEach((alumno, i) => {
          let countP = 0, countT = 0, countF = 0;
          diasHabilesMes.forEach(d => {
            const st = asistencias[d]?.[alumno.id]?.status;
            if (st === 'P') countP++;
            else if (st === 'T') countT++;
            else if (st === 'F') countF++;
          });

          const totalRegistrados = countP + countT + countF;
          const porcentaje = totalRegistrados > 0 ? Math.round(((countP + countT) / totalRegistrados) * 100) : 100;
          const condicion = (countT >= 3 || countF >= 3) ? 'EN RIESGO DISCIPLINARIO' : 'REGULAR';

          datos.push([i + 1, alumno.dni || 'S/D', alumno.name, alumno.grade, alumno.section, countP, countT, countF, totalRegistrados, `${porcentaje}%`, condicion, alumno.phone || '']);
        });

        anchosCols = [
          { wch: 6 }, { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 22 },
          { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 15 },
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
        ['74125890', 'RODRIGUEZ LOPEZ MARIO', 'PRIMERO', 'RESPONSABILIDD', '964112233'],
        ['74125891', 'FLORES QUISPE DIANA', 'SEGUNDO', 'ANDRES AVELINO CACERES', '964223344']
      ];
      const ws = XLSX.utils.aoa_to_sheet(plantilla);
      ws['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
      XLSX.writeFile(wb, 'Plantilla_Oficial_Alumnos.xlsx');
    } catch (err) {
      alert('Error al descargar plantilla: ' + err.message);
    }
  };

  // Carga Masiva de Alumnos en Excel (.xlsx, .xls)
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

      let filaEncabezados = -1;
      let colDni = 0, colNombre = 1, colGrado = 2, colSeccion = 3, colTelefono = 4;

      for (let r = 0; r < Math.min(filas.length, 5); r++) {
        const row = (filas[r] || []).map(c => String(c || '').toUpperCase().trim());
        const tieneNombre = row.some(c => c.includes('NOMBRE') || c.includes('APELLIDO') || c.includes('ALUMNO') || c.includes('ESTUDIANTE'));
        if (tieneNombre) {
          filaEncabezados = r;
          row.forEach((colText, idx) => {
            if (colText.includes('DNI') || colText.includes('DOCUMENTO')) colDni = idx;
            if (colText.includes('NOMBRE') || colText.includes('APELLIDO') || colText.includes('ALUMNO') || colText.includes('ESTUDIANTE')) colNombre = idx;
            if (colText.includes('GRADO') || colText.includes('AÑO')) colGrado = idx;
            if (colText.includes('SECCION') || colText.includes('SECCIÓN') || colText.includes('AULA')) colSeccion = idx;
            if (colText.includes('TEL') || colText.includes('CEL') || colText.includes('APODERADO') || colText.includes('PADRE')) colTelefono = idx;
          });
          break;
        }
      }

      const inicio = filaEncabezados !== -1 ? filaEncabezados + 1 : 1;
      const cargados = [];

      for (let i = inicio; i < filas.length; i++) {
        const fila = filas[i];
        if (!fila || fila.length === 0) continue;
        const nombre = String(fila[colNombre] || '').trim().toUpperCase();
        if (!nombre) continue;

        cargados.push({
          id: Date.now() + i,
          dni: String(fila[colDni] || 'S/D').trim(),
          name: nombre,
          grade: String(fila[colGrado] || 'PRIMERO').trim().toUpperCase(),
          section: String(fila[colSeccion] || 'A').trim().toUpperCase(),
          phone: String(fila[colTelefono] || '999999999').trim()
        });
      }

      if (cargados.length > 0) {
        setEstudiantes(cargados);
        alert(`¡Padrón cargado exitosamente! Se incorporaron ${cargados.length} estudiantes.`);
      } else {
        alert('No se detectaron estudiantes válidos en el archivo.');
      }
    } catch (err) {
      alert('Error al procesar el archivo Excel: ' + err.message);
    }
    e.target.value = '';
  };

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

  const [pestanaDirector, setPestanaDirector] = useState('metricas');
  
  const [nuevoNombreDocente, setNuevoNombreDocente] = useState('');
  const [nuevoUserDocente, setNuevoUserDocente] = useState('');
  const [nuevaClaveDocente, setNuevaClaveDocente] = useState('');
  const [aulasSeleccionadasNuevas, setAulasSeleccionadasNuevas] = useState([]);
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  const alternarSeleccionAula = (claveAula) => {
    setAulasSeleccionadasNuevas(prev => 
      prev.includes(claveAula)
        ? prev.filter(c => c !== claveAula)
        : [...prev, claveAula]
    );
  };

  const [busquedaDirector, setBusquedaDirector] = useState('');
  const [nuevoDniAlumno, setNuevoDniAlumno] = useState('');
  const [nuevoNombreAlumno, setNuevoNombreAlumno] = useState('');
  const [nuevoGradoAlumno, setNuevoGradoAlumno] = useState('PRIMERO');
  const [nuevaSeccionAlumno, setNuevaSeccionAlumno] = useState('A');
  const [nuevoCelularAlumno, setNuevoCelularAlumno] = useState('');
  
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [nuevoTelefonoEdit, setNuevoTelefonoEdit] = useState('');

  const registrarDocente = (e) => {
    e.preventDefault();
    if (!nuevoNombreDocente || !nuevoUserDocente || !nuevaClaveDocente) return;

    if (usuarios.some(u => u.usuario.toLowerCase() === nuevoUserDocente.trim().toLowerCase())) {
      setMensajeAdmin('⚠️ Ese nombre de usuario ya está registrado.');
      return;
    }

    if (aulasSeleccionadasNuevas.length === 0) {
      setMensajeAdmin('⚠️ Debe seleccionar al menos un aula.');
      return;
    }

    const aulasAsignadas = aulasSeleccionadasNuevas.map(clave => {
      const [grade, section] = clave.split('|');
      return { grade, section };
    });

    const nuevo = {
      id: `doc_${Date.now()}`,
      usuario: nuevoUserDocente.trim().toLowerCase(),
      clave: nuevaClaveDocente,
      rol: 'docente',
      nombre: nuevoNombreDocente.trim(),
      aulasAsignadas: aulasAsignadas
    };

    setUsuarios(prev => [...prev, nuevo]);
    setNuevoNombreDocente('');
    setNuevoUserDocente('');
    setNuevaClaveDocente('');
    setAulasSeleccionadasNuevas([]);
    setMensajeAdmin('✅ Docente creado exitosamente.');
    setTimeout(() => setMensajeAdmin(''), 3000);
  };

  const eliminarDocente = (id) => {
    if (window.confirm('¿Está seguro de revocar el acceso a este docente?')) {
      setUsuarios(prev => prev.filter(u => u.id !== id));
    }
  };

  const registrarAlumnoNuevo = (e) => {
    e.preventDefault();
    if (!nuevoNombreAlumno.trim()) return;

    const nuevo = {
      id: Date.now(),
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
  };

  const retirarAlumno = (id, nombre) => {
    if (window.confirm(`¿Confirmas el retiro definitivo del estudiante "${nombre}"?`)) {
      setEstudiantes(prev => prev.filter(e => e.id !== id));
    }
  };

  const guardarEdicionCelular = (e) => {
    e.preventDefault();
    if (!alumnoEditando) return;
    setEstudiantes(prev => prev.map(a => 
      a.id === alumnoEditando.id ? { ...a, phone: nuevoTelefonoEdit.trim() } : a
    ));
    setAlumnoEditando(null);
    setNuevoTelefonoEdit('');
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

  // =========================================================================
  // CASO 1: PANTALLA VIRGEN / PRIMER REGISTRO DE LA DIRECCIÓN
  // =========================================================================
  if (!existeDirector) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          
          <div className="bg-emerald-800 p-6 text-center text-white">
            <div className="w-16 h-16 bg-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-emerald-700">
              <Sparkles className="w-9 h-9 text-emerald-300" />
            </div>
            <h1 className="text-xl font-black tracking-tight">Bienvenido a EduAsistencia</h1>
            <p className="text-xs text-emerald-200 mt-1">Configuración Inicial del Colegio</p>
          </div>

          <form onSubmit={registrarPrimerDirector} className="p-5 sm:p-6 space-y-3.5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 font-medium leading-relaxed">
              El sistema se encuentra <b>completamente limpio</b>. Como primer paso, registre la cuenta del <b>Director / Administrador General</b>.
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
                placeholder="Ej: Lic. Wilder Huamán Quispe"
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
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña Maestra</label>
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3.5 rounded-xl shadow-lg text-sm flex items-center justify-center gap-2 transition mt-2"
            >
              <KeyRound className="w-4 h-4" /> Activar Sistema y Crear Director
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASO 2: LOGIN NORMAL DEL COLEGIO
  // ==========================================
  if (!usuarioAutenticado) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          <div className="bg-emerald-700 p-5 sm:p-6 text-center text-white">
            <div className="w-14 h-14 bg-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <School className="w-8 h-8 text-emerald-200" />
            </div>
            <h1 className="text-xl font-black tracking-tight">EduAsistencia</h1>
            <p className="text-xs text-emerald-200 mt-0.5">Control de Asistencia Escolar</p>
          </div>

          <form onSubmit={handleLogin} className="p-4 sm:p-6 space-y-4">
            
            {!estaEnLinea ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold p-2.5 rounded-xl flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Modo Sin Señal: Ingreso habilitado en este equipo.</span>
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold p-2 rounded-xl flex items-center justify-center gap-1.5 border border-emerald-100">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Acceso Móvil Habilitado</span>
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
                  href={`https://wa.me/51964123456?text=${encodeURIComponent('Hola Dirección, solicito recuperar mi clave de acceso al sistema de asistencia.')}`}
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

  // ==========================================
  // CASO 3: APLICACIÓN PRINCIPAL EN FUNCIONAMIENTO
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-12">
      
      {/* BANNERS DE CONEXIÓN */}
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

      {/* CABECERA */}
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 bg-emerald-800 rounded-xl flex items-center justify-center shrink-0 border border-emerald-600">
                <School className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black tracking-tight leading-none truncate">EduAsistencia</h1>
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

        {/* PESTAÑAS */}
        <div className="max-w-2xl mx-auto flex text-center border-t border-emerald-600/60 bg-emerald-800/40">
          {(usuarioAutenticado.rol === 'director' || usuarioAutenticado.rol === 'docente') && (
            <button 
              onClick={() => setRolActivo('docente')}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                rolActivo === 'docente' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" /> 
              <span>En Aula</span>
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-2xl mx-auto w-full px-3.5 pt-3.5 flex-1">
        
        {/* AULA DOCENTE */}
        {rolActivo === 'docente' && (
          <div className="space-y-3.5">
            {aulasPermitidasDocente.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
                <School className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">No hay aulas asignadas</h3>
                <p className="text-xs text-slate-500 mt-1">
                  La Dirección debe registrar o importar estudiantes desde el Panel de Director.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 
                      {esDirector ? 'Modo Auditoría' : `Tus Aulas (${aulasPermitidasDocente.length})`}
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
                    {aulasPermitidasDocente.map(a => (
                      <option key={`${a.grade}|${a.section}`} value={`${a.grade}|${a.section}`}>
                        {a.grade} - {a.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800 flex items-center gap-1.5 flex-1">
                    <span>Estado:</span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold text-[11px]">P</span>
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-bold text-[11px]">T</span>
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-bold text-[11px]">F</span>
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
                      No hay alumnos en esta sección ({gradoSel} - {seccionSel}).
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
                                : 'bg-rose-50/80 border-rose-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="text-xs font-black text-slate-400 w-5 shrink-0">#{index + 1}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-xs sm:text-sm leading-tight truncate">{alumno.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {alumno.dni ? `DNI: ${alumno.dni} • ` : ''}Apod: {alumno.phone}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
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

        {/* PUERTA (AUXILIAR) */}
        {rolActivo === 'auxiliar' && (
          <div className="space-y-3.5">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">Control de Ingreso Matutino</h2>
                <div className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" /> 8:00 AM
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">
                Busque por <b>DNI</b> o <b>Apellido</b>:
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
                      {alumno.dni ? `DNI: ${alumno.dni} • ` : ''}
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

        {/* PANEL DIRECTOR */}
        {rolActivo === 'director' && (
          <div className="space-y-3.5">
            
            <div className="flex bg-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setPestanaDirector('metricas')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  pestanaDirector === 'metricas' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 Reportes Excel
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
                👥 Aulas
              </button>
            </div>

            {/* SECCIÓN REPORTES */}
            {pestanaDirector === 'metricas' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Presentes</p>
                    <p className="text-xl font-black text-emerald-600">{metricasDirector.presentesHoy}</p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tardanzas</p>
                    <p className="text-xl font-black text-amber-500">{metricasDirector.tardanzasHoy}</p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Faltas</p>
                    <p className="text-xl font-black text-rose-600">{metricasDirector.faltasHoy}</p>
                  </div>
                </div>

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
                            <input
                              type="text"
                              value={filtroSeccionReporte}
                              onChange={(e) => setFiltroSeccionReporte(e.target.value.toUpperCase())}
                              placeholder="Ej: A"
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                            />
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

                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Alertas (3+ Tardanzas/Faltas)</h3>
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
                            <div className="flex gap-1.5 mt-0.5">
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded">
                                {alumno.tardanzasMes} T
                              </span>
                              <span className="text-[9px] font-bold text-rose-800 bg-rose-200/80 px-1.5 py-0.2 rounded">
                                {alumno.faltasMes} F
                              </span>
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

            {/* PADRÓN Y ALUMNOS */}
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
                      <span>Carga Masiva Excel (.xlsx)</span>
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
                    <p className="text-xs text-slate-500 text-center py-4">No hay estudiantes cargados. Suba el archivo de Excel arriba.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {alumnosFiltradosDirector.map(alumno => (
                        <div key={alumno.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{alumno.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              {alumno.dni ? `DNI: ${alumno.dni} • ` : ''}
                              <span className="font-semibold text-emerald-700">{alumno.grade} - {alumno.section}</span>
                            </p>
                            <p className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" /> {alumno.phone}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setAlumnoEditando(alumno);
                                setNuevoTelefonoEdit(alumno.phone);
                              }}
                              className="bg-blue-50 text-blue-700 p-2 rounded-lg text-xs font-bold"
                              title="Editar celular"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => retirarAlumno(alumno.id, alumno.name)}
                              className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"
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
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 text-sm">Editar Celular</h4>
                        <button onClick={() => setAlumnoEditando(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mb-3 truncate">
                        Alumno: <b>{alumnoEditando.name}</b>
                      </p>
                      <form onSubmit={guardarEdicionCelular} className="space-y-3">
                        <input
                          type="tel"
                          value={nuevoTelefonoEdit}
                          onChange={(e) => setNuevoTelefonoEdit(e.target.value)}
                          required
                          placeholder="Ej: 964123456"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow"
                        >
                          Guardar Número
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GESTIÓN DE DOCENTES Y REINICIO */}
            {pestanaDirector === 'docentes' && (
              <div className="space-y-3.5">
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-2.5 text-xs">
                    <UserPlus className="w-4 h-4" />
                    <h3>Registrar Docente y Asignar Aulas</h3>
                  </div>

                  {mensajeAdmin && (
                    <div className="mb-2.5 p-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {mensajeAdmin}
                    </div>
                  )}

                  <form onSubmit={registrarDocente} className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="Nombre y Especialidad"
                      value={nuevoNombreDocente}
                      onChange={(e) => setNuevoNombreDocente(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Usuario"
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
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Marcar aulas que dictará ({aulasSeleccionadasNuevas.length} elegidas):
                      </label>
                      {todasLasAulasColegio.length === 0 ? (
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">Primero suba el archivo de alumnos en la pestaña Padrón para que aparezcan las aulas.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                          {todasLasAulasColegio.map(aula => {
                            const clave = `${aula.grade}|${aula.section}`;
                            const estaMarcada = aulasSeleccionadasNuevas.includes(clave);
                            return (
                              <button
                                type="button"
                                key={clave}
                                onClick={() => alternarSeleccionAula(clave)}
                                className={`p-2 rounded-lg text-xs font-bold border text-left flex items-center justify-between ${
                                  estaMarcada 
                                    ? 'bg-emerald-600 text-white border-emerald-700' 
                                    : 'bg-white text-slate-700 border-slate-300'
                                }`}
                              >
                                <span className="truncate">{aula.grade} - {aula.section}</span>
                                {estaMarcada && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <UserPlus className="w-4 h-4" /> Crear Cuenta Docente
                    </button>
                  </form>
                </div>

                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2.5">
                    Docentes Registrados
                  </h3>

                  <div className="space-y-2">
                    {usuarios.filter(u => u.rol === 'docente').map(doc => (
                      <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{doc.nombre}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            User: <b>{doc.usuario}</b> | Clave: <code>{doc.clave}</code>
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {doc.aulasAsignadas && doc.aulasAsignadas.length > 0 ? (
                              doc.aulasAsignadas.map((a, i) => (
                                <span key={i} className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                  {a.grade} - {a.section}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-400">Sin salones</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => eliminarDocente(doc.id)}
                          className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg shrink-0"
                          title="Revocar acceso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ZONA DE SEGURIDAD / RESETEO TOTAL */}
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
                  <h4 className="text-xs font-bold text-rose-800 uppercase mb-1">Zona de Entrega del Software</h4>
                  <p className="text-[11px] text-rose-700 mb-2.5">
                    Si desea entregar el sistema en blanco para que el Director sea el primero en configurarlo:
                  </p>
                  <button
                    onClick={restablecerSistemaDeFabrica}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Dejar Sistema Virgen de Fábrica
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* BOTÓN SECUNDARIO DE SALIDA */}
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
