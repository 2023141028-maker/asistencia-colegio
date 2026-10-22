import useAsistenciasRealtime from './hooks/useAsistenciasRealtime';
import useReportes from './hooks/useReportes';
import useGestionInstitucional from './hooks/useGestionInstitucional';
import { supabase } from './supabase';
import {
  guardarAsistenciaDocente,
  guardarAsistenciaOficial,
  guardarAsistenciasOficiales,
  registrarIngresoQR
} from './services/asistenciaService';
import EscanerQR from './components/EscanerQR';
import PanelReportes from './components/reportes/PanelReportes';
import PanelGestion from './components/usuarios/PanelGestion';
import ControlAsistencia from './components/asistencia/ControlAsistencia';
import {
  esDirector as usuarioEsDirector,
  esSubdirector as usuarioEsSubdirector,
  esAuxiliar as usuarioEsAuxiliar,
  esDocente as usuarioEsDocente,
  esDireccion as usuarioEsDireccion,
  obtenerAulasPermitidas
} from './utils/permisos';
import { AULAS_OFICIALES_DH } from './constants/aulas';
import { conLimiteDeTiempo } from './utils/async';
import {
  leerUsuariosSeguros,
  persistirSesionSegura,
  persistirUsuariosSeguros,
  usuarioParaSesion
} from './utils/seguridad';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, CheckCircle2, Clock, AlertTriangle, MessageCircle, Calendar, School, FileSpreadsheet, Lock, LogOut, UserCheck, Eye, EyeOff, HelpCircle, X, Upload, WifiOff, Smartphone, Sparkles, KeyRound, Loader2, Settings
} from 'lucide-react';

export default function App() {
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // RED Y COLA OFFLINE
  const [estaEnLinea, setEstaEnLinea] = useState(navigator.onLine);
  const [colaPendientes, setColaPendientes] = useState(() => {
    try {
      const local = localStorage.getItem('dh_cola_offline_v26');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const [sincronizando, setSincronizando] = useState(false);
  const [avisoSync, setAvisoSync] = useState('');
  const [avisoAutoGuardado, setAvisoAutoGuardado] = useState('');

  const sincronizarColaConSupabase = useCallback(async () => {
    let colaActual = [];
    try {
      colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v26') || '[]');
    } catch {
      colaActual = [];
    }

    if (colaActual.length === 0) return;

    setSincronizando(true);
    let subidosConExito = 0;
    const fallidos = [];

    for (const item of colaActual) {
      try {
        if (item.tipo === 'aula_docente') {
          await guardarAsistenciaDocente({
            fecha: item.fecha,
            alumnos: item.alumnos,
            estados: item.estados,
            seccion: item.seccion,
            nombreDocente: item.nombreDocente || 'Docente'
          });
    
        } else if (item.tipo === 'aula') {
          await guardarAsistenciasOficiales(item.filas || []);
        } else if (item.tipo === 'alumno_individual') {
          const fila = item.filas[0];

          await guardarAsistenciaOficial(fila);
        }

        subidosConExito++;
      } catch (err) {
        fallidos.push(item);
      }
    }

    setColaPendientes(fallidos);
    localStorage.setItem('dh_cola_offline_v26', JSON.stringify(fallidos));
    setSincronizando(false);

    if (subidosConExito > 0) {
      setAvisoSync(`¡Conexión lista! Se sincronizaron ${subidosConExito} registro(s) con la nube.`);
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
  const [usuarios, setUsuarios] = useState(() =>
    leerUsuariosSeguros()
  );

  // ESTUDIANTES
  const [estudiantes, setEstudiantes] = useState(() => {
    try {
      const local = localStorage.getItem('dh_estudiantes_v26');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  // ASISTENCIAS
  const [asistencias, setAsistencias] = useState(() => {
    try {
      const local = localStorage.getItem('dh_asistencias_v26');
      return local ? JSON.parse(local) : {};
    } catch {
      return {};
    }
  });

  useAsistenciasRealtime({ setAsistencias });

  // CARGA INICIAL DESDE SUPABASE
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
            persistirUsuariosSeguros(formateados);
          }

          const resEst = await conLimiteDeTiempo(supabase.from('estudiantes').select('*'), 2000).catch(() => null);
          if (resEst && !resEst.error && resEst.data && resEst.data.length > 0 && montado) {
            setEstudiantes(resEst.data);
            localStorage.setItem('dh_estudiantes_v26', JSON.stringify(resEst.data));
          }

          const resAsis = await conLimiteDeTiempo(supabase.from('asistencias').select('*'), 2000).catch(() => null);
          if (resAsis && !resAsis.error && resAsis.data && resAsis.data.length > 0 && montado) {
            const agrupadas = {};
            resAsis.data.forEach(reg => {
              if (!agrupadas[reg.fecha]) agrupadas[reg.fecha] = {};
              agrupadas[reg.fecha][reg.estudiante_id] = {
                  status: reg.estado,
                  docenteStatus: reg.estado_docente || null,
                  registradoPor: reg.registrado_por || '',
                  registradoDocentePor: reg.registrado_docente_por || '',
                  time: (reg.actualizado_at || reg.created_at)
                    ? new Date(reg.actualizado_at || reg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '--:--'
                };
              });
            setAsistencias(prev => ({ ...prev, ...agrupadas }));
            localStorage.setItem('dh_asistencias_v26', JSON.stringify(agrupadas));
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
    setUsuarioAutenticado(usuarioParaSesion(directorNuevo));
    persistirUsuariosSeguros([directorNuevo]);
    persistirSesionSegura(directorNuevo);

    try {
      await conLimiteDeTiempo(
        guardarUsuario(directorNuevo),
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
      const sesion = localStorage.getItem('dh_sesion_v26');
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
  const [vistaDirector, setVistaDirector] = useState('asistencia');
  const [subPestanaGestion, setSubPestanaGestion] = useState('personal');
  const [subVistaAuxiliar, setSubVistaAuxiliar] = useState('salones');

  const handleLogin = (e) => {
    e.preventDefault();
    const encontrado = usuarios.find(
      u => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.clave === inputClave
    );

    if (encontrado) {
      const sesionSegura = usuarioParaSesion(encontrado);
      setUsuarioAutenticado(sesionSegura);

      if (recordarSesion) {
        persistirSesionSegura(encontrado);
      } else {
        localStorage.removeItem('dh_sesion_v26');
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
      localStorage.removeItem('dh_sesion_v26');
    }
  };

  const esDirector = usuarioEsDirector(usuarioAutenticado);
  const esSubdirector = usuarioEsSubdirector(usuarioAutenticado);
  const esAuxiliar = usuarioEsAuxiliar(usuarioAutenticado);
  const esDocente = usuarioEsDocente(usuarioAutenticado);
  const esDireccion = usuarioEsDireccion(usuarioAutenticado);

  useEffect(() => {
    if (!esDirector && vistaDirector === 'gestion') {
      setVistaDirector('asistencia');
    }
  }, [esDirector, vistaDirector]);

  const manejarRegistroIngresoQR = async (alumno) => {
  const ahora = new Date();

  const horaRegistro = ahora.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  
    const resultado = await registrarIngresoQR({
      alumno,
      fecha: fechaHoy,
      horaRegistro,
      dispositivo: 'PUERTA PRINCIPAL'
    });
  
    return resultado;
  };

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
    return obtenerAulasPermitidas(
      usuarioAutenticado,
      todasLasAulasColegio
    );
  }, [usuarioAutenticado, todasLasAulasColegio]);

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
    const registro = diaActual[e.id];

    const estadoDireccionReal =
      registro?.registradoPor !== 'Sistema - sin control previo'
        ? (registro?.status || '')
        : '';

    inicial[e.id] = esDocente
      ? (registro?.docenteStatus || '')
      : estadoDireccionReal;
  });

  setAsistenciaAula(inicial);
}, [alumnosAula, fechaHoy, asistencias, esDocente]);

  // =========================================================================
  // MARCACIÓN Y AUTO-GUARDADO INSTANTÁNEO (PARA EL DIRECTOR Y BUSCADOR)
  // =========================================================================
  const cambiarEstadoAlumno = (alumnoId, nuevoEstado) => {
    if (esDocente) {
  setAsistenciaAula(prev => ({
    ...prev,
    [alumnoId]: nuevoEstado
  }));
  return;
}
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Guardar de inmediato en memoria local
    setAsistencias(prev => {
      const dia = { ...(prev[fechaHoy] || {}) };
      dia[alumnoId] = {
        ...(dia[alumnoId] || {}),
        status: nuevoEstado,
        time: hora,
        registradoPor: usuarioAutenticado?.nombre || 'Dirección/Auxiliar'
      };
      const res = { ...prev, [fechaHoy]: dia };
      localStorage.setItem('dh_asistencias_v26', JSON.stringify(res));
      return res;
    });

    setAsistenciaAula(prev => ({ ...prev, [alumnoId]: nuevoEstado }));

    const alum = estudiantes.find(e => String(e.id) === String(alumnoId));
    if (!alum) return;

    const descEstado = 
      nuevoEstado === 'P' ? 'PRESENTE' :
      nuevoEstado === 'T' ? 'TARDANZA' :
      nuevoEstado === 'F' ? 'FALTA' :
      nuevoEstado === 'E' ? 'EVASIÓN' : 'PERMISO';

    // Aviso visual inmediato al Director de que ya quedó guardado
    setAvisoAutoGuardado(`✅ ${alum.name} guardado como ${descEstado}`);
    setTimeout(() => setAvisoAutoGuardado(''), 2500);

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
      try { colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v26') || '[]'); } catch {}
      const nuevaCola = [...colaActual.filter(p => !(p.fecha === fechaHoy && p.estudiante_id === String(alumnoId))), paquete];
      setColaPendientes(nuevaCola);
      localStorage.setItem('dh_cola_offline_v26', JSON.stringify(nuevaCola));
      return;
    }

    guardarAsistenciaOficial(fila[0]).catch(() => {
      let colaActual = [];
      try {
        colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v26') || '[]');
      } catch {}

      const nuevaCola = [
        ...colaActual.filter(
          p => !(p.fecha === fechaHoy && p.estudiante_id === String(alumnoId))
        ),
        paquete
      ];

      setColaPendientes(nuevaCola);
      localStorage.setItem('dh_cola_offline_v26', JSON.stringify(nuevaCola));
    });
;
  };

  const alternarEstadoAlumno = (id) => {
    const actual = asistenciaAula[id] || '';
    const siguiente =
      actual === '' ? 'P' :
      actual === 'P' ? 'T' :
      actual === 'T' ? 'F' :
      actual === 'F' ? 'E' :
      actual === 'E' ? 'J' : 'P';

    cambiarEstadoAlumno(id, siguiente);
  };

    const guardarAsistenciaAula = async () => {
      const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const seccionCompleta = `${gradoSel} - ${seccionSel}`;
      if (esDocente) {
            const cantidadMarcadosDocente = alumnosAula.filter(
              alumno => ['P', 'T', 'F', 'E', 'J'].includes(asistenciaAula[alumno.id])
            ).length;

            if (cantidadMarcadosDocente === 0) {
              alert(
                'El registro docente es opcional. Marca al menos un estudiante si deseas guardar una verificación docente.'
              );
              return;
            }

            if (!navigator.onLine) {
                let colaActual = [];

                try {
                  colaActual = JSON.parse(
                    localStorage.getItem('dh_cola_offline_v26') || '[]'
                  );
                } catch {}
          
                const paqueteDocente = {
                  id: `aula_docente_${Date.now()}`,
                  tipo: 'aula_docente',
                  fecha: fechaHoy,
                  seccion: seccionCompleta,
                  alumnos: alumnosAula,
                  estados: asistenciaAula,
                  nombreDocente: usuarioAutenticado?.nombre || 'Docente'
                };
          
                const nuevaCola = [
                  ...colaActual.filter(
                    p =>
                      !(
                        p.tipo === 'aula_docente' &&
                        p.fecha === fechaHoy &&
                        p.seccion === seccionCompleta
                      )
                  ),
                  paqueteDocente
                ];
          
                setColaPendientes(nuevaCola);
          
                localStorage.setItem(
                  'dh_cola_offline_v26',
                  JSON.stringify(nuevaCola)
                );
          
                setMensajeGuardado(
                  '¡Asistencia del docente guardada en el teléfono! 📱'
                );
          
                setGuardadoExitoso(true);
          
                setTimeout(() => {
                  setGuardadoExitoso(false);
                }, 3000);
          
                return;
              }
              try {
                await guardarAsistenciaDocente({
                    fecha: fechaHoy,
                    alumnos: alumnosAula,
                    estados: asistenciaAula,
                    seccion: seccionCompleta,
                    nombreDocente: usuarioAutenticado?.nombre || 'Docente'
               });

    setMensajeGuardado('¡Asistencia del docente guardada en la Nube! ☁️');
    setGuardadoExitoso(true);

    setTimeout(() => {
      setGuardadoExitoso(false);
    }, 2500);

  } catch (err) {
    console.error('Error al guardar asistencia docente:', err);

    setMensajeGuardado('No se pudo guardar la asistencia del docente.');
    setGuardadoExitoso(true);

    setTimeout(() => {
      setGuardadoExitoso(false);
    }, 3000);
  }

  return;
}

    const alumnosSinRegistro = alumnosAula.filter(
      alumno => !['P', 'T', 'F', 'E', 'J'].includes(asistenciaAula[alumno.id])
    );

    if (alumnosSinRegistro.length > 0) {
      alert(
        'Faltan registrar ' + alumnosSinRegistro.length +
        ' estudiante(s). Los alumnos sin registro no se marcarán automáticamente como presentes.'
      );
      return;
    }

    const nuevoDia = { ...(asistencias[fechaHoy] || {}) };
    Object.keys(asistenciaAula).forEach(id => {
      nuevoDia[id] = {
        ...(nuevoDia[id] || {}),
        status: asistenciaAula[id],
        time: hora,
        registradoPor: usuarioAutenticado?.nombre || 'Dirección/Auxiliar'
      };
    });
    const asistenciasActualizadas = { ...asistencias, [fechaHoy]: nuevoDia };
    setAsistencias(asistenciasActualizadas);
    localStorage.setItem('dh_asistencias_v26', JSON.stringify(asistenciasActualizadas));

    const filas = alumnosAula.map(alumno => ({
      fecha: fechaHoy,
      estudiante_id: String(alumno.id),
      estudiante_nombre: alumno.name,
      seccion: seccionCompleta,
      estado: asistenciaAula[alumno.id],
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
      try { colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v26') || '[]'); } catch {}
      const nuevaCola = [...colaActual.filter(p => !(p.tipo === 'aula' && p.fecha === fechaHoy && p.seccion === seccionCompleta)), paquete];
      setColaPendientes(nuevaCola);
      localStorage.setItem('dh_cola_offline_v26', JSON.stringify(nuevaCola));

      setMensajeGuardado('¡Guardado en el Teléfono! 📱 (Sin señal)');
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
    };

    if (!navigator.onLine) {
      guardarEnColaLocal();
      return;
    }

    try {
      await guardarAsistenciasOficiales(filas);

      let colaActual = [];
      try { colaActual = JSON.parse(localStorage.getItem('dh_cola_offline_v26') || '[]'); } catch {}
      const nuevaCola = colaActual.filter(p => !(p.tipo === 'aula' && p.fecha === fechaHoy && p.seccion === seccionCompleta));
      setColaPendientes(nuevaCola);
      localStorage.setItem('dh_cola_offline_v26', JSON.stringify(nuevaCola));

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

    let sinRegistroHoy = 0;

    estudiantes.forEach(e => {
      const registro = dia[e.id];
      const esRegistroRealDireccion =
        registro?.status &&
        registro?.registradoPor !== 'Sistema - sin control previo';

      if (!esRegistroRealDireccion) {
        sinRegistroHoy++;
        return;
      }

      const st = registro.status;

      if (st === 'F') faltasHoy++;
      else if (st === 'T') tardanzasHoy++;
      else if (st === 'E') evasionesHoy++;
      else if (st === 'J') permisosHoy++;
      else if (st === 'P') presentesHoy++;
    });

    const faltaronHoyLista = estudiantes.filter(e => {
      const registro = dia[e.id];
      return registro?.registradoPor !== 'Sistema - sin control previo' && registro?.status === 'F';
    });

    const evadieronHoyLista = estudiantes.filter(e => {
      const registro = dia[e.id];
      return registro?.registradoPor !== 'Sistema - sin control previo' && registro?.status === 'E';
    });

    const permisoHoyLista = estudiantes.filter(e => {
      const registro = dia[e.id];
      return registro?.registradoPor !== 'Sistema - sin control previo' && registro?.status === 'J';
    });

    return {
      faltasHoy,
      tardanzasHoy,
      presentesHoy,
      evasionesHoy,
      permisosHoy,
      sinRegistroHoy,
      faltaronHoyLista,
      evadieronHoyLista,
      permisoHoyLista
    };
  }, [asistencias, estudiantes, fechaHoy]);
  const discrepanciasDirector = useMemo(() => {
  const dia = asistencias[fechaHoy] || {};

  return estudiantes
    .map(alumno => {
      const registro = dia[alumno.id];

     if (!registro) return null;
     if (!registro.docenteStatus) return null;
      
      // Si el registro fue creado automáticamente porque el docente
      // marcó primero, todavía no existe control real de Dirección.
      if (registro.registradoPor === 'Sistema - sin control previo') {
        return null;
      }
      
      const estadoDireccion = registro.status;
      const estadoDocente = registro.docenteStatus;

      if (estadoDireccion === estadoDocente) {
        return null;
      }

      return {
        id: alumno.id,
        nombre: alumno.name,
        dni: alumno.dni || 'S/D',
        grado: alumno.grade,
        seccion: alumno.section,
        estadoDireccion,
        estadoDocente,
        registradoPor: registro.registradoPor || '',
        registradoDocentePor: registro.registradoDocentePor || ''
      };
    })
    .filter(Boolean);
}, [asistencias, estudiantes, fechaHoy]);

  // REPORTES
  const {
    tipoPeriodoReporte,
    setTipoPeriodoReporte,
    alcanceReporte,
    setAlcanceReporte,
    filtroGradoReporte,
    setFiltroGradoReporte,
    filtroSeccionReporte,
    setFiltroSeccionReporte,
    generarReporteExcelAvanzado
  } = useReportes({
    estudiantes,
    asistencias,
    fechaHoy
  });

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

  // GESTIÓN INSTITUCIONAL
  const {
    nuevoRolPersonal,
    setNuevoRolPersonal,
    nuevoNombreDocente,
    setNuevoNombreDocente,
    nuevoUserDocente,
    setNuevoUserDocente,
    nuevaClaveDocente,
    setNuevaClaveDocente,
    aulasSeleccionadasNuevas,
    mensajeAdmin,
    alternarSeleccionAula,
    alternarGradoCompleto,
    registrarPersonal,
    eliminarDocente,
    personalEditando,
    setPersonalEditando,
    editNombrePersonal,
    setEditNombrePersonal,
    editUserPersonal,
    setEditUserPersonal,
    editClavePersonal,
    setEditClavePersonal,
    editRolPersonal,
    setEditRolPersonal,
    editAulasPersonal,
    alternarSeleccionAulaEdicion,
    alternarGradoCompletoEdicion,
    abrirModalEditarPersonal,
    guardarEdicionPersonal,
    nuevoDniAlumno,
    setNuevoDniAlumno,
    nuevoNombreAlumno,
    setNuevoNombreAlumno,
    nuevoGradoAlumno,
    setNuevoGradoAlumno,
    nuevaSeccionAlumno,
    setNuevaSeccionAlumno,
    nuevoCelularAlumno,
    setNuevoCelularAlumno,
    busquedaPadron,
    setBusquedaPadron,
    registrarAlumnoNuevo,
    retirarAlumno,
    alumnoEditando,
    setAlumnoEditando,
    editDni,
    setEditDni,
    editNombre,
    setEditNombre,
    editGrado,
    setEditGrado,
    editSeccion,
    setEditSeccion,
    editTelefono,
    setEditTelefono,
    abrirModalEditarAlumno,
    guardarEdicionCompletaAlumno,
    alumnosFiltradosPadron,
    procesarArchivoExcel
  } = useGestionInstitucional({
    usuarios,
    setUsuarios,
    estudiantes,
    setEstudiantes,
    todasLasAulasColegio
  });

  // =========================================================================
  // PANTALLAS DE CONTROL
  // =========================================================================

  // 1. CARGANDO
  if (cargandoInicial) {
    return (
      <div className="min-h-screen bg-emerald-800 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="w-16 h-16 bg-emerald-900 rounded-3xl flex items-center justify-center shadow-2xl mb-4 border border-emerald-600 animate-bounce">
          <School className="w-8 h-8 text-emerald-300" />
        </div>
        <h2 className="text-lg font-black tracking-tight">I.E.E. "Daniel Hernández"</h2>
        <p className="text-xs text-emerald-200 mt-1 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Verificando sistema...
        </p>
      </div>
    );
  }

  // 2. REGISTRO PRIMER DIRECTOR
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
              El sistema se encuentra en <b>estado inicial</b>. Registre la cuenta del <b>Director General</b>:
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
                placeholder="Ej: director"
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
              <span>{guardandoDirector ? 'Guardando...' : 'Activar Sistema y Crear Director'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. PANTALLA LOGIN
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
            {!estaEnLinea && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold p-2.5 rounded-xl flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Modo Sin Señal: Ingreso habilitado en este teléfono.</span>
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
                Mantener sesión abierta en este celular
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

  // 4. APLICACIÓN PRINCIPAL (USUARIO CONECTADO)
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

      {/* AVISO DE AUTO-GUARDADO INSTANTÁNEO */}
      {avisoAutoGuardado && (
        <div className="bg-emerald-600 text-white px-3 py-2 text-xs font-black flex items-center justify-center gap-1.5 shadow sticky top-0 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          <span className="truncate">{avisoAutoGuardado}</span>
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
                  <span className="font-semibold truncate max-w-[130px] sm:max-w-[200px]">{usuarioAutenticado?.nombre}</span>
                  <span className="bg-emerald-900/90 text-[9px] px-1.5 py-0.2 rounded font-black uppercase shrink-0">
                    {usuarioAutenticado?.rol}
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
        {esDireccion && (
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
              onClick={() => setVistaDirector('qr')}
              className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                vistaDirector === 'qr'
                  ? 'bg-white text-emerald-800 border-b-2 border-emerald-500 shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>QR Ingreso</span>
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

            {esDirector && (
              <button 
                onClick={() => setVistaDirector('gestion')}
                className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  vistaDirector === 'gestion' ? 'bg-white text-emerald-800 border-b-2 border-emerald-500 shadow-sm' : 'text-emerald-100 hover:bg-emerald-800'
                }`}
              >
                <Settings className="w-4 h-4 text-emerald-300 shrink-0" /> 
                <span>Personal y Padrón</span>
              </button>
            )}
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
        
        <ControlAsistencia
          ctx={{
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
            enviarWhatsApp
          }}
        />

        {/* =========================================================================
    VISTA: CONTROL DE INGRESO QR
   ========================================================================= */}
        {esDireccion && vistaDirector === 'qr' && (
              <div className="space-y-3.5">
                <EscanerQR
                  estudiantes={estudiantes}
                  onRegistrarIngreso={manejarRegistroIngresoQR}
                />
              </div>
            )}

        {esDireccion && vistaDirector === 'reportes' && (
          <PanelReportes
            tipoPeriodoReporte={tipoPeriodoReporte}
            setTipoPeriodoReporte={setTipoPeriodoReporte}
            alcanceReporte={alcanceReporte}
            setAlcanceReporte={setAlcanceReporte}
            filtroGradoReporte={filtroGradoReporte}
            setFiltroGradoReporte={setFiltroGradoReporte}
            filtroSeccionReporte={filtroSeccionReporte}
            setFiltroSeccionReporte={setFiltroSeccionReporte}
            todasLasAulasColegio={todasLasAulasColegio}
            generarReporteExcelAvanzado={generarReporteExcelAvanzado}
          />
        )}

        <PanelGestion
          ctx={{
            esDirector,
            vistaDirector,
            subPestanaGestion,
            setSubPestanaGestion,
            usuarios,
            estudiantes,
            mensajeAdmin,
            registrarPersonal,
            nuevoRolPersonal,
            setNuevoRolPersonal,
            nuevoNombreDocente,
            setNuevoNombreDocente,
            nuevoUserDocente,
            setNuevoUserDocente,
            nuevaClaveDocente,
            setNuevaClaveDocente,
            aulasSeleccionadasNuevas,
            alternarGradoCompleto,
            todasLasAulasColegio,
            alternarSeleccionAula,
            abrirModalEditarPersonal,
            eliminarDocente,
            procesarArchivoExcel,
            registrarAlumnoNuevo,
            nuevoDniAlumno,
            setNuevoDniAlumno,
            nuevoNombreAlumno,
            setNuevoNombreAlumno,
            nuevoGradoAlumno,
            setNuevoGradoAlumno,
            nuevaSeccionAlumno,
            setNuevaSeccionAlumno,
            nuevoCelularAlumno,
            setNuevoCelularAlumno,
            alumnosFiltradosPadron,
            busquedaPadron,
            setBusquedaPadron,
            abrirModalEditarAlumno,
            retirarAlumno,
            personalEditando,
            setPersonalEditando,
            guardarEdicionPersonal,
            editRolPersonal,
            setEditRolPersonal,
            editNombrePersonal,
            setEditNombrePersonal,
            editUserPersonal,
            setEditUserPersonal,
            editClavePersonal,
            setEditClavePersonal,
            editAulasPersonal,
            alternarGradoCompletoEdicion,
            alternarSeleccionAulaEdicion,
            alumnoEditando,
            setAlumnoEditando,
            guardarEdicionCompletaAlumno,
            editDni,
            setEditDni,
            editNombre,
            setEditNombre,
            editGrado,
            setEditGrado,
            editSeccion,
            setEditSeccion,
            editTelefono,
            setEditTelefono
          }}
        />

        {/* PIE DE PÁGINA */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col items-center gap-2">
          <p className="text-[11px] text-slate-400 font-medium">
            Sesión iniciada: <b>{usuarioAutenticado?.nombre}</b>
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
