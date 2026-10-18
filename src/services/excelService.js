// ============================================================
// SERVICIO DE REPORTES EXCEL
// I.E.E. DANIEL HERNÁNDEZ
// ============================================================

// Convierte los códigos de asistencia a texto completo
export const obtenerNombreEstadoExcel = (estado) => {
  if (estado === 'P') return 'PRESENTE';
  if (estado === 'T') return 'TARDANZA';
  if (estado === 'F') return 'FALTA';
  if (estado === 'E') return 'EVASIÓN';
  if (estado === 'J') return 'PERMISO';

  return 'SIN REGISTRO';
};

// Obtiene los días de lunes a viernes de la semana seleccionada
export const obtenerDiasSemanaExcel = (fechaStr) => {
  const fecha = new Date(`${fechaStr}T00:00:00`);
  const diaSemana = fecha.getDay();

  const diferenciaLunes =
    diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(fecha);
  lunes.setDate(fecha.getDate() + diferenciaLunes);

  const dias = [];

  for (let i = 0; i < 5; i++) {
    const dia = new Date(lunes);
    dia.setDate(lunes.getDate() + i);

    dias.push(
      dia.toISOString().split('T')[0]
    );
  }

  return dias;
};

// Obtiene los días hábiles del mes seleccionado
export const obtenerDiasMesExcel = (fechaStr) => {
  const [anioTexto, mesTexto] = fechaStr.split('-');

  const anio = parseInt(anioTexto, 10);
  const mes = parseInt(mesTexto, 10);

  const totalDias = new Date(
    anio,
    mes,
    0
  ).getDate();

  const diasHabiles = [];

  for (let dia = 1; dia <= totalDias; dia++) {
    const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    const fechaObjeto = new Date(
      `${fecha}T00:00:00`
    );

    const numeroDia = fechaObjeto.getDay();

    if (numeroDia >= 1 && numeroDia <= 5) {
      diasHabiles.push(fecha);
    }
  }

  return diasHabiles;
};

// ============================================================
// CARGAR EXCELJS EN EL NAVEGADOR
// ============================================================

const cargarExcelJS = () => {
  return new Promise((resolve, reject) => {
    // Si ya está cargado, lo reutilizamos
    if (window.ExcelJS) {
      resolve(window.ExcelJS);
      return;
    }

    const script = document.createElement('script');

    script.src =
      'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';

    script.onload = () => {
      if (window.ExcelJS) {
        resolve(window.ExcelJS);
      } else {
        reject(
          new Error('ExcelJS no pudo iniciarse correctamente.')
        );
      }
    };

    script.onerror = () => {
      reject(
        new Error('No se pudo cargar la librería ExcelJS.')
      );
    };

    document.head.appendChild(script);
  });
};

// ============================================================
// DESCARGAR ARCHIVO .XLSX
// ============================================================

const descargarArchivoExcel = async (
  workbook,
  nombreArchivo
) => {
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob(
    [buffer],
    {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  );

  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');

  enlace.href = url;
  enlace.download = nombreArchivo;

  document.body.appendChild(enlace);

  enlace.click();

  document.body.removeChild(enlace);

  URL.revokeObjectURL(url);
};
