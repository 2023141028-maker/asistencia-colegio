import { supabase } from './supabase';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, AlertTriangle, Phone, 
  MessageCircle, Search, Calendar, School, ShieldAlert, 
  FileSpreadsheet, Check, Lock, LogOut, UserCheck, Eye, EyeOff, 
  HelpCircle, X, Download, UserPlus, Trash2, ShieldCheck, BookOpen,
  Upload, Edit, Plus, Layers
} from 'lucide-react';

// Carga asíncrona del motor de Microsoft Excel (.xlsx)
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

// Cuentas base con soporte para múltiples aulas asignadas
const USUARIOS_BASE = [
  { 
    id: 'dir_1', 
    usuario: 'director', 
    clave: 'dir2026', 
    rol: 'director', 
    nombre: 'Dirección General',
    aulasAsignadas: [] // El director tiene acceso a todo el colegio
  },
  { 
    id: 'aux_1', 
    usuario: 'auxiliar', 
    clave: 'aux2026', 
    rol: 'auxiliar', 
    nombre: 'Auxiliar de Puerta',
    aulasAsignadas: []
  },
  { 
    id: 'doc_1', 
    usuario: 'profesor1', 
    clave: 'doc2026', 
    rol: 'docente', 
    nombre: 'Prof. Carlos Mendoza (Matemáticas)',
    aulasAsignadas: [
      { grade: 'PRIMERO', section: 'RESPONSABILIDD' },
      { grade: 'SEGUNDO', section: 'ANDRES AVELINO CACERES' },
      { grade: 'TERCERO', section: 'CESAR VALLEJO' }
    ]
  },
  { 
    id: 'doc_2', 
    usuario: 'docente', 
    clave: 'doc2026', 
    rol: 'docente', 
    nombre: 'Prof. Rosa Huamán (Comunicación)',
    aulasAsignadas: [
      { grade: 'PRIMERO', section: 'RESPONSABILIDD' },
      { grade: 'CUARTO', section: 'NIKOLA TESLA' }
    ]
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
  const [usuarios, setUsuarios] = useState(() => {
    const local = localStorage.getItem('colegio_usuarios_v5');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return USUARIOS_BASE;
  });

  useEffect(() => {
    localStorage.setItem('colegio_usuarios_v5', JSON.stringify(usuarios));
  }, [usuarios]);

  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => {
    const sesion = localStorage.getItem('colegio_sesion_v5');
    return sesion ? JSON.parse(sesion) : null;
  });

  const [inputUsuario, setInputUsuario] = useState('');
  const [inputClave, setInputClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');

  // Padrón de Estudiantes
  const [estudiantes, setEstudiantes] = useState(() => {
    const local = localStorage.getItem('colegio_estudiantes_v5');
    return local ? JSON.parse(local) : ESTUDIANTES_INICIALES;
  });

  useEffect(() => {
    localStorage.setItem('colegio_estudiantes_v5', JSON.stringify(estudiantes));
  }, [estudiantes]);

  const [fechaHoy, setFechaHoy] = useState(new Date().toISOString().split('T')[0]);
  const [rolActivo, setRolActivo] = useState('docente');

  const [asistencias, setAsistencias] = useState(() => {
    const local = localStorage.getItem('colegio_asistencias');
    return local ? JSON.parse(local) : {};
  });

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

  const handleLogin = (e) => {
    e.preventDefault();
    const encontrado = usuarios.find(
      u => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.clave === inputClave
    );

    if (encontrado) {
      setUsuarioAutenticado(encontrado);
      setRolActivo(encontrado.rol);
      localStorage.setItem('colegio_sesion_v5', JSON.stringify(encontrado));
      setErrorLogin('');
      setInputClave('');
    } else {
      setErrorLogin('Credenciales inválidas. Verifique su usuario o contraseña.');
    }
  };

  const handleLogout = () => {
    setUsuarioAutenticado(null);
    localStorage.removeItem('colegio_sesion_v5');
  };

  const esDirector = usuarioAutenticado?.rol === 'director';

  // Todas las aulas existentes en el colegio
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

  // Aulas a las que tiene acceso el usuario actual
  const aulasPermitidasDocente = useMemo(() => {
    if (esDirector) return todasLasAulasColegio;
    return usuarioAutenticado?.aulasAsignadas && usuarioAutenticado.aulasAsignadas.length > 0
      ? usuarioAutenticado.aulasAsignadas
      : (todasLasAulasColegio.length > 0 ? [todasLasAulasColegio[0]] : []);
  }, [esDirector, todasLasAulasColegio, usuarioAutenticado]);

  // Estado del aula activa seleccionada
  const [gradoSel, setGradoSel] = useState('PRIMERO');
  const [seccionSel, setSeccionSel] = useState('RESPONSABILIDD');

  useEffect(() => {
    if (aulasPermitidasDocente.length > 0) {
      // Verificar si el aula actual aún está en las permitidas
      const existe = aulasPermitidasDocente.some(a => a.grade === gradoSel && a.section === seccionSel);
      if (!existe) {
        setGradoSel(aulasPermitidasDocente[0].grade);
        setSeccionSel(aulasPermitidasDocente[0].section);
      }
    }
  }, [aulasPermitidasDocente, gradoSel, seccionSel]);

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

  // Puerta (Auxiliar) con límite 8:00 AM
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

  // Exportar Excel oficial (.xlsx)
  const exportarAExcel = async (tipo = 'aula') => {
    try {
      const XLSX = await cargarLibreriaExcel();
      const wb = XLSX.utils.book_new();
      let datos = [];
      let nombreArchivo = '';
      let anchosColumnas = [];

      if (tipo === 'aula') {
        nombreArchivo = `Asistencia_${gradoSel}_${seccionSel}_${fechaHoy}.xlsx`;
        datos.push(['REPORTE DE ASISTENCIA ESCOLAR']);
        datos.push(['Grado y Sección:', `${gradoSel} - ${seccionSel}`]);
        datos.push(['Docente Responsable:', usuarioAutenticado?.nombre || 'Docente']);
        datos.push(['Fecha:', fechaHoy]);
        datos.push([]);
        datos.push(['N°', 'DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCIÓN', 'ESTADO', 'HORA', 'TELÉFONO APODERADO']);

        const diaActual = asistencias[fechaHoy] || {};
        alumnosAula.forEach((alumno, i) => {
          const st = diaActual[alumno.id]?.status || 'P';
          const hora = diaActual[alumno.id]?.time || '--:--';
          const estadoTexto = st === 'P' ? 'PRESENTE' : st === 'T' ? 'TARDANZA' : 'FALTA';
          datos.push([
            i + 1,
            alumno.dni || 'S/D',
            alumno.name,
            alumno.grade,
            alumno.section,
            estadoTexto,
            hora,
            alumno.phone || ''
          ]);
        });

        anchosColumnas = [
          { wch: 6 }, { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 25 }, { wch: 14 }, { wch: 10 }, { wch: 18 }
        ];
      } else if (tipo === 'general_dia') {
        nombreArchivo = `Reporte_General_Colegio_${fechaHoy}.xlsx`;
        datos.push(['CONSOLIDADO GENERAL DE ASISTENCIA INSTITUCIONAL']);
        datos.push(['Fecha:', fechaHoy]);
        datos.push(['Total Estudiantes:', estudiantes.length]);
        datos.push([]);
        datos.push(['N°', 'DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCIÓN', 'ESTADO', 'HORA', 'TELÉFONO APODERADO']);

        const diaActual = asistencias[fechaHoy] || {};
        estudiantes.forEach((alumno, i) => {
          const st = diaActual[alumno.id]?.status || 'P';
          const hora = diaActual[alumno.id]?.time || '--:--';
          const estadoTexto = st === 'P' ? 'PRESENTE' : st === 'T' ? 'TARDANZA' : 'FALTA';
          datos.push([
            i + 1,
            alumno.dni || 'S/D',
            alumno.name,
            alumno.grade,
            alumno.section,
            estadoTexto,
            hora,
            alumno.phone || ''
          ]);
        });

        anchosColumnas = [
          { wch: 6 }, { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 25 }, { wch: 16 }, { wch: 14 }, { wch: 18 }
        ];
      } else if (tipo === 'incidencias') {
        nombreArchivo = `Alumnos_En_Riesgo_${fechaHoy}.xlsx`;
        datos.push(['REPORTE DE ALUMNOS CON ALERTAS (3+ FALTAS O TARDANZAS)']);
        datos.push(['Fecha de Emisión:', fechaHoy]);
        datos.push([]);
        datos.push(['N°', 'DNI', 'APELLIDOS Y NOMBRES', 'GRADO', 'SECCIÓN', 'TARDANZAS MES', 'FALTAS MES', 'CONDICIÓN', 'TELÉFONO APODERADO']);

        metricasDirector.enRiesgo.forEach((alumno, i) => {
          datos.push([
            i + 1,
            alumno.dni || 'S/D',
            alumno.name,
            alumno.grade,
            alumno.section,
            alumno.tardanzasMes,
            alumno.faltasMes,
            'EN RIESGO DISCIPLINARIO',
            alumno.phone || ''
          ]);
        });

        anchosColumnas = [
          { wch: 6 }, { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 26 }, { wch: 18 }
        ];
      }

      const ws = XLSX.utils.aoa_to_sheet(datos);
      ws['!cols'] = anchosColumnas;
      XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
      XLSX.writeFile(wb, nombreArchivo);
    } catch (error) {
      alert('Error al generar el archivo Excel: ' + error.message);
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
          section: String(fila[colSeccion] || 'RESPONSABILIDD').trim().toUpperCase(),
          phone: String(fila[colTelefono] || '999999999').trim()
        });
      }

      if (cargados.length > 0) {
        setEstudiantes(cargados);
        alert(`¡Padrón actualizado con éxito! Se cargaron ${cargados.length} estudiantes desde el archivo Excel.`);
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

  // Subpestañas del Director
  const [pestanaDirector, setPestanaDirector] = useState('metricas');
  
  // Docentes y Selección múltiple de aulas
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
  const [nuevaSeccionAlumno, setNuevaSeccionAlumno] = useState('RESPONSABILIDD');
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
      setMensajeAdmin('⚠️ Debe seleccionar al menos un grado/sección para este docente.');
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
    setMensajeAdmin('✅ Docente creado con sus aulas asignadas exitosamente.');
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
    setMensajeAdmin('✅ Alumno matriculado correctamente en el padrón.');
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

  // LOGIN
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

        {modalRecuperar && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
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
                Por motivos de seguridad institucional, comuníquese con la Dirección para restablecer sus credenciales.
              </p>

              <div className="space-y-2">
                <a
                  href={`https://wa.me/51964123456?text=${encodeURIComponent('Hola Dirección, solicito la recuperación de mi clave de acceso al sistema.')}`}
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
              <Clock className="w-4 h-4" /> Puerta (8:00 AM)
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
        
        {/* AULA DOCENTE: SELECTOR DE SUS AULAS ASIGNADAS */}
        {rolActivo === 'docente' && (
          <div className="space-y-4">
            
            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-emerald-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 
                  {esDirector ? 'Modo Auditoría General' : `Tus Aulas Asignadas (${aulasPermitidasDocente.length})`}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Seleccionar aula a calificar</span>
              </div>

              {/* Selector de Aula asignada para el docente */}
              <div className="relative">
                <select 
                  value={`${gradoSel}|${seccionSel}`} 
                  onChange={(e) => {
                    const [g, s] = e.target.value.split('|');
                    setGradoSel(g);
                    setSeccionSel(s);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-black text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {aulasPermitidasDocente.map(a => (
                    <option key={`${a.grade}|${a.section}`} value={`${a.grade}|${a.section}`}>
                      {a.grade} - {a.section}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                title="Descargar asistencia en Excel oficial (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Exportar a Excel (.xlsx)
              </button>
            </div>

            <div className="space-y-2">
              {alumnosAula.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                  No hay alumnos matriculados en esta sección ({gradoSel} - {seccionSel}).
                </div>
              ) : (
                alumnosAula.map((alumno, index) => {
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
                })
              )}
            </div>

            {alumnosAula.length > 0 && (
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
            )}
          </div>
        )}

        {/* PUERTA (AUXILIAR) */}
        {rolActivo === 'auxiliar' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-slate-800 text-base">Control Matutino de Ingreso</h2>
                <div className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Límite: 8:00 AM
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Busque por <b>DNI</b> o <b>Apellidos</b>:
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

        {/* PANEL DIRECTOR */}
        {rolActivo === 'director' && (
          <div className="space-y-4">
            
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
                🎓 Padrón ({estudiantes.length})
              </button>
              <button
                onClick={() => setPestanaDirector('docentes')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  pestanaDirector === 'docentes' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Asignar Múltiples Aulas
              </button>
            </div>

            {/* PADRÓN Y ALUMNOS */}
            {pestanaDirector === 'alumnos' && (
              <div className="space-y-4">
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-600" /> Buscador Institucional de Alumnos
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por DNI, Apellidos, Nombres, Grado o Sección..."
                      value={busquedaDirector}
                      onChange={(e) => setBusquedaDirector(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>Carga Masiva de Alumnos en Excel (.xlsx)</span>
                    </div>
                    <button
                      onClick={descargarPlantillaExcel}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Modelo (.xlsx)
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800 mb-3">
                    Sube tu archivo de Excel <b>(.xlsx o .xls)</b> con la lista completa de estudiantes.
                  </p>
                  
                  <label className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition">
                    <Upload className="w-4 h-4" /> Subir Padrón en Excel (.xlsx)
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={procesarArchivoExcel}
                      className="hidden" 
                    />
                  </label>
                </div>

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
                          placeholder="Sección"
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

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">
                    Padrón Activo ({alumnosFiltradosDirector.length} estudiantes)
                  </h3>

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
                            title="Editar celular"
                          >
                            <Edit className="w-3.5 h-3.5" /> Editar Cel
                          </button>
                          
                          <button
                            onClick={() => retirarAlumno(alumno.id, alumno.name)}
                            className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition"
                            title="Dar de baja al estudiante"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {alumnoEditando && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 text-sm">Actualizar Celular</h4>
                        <button onClick={() => setAlumnoEditando(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">
                        Estudiante: <b>{alumnoEditando.name}</b>
                      </p>
                      <form onSubmit={guardarEdicionCelular} className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Nuevo Celular</label>
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

            {/* GESTIÓN DE DOCENTES: ASIGNACIÓN MÚLTIPLE DE AULAS */}
            {pestanaDirector === 'docentes' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold mb-3">
                    <UserPlus className="w-5 h-5" />
                    <h3>Registrar Docente y Asignar Grados / Secciones</h3>
                  </div>

                  {mensajeAdmin && (
                    <div className="mb-3 p-2.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {mensajeAdmin}
                    </div>
                  )}

                  <form onSubmit={registrarDocente} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Nombre Completo y Especialidad</label>
                        <input
                          type="text"
                          placeholder="Ej: Prof. Juan Pérez (Matemáticas)"
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

                    {/* SELECCIÓN MÚLTIPLE DE AULAS */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          Selecciona las aulas que enseñará (Puedes marcar varias):
                        </label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {aulasSeleccionadasNuevas.length} seleccionadas
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {todasLasAulasColegio.map(aula => {
                          const clave = `${aula.grade}|${aula.section}`;
                          const estaMarcada = aulasSeleccionadasNuevas.includes(clave);
                          return (
                            <button
                              type="button"
                              key={clave}
                              onClick={() => alternarSeleccionAula(clave)}
                              className={`p-2.5 rounded-lg text-xs font-bold border text-left flex items-center justify-between transition-all ${
                                estaMarcada 
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span>{aula.grade} - {aula.section}</span>
                              {estaMarcada ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-300" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition mt-2"
                    >
                      <UserPlus className="w-4 h-4" /> Asignar Aulas y Crear Cuenta Docente
                    </button>
                  </form>
                </div>

                {/* LISTA DE DOCENTES Y SUS AULAS MÚLTIPLES */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" /> Docentes Registrados y sus Aulas Asignadas
                  </h3>

                  <div className="space-y-2">
                    {usuarios.filter(u => u.rol === 'docente').map(doc => (
                      <div key={doc.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 text-sm">{doc.nombre}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Usuario: <b>{doc.usuario}</b> | Clave: <code>{doc.clave}</code>
                          </p>
                          
                          {/* BADGES DE AULAS ASIGNADAS */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {doc.aulasAsignadas && doc.aulasAsignadas.length > 0 ? (
                              doc.aulasAsignadas.map((a, i) => (
                                <span 
                                  key={i}
                                  className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md"
                                >
                                  {a.grade} - {a.section}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400">Sin aulas asignadas</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => eliminarDocente(doc.id)}
                          className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition"
                          title="Revocar acceso a este docente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* REPORTES DIRECTOR */}
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
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar Reportes a Microsoft Excel (.xlsx)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => exportarAExcel('general_dia')}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <Download className="w-4 h-4 text-emerald-600" /> Asistencia General (.xlsx)
                    </button>
                    <button
                      onClick={() => exportarAExcel('incidencias')}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <Download className="w-4 h-4 text-amber-600" /> Alertas de Riesgo (.xlsx)
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
