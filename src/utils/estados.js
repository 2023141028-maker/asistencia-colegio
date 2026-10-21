// ============================================================
// ESTADOS DE ASISTENCIA
// I.E.E. DANIEL HERNÁNDEZ
// ============================================================

export const ESTADOS_ASISTENCIA = {
  P: {
    codigo: 'P',
    nombre: 'PRESENTE'
  },
  T: {
    codigo: 'T',
    nombre: 'TARDANZA'
  },
  F: {
    codigo: 'F',
    nombre: 'FALTA'
  },
  E: {
    codigo: 'E',
    nombre: 'EVASIÓN'
  },
  J: {
    codigo: 'J',
    nombre: 'PERMISO'
  }
};

export const obtenerNombreEstado = (estado) => {
  return (
    ESTADOS_ASISTENCIA[estado]?.nombre ||
    'SIN REGISTRO'
  );
};

export const esEstadoValido = (estado) => {
  return Boolean(
    ESTADOS_ASISTENCIA[estado]
  );
};

export const obtenerEstadosDisponibles = () => {
  return Object.values(
    ESTADOS_ASISTENCIA
  );
};

export const contarEstados = (
  registros = []
) => {
  const conteo = {
    P: 0,
    T: 0,
    F: 0,
    E: 0,
    J: 0
  };

  registros.forEach((estado) => {
    if (conteo[estado] !== undefined) {
      conteo[estado]++;
    }
  });

  return conteo;
};

export const calcularPorcentajeAsistencia = ({
  presentes = 0,
  tardanzas = 0,
  permisos = 0,
  faltas = 0,
  evasiones = 0
}) => {
  const total =
    presentes +
    tardanzas +
    permisos +
    faltas +
    evasiones;

  if (total === 0) {
    return 0;
  }

  return Math.round(
    (
      (
        presentes +
        tardanzas +
        permisos
      ) /
      total
    ) * 100
  );
};
