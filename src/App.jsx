import { supabase } from './supabase';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, AlertTriangle, Phone, 
  MessageCircle, Search, Calendar, School, ShieldAlert, 
  FileSpreadsheet, Check, Lock, LogOut, UserCheck, Eye, EyeOff, 
  HelpCircle, X, Download, UserPlus, Trash2, ShieldCheck, BookOpen,
  Upload, Edit, Plus, UserMinus
} from 'lucide-react';

// Cuentas del personal
const USUARIOS_BASE = [
  { 
    id: 'dir_1', 
    usuario: 'director', 
    clave: 'dir2026', 
    rol: 'director', 
    nombre: 'Dirección General',
    gradoAsignado: 'TODOS',
    seccionAsignada: 'TODAS'
  },
  { 
    id: 'aux_1', 
    usuario: 'auxiliar', 
    clave: 'aux2026', 
    rol: 'auxiliar', 
    nombre: 'Auxiliar de Puerta',
    gradoAsignado: 'TODOS',
    seccionAsignada: 'TODAS'
  },
  { 
    id: 'doc_1', 
    usuario: 'profesor1', 
    clave: 'doc2026', 
    rol: 'docente', 
    nombre: 'Prof. Carlos Mendoza',
    gradoAsignado: 'PRIMERO',
    seccionAsignada: 'RESPONSABILIDD'
  },
  { 
    id: 'doc_2', 
    usuario: 'docente', 
    clave: 'doc2026', 
    rol: 'docente', 
    nombre: 'Prof. Rosa Huamán',
    gradoAsignado: 'SEGUNDO',
    seccionAsignada: 'ANDRES AVELINO CACERES'
  }
];

const ESTUDIANTES_INICIALES = [
  { id: 1, dni: '74125801', name: 'ALVARADO PAUCAR JOSHUA SAMIR', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123451' },
  { id: 2, dni: '74125802', name: 'ATOCCSA ARANCEL JORAN DAVID', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123452' },
  { id: 3, dni: '74125803', name: 'AUCAYAURI BERROCAL HENRRY', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123453' },
  { id: 4, dni: '74125804', name: 'AYUQUE CAHUAYA VICTOR RAUL', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123454' },
  { id: 5, dni: '74125805', name: 'CAPCHA LLANO JHEREMY JAMPOOL', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123455' },
  { id: 6, dni: '74125806', name: 'CONCHA SOTO AHIDAN SANTOS', grade: 'PRIMERO', section: 'RESPONSABILIDD', phone: '964123456' },
  { id: 7, dni: '74125807', name: 'ALFONSO DE LA CRUZ ANGEL GABRIEL', grade: 'SEGUNDO', section: 'ANDRES AVELINO CACERES', phone: '964234561' },
  { id: 8, dni: '74125808', name: 'BARRETO CONDOR KEVIN SMITH', grade: 'SEGUNDO', section: 'ANDRES AVELINO CACERES', phone: '964234562' },
  { id: 9, dni: '74125809', name: 'CARDENAS PAUCAR EDSON LEONEL', grade: 'SEGUNDO', section: 'ANDRES AVELINO CACERES', phone: '964234563' },
  { id: 10, dni: '74125810', name: 'CASAS OSORES JAIRO FABRIZIO', grade: 'SEGUNDO', section: 'ANDRES AVELINO CACERES', phone: '964234564' },
  { id: 11, dni: '74125811', name: 'AGUIRRE QUISPE LUIS ENRIQUE', grade: 'TERCERO', section: 'CESAR VALLEJO', phone: '964345671' },
  { id: 12, dni: '74125812', name: 'ARROYO MATAMOROS DIEGO ARMANDO', grade: 'TERCERO', section: 'CESAR VALLEJO', phone: '964345672' },
  { id: 13, dni: '74125813', name: 'CABRERA MEZA JHONATAN', grade: 'TERCERO', section: 'CESAR VALLEJO', phone: '964345673' },
  { id: 14, dni: '74125814', name: 'GOMEZ ROJAS KEVIN DANIEL', grade: 'TERCERO', section: 'CESAR VALLEJO', phone: '964345674' },
  { id: 15, dni: '74125815', name: 'BAUTISTA DE LA CRUZ JHON', grade: 'CUARTO', section: 'NIKOLA TESLA', phone: '964456781' },
  { id: 16, dni: '74125816', name: 'CHAHUA HUAMAN CRISTIAN', grade: 'CUARTO', section: 'NIKOLA TESLA', phone: '964456782' },
  { id: 17, dni: '74125817', name: 'DIAZ MENDOZA JHAN PIERO', grade: 'CUARTO', section: 'NIKOLA TESLA', phone: '964456783' },
  { id: 18, dni: '74125818', name: 'ARIAS CCANTO MIGUEL ANGEL', grade: 'QUINTO', section: 'SOCRATES', phone: '964567891' },
  { id: 19, dni: '74125819', name: 'CCORA TAYPE JUAN CARLOS', grade: 'QUINTO', section: 'SOCRATES', phone: '964567892' },
  { id: 20, dni: '74125820', name: 'QUISPE MENDOZA FLOR MARIA', grade: 'QUINTO', section: 'SOCRATES', phone: '964567893' },
];

export default function App() {
  // Lista de usuarios y asignaciones administrada por el Director
  const [usuarios, setUsuarios] = useState(() => {
    const local = localStorage.getItem('colegio_usuarios_v3');
    return local ? JSON.parse(local) : USUARIOS_BASE;
  });

  useEffect(() => {
    localStorage.setItem('colegio_usuarios_v3', JSON.stringify(usuarios));
  }, [usuarios]);

  // Sesión y Login
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => {
    const sesion = localStorage.getItem('colegio_sesion_v3');
    return sesion ? JSON.parse(sesion) : null;
  });

  const [inputUsuario, setInputUsuario] = useState('');
  const [inputClave, setInputClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');

  // Estudiantes en el Padrón Escolar
  const [estudiantes, setEstudiantes] = useState(() => {
    const local = localStorage.getItem('colegio_estudiantes_v3');
    return local ? JSON.parse(local) : ESTUDIANTES_INICIALES;
  });

  useEffect(() => {
    localStorage.setItem('colegio_estudiantes_v3', JSON.stringify(estudiantes));
  }, [estudiantes]);

  const [fechaHoy, setFechaHoy] = useState(new Date().toISOString().split('T')[0]);
  const [rolActivo, setRolActivo] = useState('docente');

  const [asistencias, setAsistencias] = useState(() => {
    const local = localStorage.getItem('colegio_asistencias');
    return local ? JSON.parse(local) : {};
  });

  // Cargar asistencias desde Supabase
  useEffect(() => {
    const cargarDesdeSupabase = async () => {
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
        console.error('Error al sincronizar con Supabase:', err);
      }
    };
    cargarDesdeSupabase();
  }, []);

  useEffect(() => {
    localStorage.setItem('colegio_asistencias', JSON.stringify(asistencias));
  }, [asistencias]);

  // Manejo de Login
  const handleLogin = (e) => {
    e.preventDefault();
    const encontrado = usuarios.find(
      u => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.clave === inputClave
    );

    if (encontrado) {
      setUsuarioAutenticado(encontrado);
      setRolActivo(encontrado.rol);
      localStorage.setItem('colegio_sesion_v3', JSON.stringify(encontrado));
      setErrorLogin('');
      setInputClave('');
    } else {
      setErrorLogin('Credenciales inválidas. Verifique su usuario o contraseña.');
    }
  };

  const handleLogout = () => {
    setUsuarioAutenticado(null);
    localStorage.removeItem('colegio_sesion_v3');
  };

  // CONTROL DE ACCESO A AULAS
  const esDirector = usuarioAutenticado?.rol === 'director';

  const gradosDisponibles = useMemo(() => {
    if (esDirector) {
      return [...new Set(estudiantes.map(e => e.grade))];
    }
    return [usuarioAutenticado?.gradoAsignado || 'PRIMERO'];
  }, [estudiantes, esDirector, usuarioAutenticado]);

  const [gradoSel, setGradoSel] = useState('PRIMERO');

  useEffect(() => {
    if (usuarioAutenticado) {
      if (!esDirector) {
        setGradoSel(usuarioAutenticado.gradoAsignado);
      } else {
        setGradoSel(gradosDisponibles[0] || 'PRIMERO');
      }
    }
  }, [usuarioAutenticado, esDirector, gradosDisponibles]);

  const seccionesDisponibles = useMemo(() => {
    if (esDirector) {
      return [...new Set(estudiantes.filter(e => e.grade === gradoSel).map(e => e.section))];
    }
    return [usuarioAutenticado?.seccionAsignada || 'RESPONSABILIDD'];
  }, [estudiantes, gradoSel, esDirector, usuarioAutenticado]);

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

  // Guardar asistencia en Supabase
  const guardarAsistenciaAula = async () => {
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

    try {
      const seccionCompleta = `${gradoSel} - ${seccionSel}`;
      const filas = alumnosAula.map(alumno => ({
        fecha: fechaHoy,
        estudiante_id: alumno.id,
        estudiante_nombre: alumno.name,
        seccion: seccionCompleta,
        estado: asistenciaAula[alumno.id] || 'P',
        registrado_por: usuarioAutenticado?.nombre || 'Docente'
      }));

      await supabase
        .from('asistencias')
        .delete()
        .eq('fecha', fechaHoy)
        .eq('seccion', seccionCompleta);

      await supabase.from('asistencias').insert(filas);
    } catch (err) {
      console.error('Error al sincronizar con Supabase:', err);
    }
  };

  // ==========================================
  // CONTROL DE PUERTA INTELIGENTE (HORARIO LÍMITE 8:00 AM)
  // ==========================================
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
    ).slice(0, 6);
  }, [busquedaAux, estudiantes]);

  // Registro en puerta con cálculo automático según la hora (límite 8:00 AM)
  const registrarIngresoPuerta = async (alumno) => {
    const ahora = new Date();
    const horas = ahora.getHours();
    const minutos = ahora.getMinutes();
    const horaTexto = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Regla: Hasta las 8:00 AM es Presente (Puntual). A partir de las 8:01 AM es Tardanza (T)
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

    try {
      await supabase
        .from('asistencias')
        .delete()
        .eq('fecha', fechaHoy)
        .eq('estudiante_id', alumno.id);

      await supabase.from('asistencias').insert([{
        fecha: fechaHoy,
        estudiante_id: alumno.id,
        estudiante_nombre: alumno.name,
        seccion: `${alumno.grade} - ${alumno.section}`,
        estado: estadoAsignado,
        registrado_por: usuarioAutenticado?.nombre || 'Auxiliar de Puerta'
      }]);
    } catch (err) {
      console.error('Error al registrar ingreso en Supabase:', err);
    }
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

  // Exportar Excel (.csv con UTF-8 BOM)
  const exportarAExcel = (tipo = 'aula') => {
    let csv = '\uFEFF';

    if (tipo === 'aula') {
      csv += `REPORTE DE ASISTENCIA - ${gradoSel} ${seccionSel}\n`;
      csv += `Docente a cargo: ${usuarioAutenticado?.nombre}\n`;
      csv += `Fecha: ${fechaHoy}\n\n`;
      csv += `N°,DNI,ESTUDIANTE,ESTADO,HORA REGISTRO,TELÉFONO APODERADO\n`;

      const diaActual = asistencias[fechaHoy] || {};
      alumnosAula.forEach((alumno, index) => {
        const est = diaActual[alumno.id]?.status || 'P';
        const hora = diaActual[alumno.id]?.time || '--:--';
        const estadoDesc = est === 'P' ? 'PRESENTE' : est === 'T' ? 'TARDANZA' : 'FALTA';
        csv += `"${index + 1}","${alumno.dni || ''}","${alumno.name}","${estadoDesc}","${hora}","${alumno.phone}"\n`;
      });

      descargarArchivo(csv, `Asistencia_${gradoSel}_${seccionSel}_${fechaHoy}.csv`);
    } else if (tipo === 'general_dia') {
      csv += `CONSOLIDADO GENERAL DE ASISTENCIA DEL COLEGIO\n`;
      csv += `Fecha: ${fechaHoy}\n\n`;
      csv += `N°,DNI,ESTUDIANTE,GRADO,SECCIÓN,ESTADO,HORA,TELÉFONO\n`;

      const diaActual = asistencias[fechaHoy] || {};
      estudiantes.forEach((alumno, index) => {
        const est = diaActual[alumno.id]?.status || 'P';
        const hora = diaActual[alumno.id]?.time || '--:--';
        const estadoDesc = est === 'P' ? 'PRESENTE' : est === 'T' ? 'TARDANZA' : 'FALTA';
        csv += `"${index + 1}","${alumno.dni || ''}","${alumno.name}","${alumno.grade}","${alumno.section}","${estadoDesc}","${hora}","${alumno.phone}"\n`;
      });

      descargarArchivo(csv, `Reporte_General_Colegio_${fechaHoy}.csv`);
    } else if (tipo === 'incidencias') {
      csv += `REPORTE MENSUAL DE ESTUDIANTES EN RIESGO (3+ FALTAS O TARDANZAS)\n`;
      csv += `Generado el: ${fechaHoy}\n\n`;
      csv += `N°,DNI,ESTUDIANTE,GRADO,SECCIÓN,TARDANZAS MES,FALTAS MES,CONDICIÓN,TELÉFONO\n`;

      metricasDirector.enRiesgo.forEach((alumno, index) => {
        csv += `"${index + 1}","${alumno.dni || ''}","${alumno.name}","${alumno.grade}","${alumno.section}","${alumno.tardanzasMes}","${alumno.faltasMes}","EN RIESGO DISCIPLINARIO","${alumno.phone}"\n`;
      });

      descargarArchivo(csv, `Reporte_Estudiantes_En_Riesgo_${fechaHoy}.csv`);
    }
  };

  const descargarPlantillaCSV = () => {
    let plantilla = '\uFEFF';
    plantilla += `DNI,NOMBRE,GRADO,SECCION,TELEFONO\n`;
    plantilla += `74125890,RODRIGUEZ LOPEZ MARIO,PRIMERO,RESPONSABILIDD,964112233\n`;
    plantilla += `74125891,FLORES QUISPE DIANA,SEGUNDO,ANDRES AVELINO CACERES,964223344\n`;
    descargarArchivo(plantilla, `Plantilla_Alumnos_Colegio.csv`);
  };

  const descargarArchivo = (contenido, nombreArchivo) => {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // ==========================================
  // PANEL ADMINISTRADOR (DIRECTOR): GESTIÓN COMPLETA
  // ==========================================
  const [pestanaDirector, setPestanaDirector] = useState('metricas'); // 'metricas' | 'docentes' | 'alumnos'
  
  // Docentes
  const [nuevoNombreDocente, setNuevoNombreDocente] = useState('');
  const [nuevoUserDocente, setNuevoUserDocente] = useState('');
  const [nuevaClaveDocente, setNuevaClaveDocente] = useState('');
  const [nuevoGradoDocente, setNuevoGradoDocente] = useState('PRIMERO');
  const [nuevaSeccionDocente, setNuevaSeccionDocente] = useState('RESPONSABILIDD');
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  // Alumnos
  const [busquedaDirector, setBusquedaDirector] = useState('');
  const [nuevoDniAlumno, setNuevoDniAlumno] = useState('');
  const [nuevoNombreAlumno, setNuevoNombreAlumno] = useState('');
  const [nuevoGradoAlumno, setNuevoGradoAlumno] = useState('PRIMERO');
  const [nuevaSeccionAlumno, setNuevaSeccionAlumno] = useState('RESPONSABILIDD');
  const [nuevoCelularAlumno, setNuevoCelularAlumno] = useState('');
  
  // Modal Edición Celular
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [nuevoTelefonoEdit, setNuevoTelefonoEdit] = useState('');

  const registrarDocente = (e) => {
    e.preventDefault();
    if (!nuevoNombreDocente || !nuevoUserDocente || !nuevaClaveDocente) return;

    if (usuarios.some(u => u.usuario.toLowerCase() === nuevoUserDocente.trim().toLowerCase())) {
      setMensajeAdmin('⚠️ Ese nombre de usuario ya está en uso. Elija otro.');
      return;
    }

    const nuevo = {
      id: `doc_${Date.now()}`,
      usuario: nuevoUserDocente.trim().toLowerCase(),
      clave: nuevaClaveDocente,
      rol: 'docente',
      nombre: nuevoNombreDocente.trim(),
      gradoAsignado: nuevoGradoDocente,
      seccionAsignada: nuevaSeccionDocente
    };

    setUsuarios(prev => [...prev, nuevo]);
    setNuevoNombreDocente('');
    setNuevoUserDocente('');
    setNuevaClaveDocente('');
    setMensajeAdmin('✅ Docente registrado y aula asignada correctamente.');
    setTimeout(() => setMensajeAdmin(''), 3000);
  };

  const eliminarDocente = (id) => {
    if (window.confirm('¿Está seguro de revocar el acceso a este docente?')) {
      setUsuarios(prev => prev.filter(u => u.id !== id));
    }
  };

  // Agregar alumno individual
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
    setMensajeAdmin('✅ Alumno matriculado y agregado al padrón.');
    setTimeout(() => setMensajeAdmin(''), 3000);
  };

  // Retirar alumno
  const retirarAlumno = (id, nombre) => {
    if (window.confirm(`¿Confirmas el retiro o baja del estudiante "${nombre}" del colegio?`)) {
      setEstudiantes(prev => prev.filter(e => e.id !== id));
    }
  };

  // Guardar nuevo celular del apoderado
  const guardarEdicionCelular = (e) => {
    e.preventDefault();
    if (!alumnoEditando) return;
    setEstudiantes(prev => prev.map(a => 
      a.id === alumnoEditando.id ? { ...a, phone: nuevoTelefonoEdit.trim() } : a
    ));
    setAlumnoEditando(null);
    setNuevoTelefonoEdit('');
  };

  // Importar Excel (CSV)
  const procesarArchivoCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lineas = text.split(/\r?\n/).filter(l => l.trim() !== '');
        
        if (lineas.length <= 1) {
          alert('El archivo no contiene filas de estudiantes.');
          return;
        }

        const delimitador = lineas[0].includes(';') ? ';' : ',';
        const nuevosCargados = [];

        for (let i = 1; i < lineas.length; i++) {
          const columnas = lineas[i].split(delimitador).map(c => c.replace(/^"|"$/g, '').trim());
          if (columnas.length >= 3 && columnas[1]) {
            nuevosCargados.push({
              id: Date.now() + i,
              dni: columnas[0] || 'S/D',
              name: columnas[1].toUpperCase(),
              grade: (columnas[2] || 'PRIMERO').toUpperCase(),
              section: (columnas[3] || 'RESPONSABILIDD').toUpperCase(),
              phone: columnas[4] || '999999999'
            });
          }
        }

        if (nuevosCargados.length > 0) {
          setEstudiantes(prev => [...prev, ...nuevosCargados]);
          alert(`¡Éxito! Se cargaron e incorporaron ${nuevosCargados.length} estudiantes desde el archivo.`);
        } else {
          alert('No se pudo leer el formato. Descargue la plantilla de ejemplo para guiarse.');
        }
      } catch (err) {
        alert('Hubo un error al procesar el archivo. Asegúrese de que sea formato CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtro de búsqueda del Director (DNI, Nombre, Grado, Sección)
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

  // ==========================================
  // PANTALLA DE LOGIN
  // ==========================================
  if (!usuarioAutenticado) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-emerald-700 p-6 text-center text-white">
            <div className="w-16 h-16 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <School className="w-9 h-9 text-emerald-200" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">EduAsistencia</h1>
            <p className="text-xs text-emerald-200 mt-1">Portal Oficial del Personal Docente y Administrativo</p>
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
                placeholder="Ingrese su usuario asignado"
                value={inputUsuario}
                onChange={(e) => setInputUsuario(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={mostrarClave ? "text" : "password"} 
                  placeholder="••••••••"
                  value={inputClave}
                  onChange={(e) => setInputClave(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave(!mostrarClave)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  title={mostrarClave ? "Ocultar" : "Mostrar"}
                >
                  {mostrarClave ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5 text-slate-500" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3 rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition-all mt-3"
            >
              <Lock className="w-4 h-4" /> Iniciar Sesión
            </button>
          </form>
        </div>

        {/* MODAL RECUPERAR CONTRASEÑA */}
        {modalRecuperar && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <HelpCircle className="w-5 h-5" />
                  <h3>Recuperar Contraseña</h3>
                </div>
                <button 
                  onClick={() => setModalRecuperar(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Por motivos de seguridad institucional, las credenciales son administradas por la Dirección. Comuníquese directamente para solicitar su restablecimiento.
              </p>

              <div className="space-y-2">
                <a
                  href={`https://wa.me/51964123456?text=${encodeURIComponent('Hola Dirección, solicito la recuperación de mi clave de acceso para el sistema de asistencia escolar.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow"
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
  // PANTALLA PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-16">
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-emerald-200" />
            <div>
              <h1 className="text-base font-bold leading-tight">EduAsistencia</h1>
              <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> {usuarioAutenticado.nombre} 
                <span className="bg-emerald-800/80 px-1.5 py-0.2 rounded text-[10px] uppercase font-bold">
                  {usuarioAutenticado.rol}
                </span>
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
              title="Cerrar Sesión"
              className="bg-emerald-900/80 hover:bg-rose-700 p-1.5 rounded-lg text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div className="max-w-2xl mx-auto flex text-center border-t border-emerald-600/50">
          {(usuarioAutenticado.rol === 'director' || usuarioAutenticado.rol === 'docente') && (
            <button 
              onClick={() => setRolActivo('docente')}
              className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rolActivo === 'docente' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Users className="w-4 h-4" /> Asistencia en Aula
            </button>
          )}

          {(usuarioAutenticado.rol === 'director' || usuarioAutenticado.rol === 'auxiliar') && (
            <button 
              onClick={() => setRolActivo('auxiliar')}
              className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rolActivo === 'auxiliar' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500' : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Clock className="w-4 h-4" /> Control Puerta (8:00 AM)
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
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 pt-4 flex-1">
        
        {/* VISTA DOCENTE */}
        {rolActivo === 'docente' && (
          <div className="space-y-4">
            {!esDirector ? (
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                    Aula Asignada por Dirección
                  </span>
                  <h3 className="text-base font-black text-slate-800 mt-1">
                    {gradoSel} - {seccionSel}
                  </h3>
                  <p className="text-xs text-slate-500">Permisos exclusivos para calificar este salón.</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200 text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            ) : (
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-amber-700 bg-amber-50 p-1.5 rounded-lg">
                  <ShieldAlert className="w-4 h-4" /> Modo Supervisión (Director): Puedes auditar cualquier aula
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Grado</label>
                    <select 
                      value={gradoSel} 
                      onChange={(e) => setGradoSel(e.target.value)}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700 text-sm"
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
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700 text-sm"
                    >
                      {seccionesDisponibles.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800 flex items-center gap-2 flex-1">
                <span>Estado:</span>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">P</span>
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-bold">T</span>
                <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-bold">F</span>
              </div>

              <button
                onClick={() => exportarAExcel('aula')}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-2.5 rounded-lg flex items-center gap-1.5 shadow transition-all shrink-0"
                title="Descargar lista de asistencia en Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Exportar Excel
              </button>
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
                        <p className="text-[11px] text-slate-500">
                          {alumno.dni ? `DNI: ${alumno.dni} • ` : ''}Apoderado: {alumno.phone}
                        </p>
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
                    <Check className="w-6 h-6 text-white" /> ¡Asistencia Guardada en la Nube!
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

        {/* VISTA AUXILIAR: PUERTA CON HORARIO LÍMITE (8:00 AM) */}
        {rolActivo === 'auxiliar' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-slate-800 text-base">Control de Ingreso en Puerta</h2>
                <div className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Límite: 8:00 AM
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Busque por <b>DNI</b> o <b>Apellido</b>. El sistema clasificará en <b>Puntual</b> o <b>Tardanza</b> automáticamente según la hora:
              </p>
              
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Escriba DNI o Apellidos del alumno..."
                  value={busquedaAux}
                  onChange={(e) => setBusquedaAux(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {mensajePuerta && (
                <div className="mt-3 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold p-3 rounded-lg text-sm text-center animate-pulse">
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
                    <p className="text-xs text-slate-500">
                      {alumno.dni ? `DNI: ${alumno.dni} • ` : ''}
                      <span className="text-emerald-700 font-semibold">{alumno.grade} - {alumno.section}</span>
                    </p>
                  </div>

                  <button 
                    onClick={() => registrarIngresoPuerta(alumno)}
                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow"
                  >
                    <UserCheck className="w-4 h-4" /> Marcar Ingreso
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PANEL DIRECTOR / ADMINISTRADOR */}
        {rolActivo === 'director' && (
          <div className="space-y-4">
            
            {/* SUB-MENU DIRECTOR */}
            <div className="flex bg-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setPestanaDirector('metricas')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  pestanaDirector === 'metricas' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 Asistencias
              </button>
              <button
                onClick={() => setPestanaDirector('alumnos')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  pestanaDirector === 'alumnos' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎓 Padrón y Alumnos
              </button>
              <button
                onClick={() => setPestanaDirector('docentes')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  pestanaDirector === 'docentes' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Asignar Aulas
              </button>
            </div>

            {/* SUBPESTAÑA: GESTIÓN COMPLETA DE ALUMNOS (PADRÓN, BUSCADOR DNI, EXCEL, EDITAR CELULAR) */}
            {pestanaDirector === 'alumnos' && (
              <div className="space-y-4">
                
                {/* BUSCADOR GENERAL DE ALUMNOS (DNI, NOMBRE, GRADO) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-600" /> Buscador Institucional de Alumnos
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por DNI, Apellidos, Nombres o Grado..."
                      value={busquedaDirector}
                      onChange={(e) => setBusquedaDirector(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* BOTONES DE IMPORTACIÓN EXCEL / CSV Y PLANTILLA */}
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>Carga Masiva de Alumnos desde Excel</span>
                    </div>
                    <button
                      onClick={descargarPlantillaCSV}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Plantilla (.csv)
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800 mb-3">
                    Guarda tu Excel como archivo <b>CSV (delimitado por comas)</b> y súbelo para cargar todos los alumnos del colegio de una sola vez.
                  </p>
                  
                  <label className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition">
                    <Upload className="w-4 h-4" /> Subir archivo de alumnos (.csv)
                    <input 
                      type="file" 
                      accept=".csv, text/csv, text/plain" 
                      onChange={procesarArchivoCSV}
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* REGISTRAR ALUMNO INDIVIDUAL */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase mb-3">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Matricular Alumno Individual</span>
                  </div>

                  <form onSubmit={registrarAlumnoNuevo} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">DNI del Alumno</label>
                        <input
                          type="text"
                          placeholder="8 dígitos"
                          maxLength={8}
                          value={nuevoDniAlumno}
                          onChange={(e) => setNuevoDniAlumno(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Nombre Completo</label>
                        <input
                          type="text"
                          placeholder="APELLIDOS Y NOMBRES"
                          value={nuevoNombreAlumno}
                          onChange={(e) => setNuevoNombreAlumno(e.target.value)}
                          required
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Grado</label>
                        <select
                          value={nuevoGradoAlumno}
                          onChange={(e) => setNuevoGradoAlumno(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                        >
                          <option value="PRIMERO">PRIMERO</option>
                          <option value="SEGUNDO">SEGUNDO</option>
                          <option value="TERCERO">TERCERO</option>
                          <option value="CUARTO">CUARTO</option>
                          <option value="QUINTO">QUINTO</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Sección</label>
                        <input
                          type="text"
                          placeholder="Nombre de sección"
                          value={nuevaSeccionAlumno}
                          onChange={(e) => setNuevaSeccionAlumno(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Celular Apoderado</label>
                        <input
                          type="tel"
                          placeholder="9 dígitos"
                          value={nuevoCelularAlumno}
                          onChange={(e) => setNuevoCelularAlumno(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" /> Agregar Alumno al Padrón
                    </button>
                  </form>
                </div>

                {/* LISTADO DE ESTUDIANTES ENCONTRADOS / TOTAL */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase">
                      Padrón Activo ({alumnosFiltradosDirector.length} estudiantes)
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {alumnosFiltradosDirector.map(alumno => (
                      <div key={alumno.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-800 text-xs sm:text-sm">{alumno.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {alumno.dni ? `DNI: ${alumno.dni} • ` : ''}
                            <span className="font-semibold text-emerald-700">{alumno.grade} - {alumno.section}</span>
                          </p>
                          <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" /> Apoderado: <b>{alumno.phone}</b>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setAlumnoEditando(alumno);
                              setNuevoTelefonoEdit(alumno.phone);
                            }}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 p-2 rounded-lg text-xs font-bold flex items-center gap-1"
                            title="Editar o aumentar celular"
                          >
                            <Edit className="w-3.5 h-3.5" /> Editar Cel
                          </button>
                          
                          <button
                            onClick={() => retirarAlumno(alumno.id, alumno.name)}
                            className="bg-rose-50 text-rose-700 hover:bg-rose-100 p-2 rounded-lg transition"
                            title="Dar de baja / Retirar alumno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MODAL DE EDICIÓN DE CELULAR */}
                {alumnoEditando && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 text-sm">Actualizar Celular de Apoderado</h4>
                        <button onClick={() => setAlumnoEditando(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">
                        Estudiante: <b>{alumnoEditando.name}</b>
                      </p>
                      <form onSubmit={guardarEdicionCelular} className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Nuevo Número de Celular</label>
                          <input
                            type="tel"
                            value={nuevoTelefonoEdit}
                            onChange={(e) => setNuevoTelefonoEdit(e.target.value)}
                            required
                            placeholder="Ej: 964123456"
                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs shadow"
                        >
                          Guardar Número
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBPESTAÑA: GESTIÓN DE DOCENTES */}
            {pestanaDirector === 'docentes' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold mb-3">
                    <UserPlus className="w-5 h-5" />
                    <h3>Designar Nueva Aula a Docente</h3>
                  </div>

                  {mensajeAdmin && (
                    <div className="mb-3 p-2.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {mensajeAdmin}
                    </div>
                  )}

                  <form onSubmit={registrarDocente} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Nombre Completo</label>
                        <input
                          type="text"
                          placeholder="Ej: Prof. Juan Pérez"
                          value={nuevoNombreDocente}
                          onChange={(e) => setNuevoNombreDocente(e.target.value)}
                          required
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Usuario para Login</label>
                        <input
                          type="text"
                          placeholder="Ej: juanperez"
                          value={nuevoUserDocente}
                          onChange={(e) => setNuevoUserDocente(e.target.value)}
                          required
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Contraseña</label>
                        <input
                          type="text"
                          placeholder="Clave de acceso"
                          value={nuevaClaveDocente}
                          onChange={(e) => setNuevaClaveDocente(e.target.value)}
                          required
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Grado Asignado</label>
                        <select
                          value={nuevoGradoDocente}
                          onChange={(e) => setNuevoGradoDocente(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                        >
                          <option value="PRIMERO">PRIMERO</option>
                          <option value="SEGUNDO">SEGUNDO</option>
                          <option value="TERCERO">TERCERO</option>
                          <option value="CUARTO">CUARTO</option>
                          <option value="QUINTO">QUINTO</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Sección Asignada</label>
                        <input
                          type="text"
                          placeholder="Sección asignada"
                          value={nuevaSeccionDocente}
                          onChange={(e) => setNuevaSeccionDocente(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <UserPlus className="w-4 h-4" /> Asignar Aula y Crear Docente
                    </button>
                  </form>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" /> Docentes Registrados y sus Aulas Exclusivas
                  </h3>

                  <div className="space-y-2">
                    {usuarios.filter(u => u.rol === 'docente').map(doc => (
                      <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{doc.nombre}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Usuario: <b>{doc.usuario}</b> | Clave: <code>{doc.clave}</code>
                          </p>
                          <div className="mt-1">
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                              Aula: {doc.gradoAsignado} - {doc.seccionAsignada}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => eliminarDocente(doc.id)}
                          className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition"
                          title="Revocar acceso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUBPESTAÑA: REPORTES Y ASISTENCIA DEL DÍA */}
            {pestanaDirector === 'metricas' && (
              <>
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

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2.5 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar Reportes Institucionales a Excel
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => exportarAExcel('general_dia')}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <Download className="w-4 h-4 text-emerald-600" /> Asistencia General del Colegio (.xlsx)
                    </button>
                    <button
                      onClick={() => exportarAExcel('incidencias')}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <Download className="w-4 h-4 text-amber-600" /> Alertas de Riesgo (3+ Faltas/Tardanzas)
                    </button>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <h3 className="font-bold text-slate-800 text-sm">Alumnos Ausentes Hoy ({metricasDirector.faltaronHoyLista.length})</h3>
                    </div>
                  </div>

                  {metricasDirector.faltaronHoyLista.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-3">No hay ausencias registradas hoy.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {metricasDirector.faltaronHoyLista.map(alumno => (
                        <div key={alumno.id} className="bg-rose-50/60 p-3 rounded-lg border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{alumno.name}</p>
                            <p className="text-xs text-rose-700 font-semibold">
                              {alumno.dni ? `DNI: ${alumno.dni} • ` : ''}{alumno.grade} - {alumno.section}
                            </p>
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
                            <p className="text-xs text-slate-600">
                              {alumno.dni ? `DNI: ${alumno.dni} • ` : ''}{alumno.grade} - {alumno.section}
                            </p>
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
                            <MessageCircle className="w-4 h-4" /> Citar Apoderado
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
