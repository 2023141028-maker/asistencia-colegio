import { useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { conLimiteDeTiempo } from '../utils/async';
import { cargarLibreriaExcel } from '../utils/excel';
import { guardarUsuario, actualizarUsuario, eliminarUsuario } from '../services/usuarioService';
import { crearEstudiante, actualizarEstudiante, eliminarEstudiante } from '../services/estudianteService';

export default function useGestionInstitucional({
  usuarios,
  setUsuarios,
  estudiantes,
  setEstudiantes,
  todasLasAulasColegio
}) {
  // GESTIÓN DE PERSONAL
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

    if (nuevoRolPersonal !== 'subdirector' && aulasSeleccionadasNuevas.length === 0) {
      setMensajeAdmin('⚠️ Debe marcar al menos un grado o sección para este personal.');
      return;
    }

    const aulasAsignadas = nuevoRolPersonal === 'subdirector'
      ? []
      : aulasSeleccionadasNuevas.map(clave => {
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
    localStorage.setItem('dh_usuarios_v26', JSON.stringify(nuevosUsuarios));

    setNuevoNombreDocente('');
    setNuevoUserDocente('');
    setNuevaClaveDocente('');
    setAulasSeleccionadasNuevas([]);
    setMensajeAdmin(`✅ ${nuevoRolPersonal === 'docente' ? 'Docente' : nuevoRolPersonal === 'auxiliar' ? 'Auxiliar' : 'Subdirector'} registrado exitosamente.`);
    setTimeout(() => setMensajeAdmin(''), 3500);

    try {
      await conLimiteDeTiempo(
        guardarUsuario(nuevo),
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
      localStorage.setItem('dh_usuarios_v26', JSON.stringify(restantes));
      try {
        await eliminarUsuario(id);
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

    const aulasFormateadas = editRolPersonal === 'subdirector'
      ? []
      : editAulasPersonal.map(clave => {
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
    localStorage.setItem('dh_usuarios_v26', JSON.stringify(nuevosUsuarios));

    try {
      await actualizarUsuario(personalActualizado);

      setMensajeAdmin('✅ Datos del personal actualizados en la nube.');
      setTimeout(() => setMensajeAdmin(''), 3000);
    } catch (err) {
      setMensajeAdmin('✅ Guardado en memoria.');
      setTimeout(() => setMensajeAdmin(''), 3000);
    }

    setPersonalEditando(null);
  };

  // GESTIÓN DE ESTUDIANTES
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
    localStorage.setItem('dh_estudiantes_v26', JSON.stringify(listaActualizada));

    setNuevoDniAlumno('');
    setNuevoNombreAlumno('');
    setNuevoCelularAlumno('');
    setMensajeAdmin('✅ Estudiante matriculado correctamente.');
    setTimeout(() => setMensajeAdmin(''), 3000);

    try {
      await crearEstudiante(nuevo);
    } catch (err) {
      console.warn('Estudiante guardado localmente.');
    }
  };

  const retirarAlumno = async (id, nombre) => {
    if (window.confirm(`¿Confirmas el retiro o traslado del estudiante "${nombre}"?`)) {
      const restantes = estudiantes.filter(e => e.id !== id);
      setEstudiantes(restantes);
      localStorage.setItem('dh_estudiantes_v26', JSON.stringify(restantes));
      try {
        await eliminarEstudiante(id);
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
    localStorage.setItem('dh_estudiantes_v26', JSON.stringify(estudiantesActualizados));

    try {
      await actualizarEstudiante(estudianteActualizado);
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
        localStorage.setItem('dh_estudiantes_v26', JSON.stringify(cargados));

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


  return {
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
  };
}
