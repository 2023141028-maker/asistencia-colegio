// ============================================================
// SERVICIO DE REPORTES EXCEL
// I.E.E. DANIEL HERNÁNDEZ
// ============================================================

export const obtenerNombreEstadoExcel = (estado) => {
  const estados = {
    P: 'PRESENTE',
    T: 'TARDANZA',
    F: 'FALTA',
    E: 'EVASIÓN',
    J: 'PERMISO'
  };

  return estados[estado] || 'SIN REGISTRO';
};

export const obtenerDiasSemanaExcel = (fechaStr) => {
  const fecha = new Date(`${fechaStr}T00:00:00`);
  const diaSemana = fecha.getDay();
  const diferenciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(fecha);
  lunes.setDate(fecha.getDate() + diferenciaLunes);

  return Array.from({ length: 5 }, (_, i) => {
    const dia = new Date(lunes);
    dia.setDate(lunes.getDate() + i);
    return dia.toISOString().split('T')[0];
  });
};

export const obtenerDiasMesExcel = (fechaStr) => {
  const [anioTexto, mesTexto] = fechaStr.split('-');
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const totalDias = new Date(anio, mes, 0).getDate();
  const diasHabiles = [];

  for (let dia = 1; dia <= totalDias; dia++) {
    const fecha = `${anioTexto}-${mesTexto}-${String(dia).padStart(2, '0')}`;
    const numeroDia = new Date(`${fecha}T00:00:00`).getDay();

    if (numeroDia >= 1 && numeroDia <= 5) {
      diasHabiles.push(fecha);
    }
  }

  return diasHabiles;
};

const cargarExcelJS = () => {
  return new Promise((resolve, reject) => {
    if (window.ExcelJS) {
      resolve(window.ExcelJS);
      return;
    }

    const existente = document.querySelector('script[data-exceljs-dh="true"]');

    if (existente) {
      existente.addEventListener('load', () => resolve(window.ExcelJS), { once: true });
      existente.addEventListener(
        'error',
        () => reject(new Error('No se pudo cargar ExcelJS.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
    script.dataset.exceljsDh = 'true';
    script.onload = () =>
      window.ExcelJS
        ? resolve(window.ExcelJS)
        : reject(new Error('ExcelJS no pudo iniciarse correctamente.'));
    script.onerror = () => reject(new Error('No se pudo cargar ExcelJS.'));
    document.head.appendChild(script);
  });
};

const descargarArchivoExcel = async (workbook, nombreArchivo) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
};

const COLORES = {
  azul: 'FF1F4E78',
  azulClaro: 'FFD9EAF7',
  verde: 'FF548235',
  verdeClaro: 'FFE2F0D9',
  amarillo: 'FFFFF2CC',
  rojo: 'FFF4CCCC',
  morado: 'FFD9D2E9',
  gris: 'FFF2F2F2',
  grisBorde: 'FFD9D9D9',
  blanco: 'FFFFFFFF',
  textoOscuro: 'FF1F2937',
  rojoTexto: 'FF9C0006',
  naranja: 'FFFCE4D6'
};

const bordeFino = {
  top: { style: 'thin', color: { argb: COLORES.grisBorde } },
  left: { style: 'thin', color: { argb: COLORES.grisBorde } },
  bottom: { style: 'thin', color: { argb: COLORES.grisBorde } },
  right: { style: 'thin', color: { argb: COLORES.grisBorde } }
};

const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

const crearWorkbook = async () => {
  const ExcelJS = await cargarExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'I.E.E. Daniel Hernández';
  workbook.company = 'I.E.E. Daniel Hernández';
  workbook.subject = 'Reporte de asistencia estudiantil';
  workbook.created = new Date();
  return workbook;
};

const agregarCabeceraInstitucional = ({
  hoja,
  titulo,
  subtitulo,
  alcanceTexto,
  totalAlumnos,
  ultimaColumna
}) => {
  // ----------------------------------------------------------
  // TÍTULO PRINCIPAL
  // ----------------------------------------------------------
  hoja.mergeCells(1, 1, 1, ultimaColumna);

  const tituloCelda = hoja.getCell(1, 1);
  tituloCelda.value = titulo;
  tituloCelda.font = {
    bold: true,
    size: 16,
    color: { argb: COLORES.blanco }
  };
  tituloCelda.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORES.azul }
  };
  tituloCelda.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  hoja.getRow(1).height = 30;

  // ----------------------------------------------------------
  // BLOQUE INSTITUCIONAL
  // Etiquetas a la izquierda y valores con mayor espacio.
  // ----------------------------------------------------------
  const filasInfo = [
    ['Institución:', 'I.E.E. DANIEL HERNÁNDEZ'],
    ['Período:', subtitulo],
    ['Alcance:', alcanceTexto || 'GENERAL - TODOS LOS GRADOS'],
    ['Total estudiantes:', totalAlumnos]
  ];

  filasInfo.forEach(([etiqueta, valor], indice) => {
    const fila = indice + 2;

    // Etiqueta ocupa A:B
    hoja.mergeCells(fila, 1, fila, 2);

    // Valor ocupa C hasta el final de la cabecera,
    // asegurando que textos largos no se corten.
    hoja.mergeCells(fila, 3, fila, ultimaColumna);

    const celdaEtiqueta = hoja.getCell(fila, 1);
    const celdaValor = hoja.getCell(fila, 3);

    celdaEtiqueta.value = etiqueta;
    celdaValor.value = valor;

    celdaEtiqueta.font = {
      bold: true,
      size: 11,
      color: { argb: COLORES.azul }
    };

    celdaValor.font = {
      size: 11,
      color: { argb: COLORES.textoOscuro }
    };

    celdaEtiqueta.alignment = {
      horizontal: 'left',
      vertical: 'middle'
    };

    celdaValor.alignment = {
      horizontal: 'left',
      vertical: 'middle',
      wrapText: false
    };

    hoja.getRow(fila).height = 21;
  });

  // Línea vacía antes de la tabla
  hoja.getRow(6).height = 8;
};

const estilizarCabeceraTabla = (hoja, filaEncabezado) => {
  const fila = hoja.getRow(filaEncabezado);
  fila.height = 32;

  fila.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: COLORES.blanco } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.verde } };
    celda.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    celda.border = bordeFino;
  });
};

const estilizarCuerpo = (hoja, filaInicial, filaFinal) => {
  for (let fila = filaInicial; fila <= filaFinal; fila++) {
    const filaActual = hoja.getRow(fila);
    filaActual.height = 22;

    filaActual.eachCell((celda) => {
      celda.border = bordeFino;
      celda.alignment = { vertical: 'middle', wrapText: true };

      if ((fila - filaInicial) % 2 === 1 && !celda.fill?.fgColor) {
        celda.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORES.gris }
        };
      }
    });
  }
};

const configurarHoja = ({
  hoja,
  filaEncabezado,
  ultimaFila,
  ultimaColumna,
  orientacion = 'landscape'
}) => {
  hoja.autoFilter = {
    from: { row: filaEncabezado, column: 1 },
    to: { row: ultimaFila, column: ultimaColumna }
  };

  hoja.views = [
    {
      state: 'frozen',
      ySplit: filaEncabezado,
      activeCell: `A${filaEncabezado + 1}`
    }
  ];

  hoja.pageSetup = {
    orientation: orientacion,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    horizontalCentered: true
  };

  hoja.pageMargins = {
    left: 0.25,
    right: 0.25,
    top: 0.5,
    bottom: 0.5,
    header: 0.2,
    footer: 0.2
  };

  hoja.headerFooter.oddFooter =
    'I.E.E. Daniel Hernández - Sistema de Control de Asistencia    Página &P de &N';
};

const colorEstado = (codigo) => {
  if (codigo === 'P') return COLORES.verdeClaro;
  if (codigo === 'T') return COLORES.amarillo;
  if (codigo === 'F') return COLORES.rojo;
  if (codigo === 'E') return COLORES.morado;
  if (codigo === 'J') return COLORES.azulClaro;
  return null;
};

const aplicarColorEstadoTexto = (celda, codigo) => {
  const color = colorEstado(codigo);

  if (color) {
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  }

  celda.font = { bold: true, color: { argb: COLORES.textoOscuro } };
  celda.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
};

const agregarLeyenda = (hoja, fila, columnaInicial = 1) => {
  const elementos = [
    ['P', 'PRESENTE', COLORES.verdeClaro],
    ['T', 'TARDANZA', COLORES.amarillo],
    ['F', 'FALTA', COLORES.rojo],
    ['E', 'EVASIÓN', COLORES.morado],
    ['J', 'PERMISO', COLORES.azulClaro]
  ];

  hoja.getCell(fila, columnaInicial).value = 'LEYENDA:';
  hoja.getCell(fila, columnaInicial).font = { bold: true };

  elementos.forEach(([codigo, texto, color], indice) => {
    const celda = hoja.getCell(fila, columnaInicial + indice + 1);
    celda.value = `${codigo} = ${texto}`;
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    celda.font = { bold: true, size: 9 };
    celda.alignment = { horizontal: 'center' };
    celda.border = bordeFino;
  });
};

const contarEstadosAlumno = ({ alumno, dias, asistenciasPorFecha }) => {
  const conteo = { P: 0, T: 0, F: 0, E: 0, J: 0 };
  const estadosPorDia = [];

  dias.forEach((fecha) => {
    const registro =
      asistenciasPorFecha?.[fecha]?.[String(alumno.id)] ||
      asistenciasPorFecha?.[fecha]?.[alumno.id];

    const esRegistroRealDireccion =
      registro?.status &&
      registro?.registradoPor !== 'Sistema - sin control previo';

    const estado = esRegistroRealDireccion
      ? registro.status
      : '-';

    estadosPorDia.push(estado);

    if (conteo[estado] !== undefined) {
      conteo[estado] += 1;
    }
  });

  const total = conteo.P + conteo.T + conteo.F + conteo.E + conteo.J;
  const porcentaje = total > 0
    ? Math.round(((conteo.P + conteo.T + conteo.J) / total) * 100)
    : 0;

  return { ...conteo, total, porcentaje, estadosPorDia };
};

export const generarReporteDiarioExcel = async ({
  fecha,
  alcanceTexto,
  estudiantes,
  asistenciasPorFecha,
  nombreArchivo = `Asistencia_Diaria_${fecha}.xlsx`
}) => {
  const workbook = await crearWorkbook();
  const hoja = workbook.addWorksheet('Asistencia Diaria', {
    properties: { tabColor: { argb: COLORES.verde } }
  });

  // Formato operativo solicitado por Dirección:
  // estado del día + observación/acumulado + acción.
  const encabezados = [
    'N°',
    'DNI',
    'APELLIDOS Y NOMBRES',
    'GRADO',
    'SECCIÓN',
    'HORA',
    'ESTADO',
    'OBSERVACIONES',
    'ACCIÓN'
  ];

  agregarCabeceraInstitucional({
    hoja,
    titulo: 'REPORTE DIARIO DE ASISTENCIA ESTUDIANTIL',
    subtitulo: formatearFecha(fecha),
    alcanceTexto,
    totalAlumnos: estudiantes.length,
    ultimaColumna: encabezados.length
  });

  hoja.addRow(encabezados);
  const filaEncabezado = 7;

  const registrosDia = asistenciasPorFecha?.[fecha] || {};
  const diasSemana = obtenerDiasSemanaExcel(fecha);

  estudiantes.forEach((alumno, indice) => {
    const registroHoy =
      registrosDia[String(alumno.id)] ||
      registrosDia[alumno.id] ||
      null;

    const esRegistroRealDireccion =
      registroHoy?.status &&
      registroHoy?.registradoPor !== 'Sistema - sin control previo';

    const estadoHoy = esRegistroRealDireccion
      ? registroHoy.status
      : '';

    const nombreEstado = estadoHoy
      ? obtenerNombreEstadoExcel(estadoHoy)
      : 'SIN REGISTRO';

    let tardanzasSemana = 0;
    let faltasSemana = 0;
    let permisosSemana = 0;
    let evasionesSemana = 0;

    diasSemana.forEach((dia) => {
      const registro =
        asistenciasPorFecha?.[dia]?.[String(alumno.id)] ||
        asistenciasPorFecha?.[dia]?.[alumno.id];

      if (registro?.status === 'T') tardanzasSemana += 1;
      if (registro?.status === 'F') faltasSemana += 1;
      if (registro?.status === 'J') permisosSemana += 1;
      if (registro?.status === 'E') evasionesSemana += 1;
    });

    const observaciones = [];

    if (tardanzasSemana > 0) {
      observaciones.push(
        `${tardanzasSemana} tardanza${tardanzasSemana === 1 ? '' : 's'}`
      );
    }

    if (faltasSemana > 0) {
      observaciones.push(
        `${faltasSemana} falta${faltasSemana === 1 ? '' : 's'}`
      );
    }

    if (permisosSemana > 0) {
      observaciones.push(
        `${permisosSemana} permiso${permisosSemana === 1 ? '' : 's'}`
      );
    }

    if (evasionesSemana > 0) {
      observaciones.push(
        `${evasionesSemana} evasión${evasionesSemana === 1 ? '' : 'es'}`
      );
    }

    const requiereAtencion =
      tardanzasSemana >= 3 ||
      faltasSemana >= 3 ||
      evasionesSemana >= 1;

    const accion = requiereAtencion
      ? 'LLAMAR ATENCIÓN'
      : '';

    const fila = hoja.addRow([
      indice + 1,
      alumno.dni || 'S/D',
      alumno.name || '',
      alumno.grade || '',
      alumno.section || '',
      esRegistroRealDireccion ? (registroHoy?.time || '--:--') : '--:--',
      nombreEstado,
      observaciones.join(' / '),
      accion
    ]);

    fila.getCell(1).alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };

    fila.getCell(4).alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };

    fila.getCell(5).alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };

    fila.getCell(6).alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };

    fila.getCell(7).alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };

    // Colores por estado del día.
    aplicarColorEstadoTexto(
      fila.getCell(7),
      estadoHoy
    );

    // Resaltar observaciones acumuladas.
    if (
      tardanzasSemana >= 3 ||
      faltasSemana >= 3 ||
      evasionesSemana >= 1
    ) {
      fila.getCell(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORES.amarillo }
      };

      fila.getCell(8).font = {
        bold: true,
        color: { argb: COLORES.rojoTexto }
      };
    }

    if (requiereAtencion) {
      fila.getCell(9).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORES.rojo }
      };

      fila.getCell(9).font = {
        bold: true,
        color: { argb: COLORES.rojoTexto }
      };

      fila.getCell(9).alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
    }
  });

  hoja.columns = [
    { width: 6 },
    { width: 13 },
    { width: 38 },
    { width: 13 },
    { width: 22 },
    { width: 13 },
    { width: 16 },
    { width: 28 },
    { width: 22 }
  ];

  estilizarCabeceraTabla(
    hoja,
    filaEncabezado
  );

  estilizarCuerpo(
    hoja,
    filaEncabezado + 1,
    hoja.rowCount
  );

  // Reaplicar colores de estado y alertas después del estilo alternado.
  for (
    let fila = filaEncabezado + 1;
    fila <= hoja.rowCount;
    fila++
  ) {
    const valorEstado = String(
      hoja.getCell(fila, 7).value || ''
    ).toUpperCase();

    let codigoEstado = '';

    if (valorEstado === 'PRESENTE') codigoEstado = 'P';
    if (valorEstado === 'TARDANZA') codigoEstado = 'T';
    if (valorEstado === 'FALTA') codigoEstado = 'F';
    if (valorEstado === 'EVASIÓN') codigoEstado = 'E';
    if (valorEstado === 'PERMISO') codigoEstado = 'J';

    aplicarColorEstadoTexto(
      hoja.getCell(fila, 7),
      codigoEstado
    );

    const accion = String(
      hoja.getCell(fila, 9).value || ''
    );

    if (accion === 'LLAMAR ATENCIÓN') {
      hoja.getCell(fila, 8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORES.amarillo }
      };

      hoja.getCell(fila, 8).font = {
        bold: true,
        color: { argb: COLORES.rojoTexto }
      };

      hoja.getCell(fila, 9).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORES.rojo }
      };

      hoja.getCell(fila, 9).font = {
        bold: true,
        color: { argb: COLORES.rojoTexto }
      };
    }
  }

  const filaNota = hoja.rowCount + 2;

  hoja.mergeCells(
    filaNota,
    1,
    filaNota,
    encabezados.length
  );

  hoja.getCell(filaNota, 1).value =
    'ESTADO = situación del estudiante en el día. OBSERVACIONES = acumulado semanal de tardanzas, faltas, permisos y evasiones.';

  hoja.getCell(filaNota, 1).font = {
    italic: true,
    size: 10,
    color: { argb: COLORES.textoOscuro }
  };

  hoja.getCell(filaNota, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORES.azulClaro }
  };

  hoja.getCell(filaNota, 1).alignment = {
    vertical: 'middle',
    wrapText: true
  };

  hoja.getRow(filaNota).height = 28;

  configurarHoja({
    hoja,
    filaEncabezado,
    ultimaFila:
      filaEncabezado + estudiantes.length,
    ultimaColumna:
      encabezados.length,
    orientacion: 'landscape'
  });

  await descargarArchivoExcel(
    workbook,
    nombreArchivo
  );
};

export const generarReporteSemanalExcel = async ({
  fecha,
  alcanceTexto,
  estudiantes,
  asistenciasPorFecha,
  nombreArchivo
}) => {
  const workbook = await crearWorkbook();
  const hoja = workbook.addWorksheet('Consolidado Semanal', {
    properties: { tabColor: { argb: COLORES.azul } }
  });

  const dias = obtenerDiasSemanaExcel(fecha);
  const nombresDias = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];

  const encabezados = [
    'N°',
    'DNI',
    'APELLIDOS Y NOMBRES',
    'GRADO',
    'SECCIÓN',
    ...dias.map((dia, i) => `${nombresDias[i]}\n${formatearFecha(dia).slice(0, 5)}`),
    'P',
    'T',
    'F',
    'E',
    'J',
    'TOTAL',
    '% ASIST.',
    'SEGUIMIENTO',
    'CELULAR'
  ];

  agregarCabeceraInstitucional({
    hoja,
    titulo: 'CONSOLIDADO SEMANAL DE ASISTENCIA',
    subtitulo: `Del ${formatearFecha(dias[0])} al ${formatearFecha(dias[4])}`,
    alcanceTexto,
    totalAlumnos: estudiantes.length,
    ultimaColumna: encabezados.length
  });

  hoja.addRow(encabezados);
  const filaEncabezado = 7;

  estudiantes.forEach((alumno, indice) => {
    const datos = contarEstadosAlumno({
      alumno,
      dias,
      asistenciasPorFecha
    });

    const seguimiento =
      datos.E >= 1 || datos.T >= 3 || datos.F >= 3
        ? 'REQUIERE SEGUIMIENTO'
        : 'REGULAR';

    const fila = hoja.addRow([
      indice + 1,
      alumno.dni || 'S/D',
      alumno.name || '',
      alumno.grade || '',
      alumno.section || '',
      ...datos.estadosPorDia,
      datos.P,
      datos.T,
      datos.F,
      datos.E,
      datos.J,
      datos.total,
      datos.porcentaje / 100,
      seguimiento,
      alumno.phone || ''
    ]);

    for (let col = 6; col <= 10; col++) {
      const codigo = String(fila.getCell(col).value || '');
      aplicarColorEstadoTexto(fila.getCell(col), codigo);
    }

    fila.getCell(17).numFmt = '0%';

    if (seguimiento === 'REQUIERE SEGUIMIENTO') {
      fila.getCell(18).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORES.naranja }
      };
      fila.getCell(18).font = { bold: true, color: { argb: COLORES.rojoTexto } };
    }
  });

  hoja.columns = [
    { width: 6 },
    { width: 13 },
    { width: 35 },
    { width: 12 },
    { width: 20 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 7 },
    { width: 7 },
    { width: 7 },
    { width: 7 },
    { width: 7 },
    { width: 9 },
    { width: 11 },
    { width: 22 },
    { width: 17 }
  ];

  estilizarCabeceraTabla(hoja, filaEncabezado);
  estilizarCuerpo(hoja, filaEncabezado + 1, hoja.rowCount);
  agregarLeyenda(hoja, hoja.rowCount + 2);

  configurarHoja({
    hoja,
    filaEncabezado,
    ultimaFila: filaEncabezado + estudiantes.length,
    ultimaColumna: encabezados.length
  });

  await descargarArchivoExcel(
    workbook,
    nombreArchivo || `Asistencia_Semanal_${dias[0]}_al_${dias[4]}.xlsx`
  );
};

export const generarReporteMensualExcel = async ({
  fecha,
  alcanceTexto,
  estudiantes,
  asistenciasPorFecha,
  nombreArchivo
}) => {
  const workbook = await crearWorkbook();
  const hoja = workbook.addWorksheet('Consolidado Mensual', {
    properties: { tabColor: { argb: COLORES.azul } }
  });

  const dias = obtenerDiasMesExcel(fecha);
  const mes = fecha.slice(0, 7);

  const encabezados = [
    'N°',
    'DNI',
    'APELLIDOS Y NOMBRES',
    'GRADO',
    'SECCIÓN',
    'PRESENTES',
    'TARDANZAS',
    'FALTAS',
    'EVASIONES',
    'PERMISOS',
    'TOTAL REG.',
    '% ASIST.',
    'CONDICIÓN',
    'CELULAR APODERADO'
  ];

  agregarCabeceraInstitucional({
    hoja,
    titulo: 'CONSOLIDADO MENSUAL DE ASISTENCIA',
    subtitulo: `${mes} - ${dias.length} días hábiles`,
    alcanceTexto,
    totalAlumnos: estudiantes.length,
    ultimaColumna: encabezados.length
  });

  hoja.addRow(encabezados);
  const filaEncabezado = 7;

  estudiantes.forEach((alumno, indice) => {
    const datos = contarEstadosAlumno({
      alumno,
      dias,
      asistenciasPorFecha
    });

    const condicion =
      datos.E >= 1 || datos.T >= 3 || datos.F >= 3
        ? 'EN SEGUIMIENTO'
        : 'REGULAR';

    const fila = hoja.addRow([
      indice + 1,
      alumno.dni || 'S/D',
      alumno.name || '',
      alumno.grade || '',
      alumno.section || '',
      datos.P,
      datos.T,
      datos.F,
      datos.E,
      datos.J,
      datos.total,
      datos.porcentaje / 100,
      condicion,
      alumno.phone || ''
    ]);

    fila.getCell(12).numFmt = '0%';

    if (datos.T >= 3) {
      fila.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.amarillo } };
      fila.getCell(7).font = { bold: true };
    }

    if (datos.F >= 3) {
      fila.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.rojo } };
      fila.getCell(8).font = { bold: true, color: { argb: COLORES.rojoTexto } };
    }

    if (datos.E >= 1) {
      fila.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.morado } };
      fila.getCell(9).font = { bold: true };
    }

    if (condicion === 'EN SEGUIMIENTO') {
      fila.getCell(13).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.naranja } };
      fila.getCell(13).font = { bold: true, color: { argb: COLORES.rojoTexto } };
    }
  });

  hoja.columns = [
    { width: 6 },
    { width: 13 },
    { width: 36 },
    { width: 12 },
    { width: 20 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 11 },
    { width: 20 },
    { width: 18 }
  ];

  estilizarCabeceraTabla(hoja, filaEncabezado);
  estilizarCuerpo(hoja, filaEncabezado + 1, hoja.rowCount);

  configurarHoja({
    hoja,
    filaEncabezado,
    ultimaFila: filaEncabezado + estudiantes.length,
    ultimaColumna: encabezados.length
  });

  await descargarArchivoExcel(
    workbook,
    nombreArchivo || `Consolidado_Mensual_${mes}.xlsx`
  );
};
