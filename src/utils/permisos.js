// ============================================================
// PERMISOS Y ROLES DEL SISTEMA
// I.E.E. DANIEL HERNÁNDEZ
// ============================================================

export const esDirector = (usuario) => {
  return usuario?.rol === 'director';
};

export const esSubdirector = (usuario) => {
  return usuario?.rol === 'subdirector';
};

export const esAuxiliar = (usuario) => {
  return usuario?.rol === 'auxiliar';
};

export const esDocente = (usuario) => {
  return usuario?.rol === 'docente';
};

export const esDireccion = (usuario) => {
  return (
    usuario?.rol === 'director' ||
    usuario?.rol === 'subdirector'
  );
};

export const puedeVerTodoElColegio = (usuario) => {
  return esDireccion(usuario);
};

export const puedeRegistrarAsistenciaGeneral = (usuario) => {
  return (
    esDirector(usuario) ||
    esSubdirector(usuario) ||
    esAuxiliar(usuario)
  );
};

export const puedeGestionarPersonal = (usuario) => {
  return esDirector(usuario);
};

export const puedeDescargarReportes = (usuario) => {
  return (
    esDirector(usuario) ||
    esSubdirector(usuario)
  );
};

export const puedeRegistrarAsistenciaDocente = (usuario) => {
  return esDocente(usuario);
};

export const puedeVerAula = (
  usuario,
  grado,
  seccion
) => {
  if (!usuario) {
    return false;
  }

  // Director y Subdirector pueden ver todo
  if (puedeVerTodoElColegio(usuario)) {
    return true;
  }

  // Auxiliares y docentes solo ven aulas asignadas
  const aulasAsignadas =
    usuario.aulasAsignadas || [];

  return aulasAsignadas.some(
    (aula) =>
      aula.grade === grado &&
      aula.section === seccion
  );
};

export const obtenerAulasPermitidas = (
  usuario,
  todasLasAulas = []
) => {
  if (!usuario) {
    return [];
  }

  if (puedeVerTodoElColegio(usuario)) {
    return todasLasAulas;
  }

  if (
    Array.isArray(usuario.aulasAsignadas) &&
    usuario.aulasAsignadas.length > 0
  ) {
    return usuario.aulasAsignadas;
  }

  return [];
};
