import { useState } from 'react';
import { generarReporteDiarioExcel } from '../services/excelService';
import { obtenerNombreEstado } from '../utils/estados';
import { obtenerDiasSemana, obtenerDiasMes } from '../utils/fechas';

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

export default function useReportes({ estudiantes, asistencias, fechaHoy }) {
  // REPORTES EXCEL
  const [tipoPeriodoReporte, setTipoPeriodoReporte] = useState('dia');
  const [alcanceReporte, setAlcanceReporte] = useState('todos');
  const [filtroGradoReporte, setFiltroGradoReporte] = useState('PRIMERO');
  const [filtroSeccionReporte, setFiltroSeccionReporte] = useState('RESPONSABILIDAD');

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
      // ============================================================
// NUEVO REPORTE DIARIO CON EXCELJS
// ============================================================

if (tipoPeriodoReporte === 'dia') {
  await generarReporteDiarioExcel({
    fecha: fechaHoy,
    alcanceTexto: tituloAlcance,
    estudiantes: listaExportar,
    asistenciasPorFecha: asistencias,
    nombreArchivo:
      `Asistencia_Diaria_${fechaHoy}_${alcanceReporte.toUpperCase()}.xlsx`
  });

  return;
}

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
        datos.push([
          'N°',
          'DNI',
          'APELLIDOS Y NOMBRES',
          'GRADO',
          'SECCIÓN',
          'ESTADO DIRECCIÓN',
          'REGISTRADO POR DIRECCIÓN',
          'ESTADO DOCENTE',
          'REGISTRADO POR DOCENTE',
          'HORA REGISTRO',
          'OBSERVACIÓN',
          'CELULAR APODERADO'
        ]);
        
        const diaActual = asistencias[fechaHoy] || {};
        
        listaExportar.forEach((alumno, i) => {
          const registro = diaActual[alumno.id];
        
          const estadoDireccion = registro?.status
            ? obtenerNombreEstado(registro.status)
            : 'SIN REGISTRO';
        
          const estadoDocente = registro?.docenteStatus
            ? obtenerNombreEstado(registro.docenteStatus)
            : 'SIN REGISTRO';
        
          const responsableDireccion =
            registro?.registradoPor || 'SIN REGISTRO';
        
          const responsableDocente =
            registro?.registradoDocentePor || 'SIN REGISTRO';
        
          const hora = registro?.time || '--:--';
        
          let observacion = '';
        
          if (
            registro?.registradoPor === 'Sistema - sin control previo'
          ) {
            observacion = 'DOCENTE REGISTRÓ PRIMERO';
          } else if (
            registro?.status &&
            registro?.docenteStatus &&
            registro.status !== registro.docenteStatus
          ) {
            observacion = 'REVISAR DIFERENCIA';
          } else if (
            registro?.status &&
            registro?.docenteStatus &&
            registro.status === registro.docenteStatus
          ) {
            observacion = 'COINCIDE';
          } else if (
            registro?.docenteStatus &&
            !registro?.status
          ) {
            observacion = 'PENDIENTE DIRECCIÓN';
          } else if (
            registro?.status &&
            !registro?.docenteStatus
          ) {
            observacion = 'PENDIENTE DOCENTE';
          } else {
            observacion = 'SIN REGISTRO';
          }
        
          datos.push([
            i + 1,
            alumno.dni || 'S/D',
            alumno.name,
            alumno.grade,
            alumno.section,
            estadoDireccion,
            responsableDireccion,
            estadoDocente,
            responsableDocente,
            hora,
            observacion,
            alumno.phone || ''
          ]);
        });
        
        anchosCols = [
          { wch: 6 },
          { wch: 12 },
          { wch: 38 },
          { wch: 14 },
          { wch: 24 },
          { wch: 20 },
          { wch: 30 },
          { wch: 20 },
          { wch: 35 },
          { wch: 15 },
          { wch: 24 },
          { wch: 18 }
        ];

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

      // ============================================================
      // PRESENTACIÓN GENERAL DEL ARCHIVO EXCEL
      // ============================================================
      
      // Anchos definidos previamente según el tipo de reporte
      ws['!cols'] = anchosCols;
      
      // Detectar tamaño total del reporte
      const rangoHoja = XLSX.utils.decode_range(ws['!ref']);
      const ultimaColumna = rangoHoja.e.c;
      
      // ============================================================
      // TÍTULO PRINCIPAL COMBINADO
      // ============================================================
      
      ws['!merges'] = [
      // Título principal
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: ultimaColumna }
      },
    
      // Institución
      {
        s: { r: 1, c: 1 },
        e: { r: 1, c: 4 }
      },
    
      // Fecha
      {
        s: { r: 2, c: 1 },
        e: { r: 2, c: 3 }
      },
    
      // Alcance
      {
        s: { r: 3, c: 1 },
        e: { r: 3, c: 5 }
      },
    
      // Total alumnos
      {
        s: { r: 4, c: 1 },
        e: { r: 4, c: 2 }
      }
    ];
      // ============================================================
      // IDENTIFICAR FILA DE ENCABEZADOS
      // ============================================================
      
      let filaEncabezadoExcel = 0;
      
      if (tipoPeriodoReporte === 'dia') {
        filaEncabezadoExcel = 6;
      } else if (tipoPeriodoReporte === 'semana') {
        filaEncabezadoExcel = 5;
      } else if (tipoPeriodoReporte === 'mes') {
        filaEncabezadoExcel = 6;
      }
      // ============================================================
      // ALTURA DE FILAS
      // ============================================================
      
      const totalFilas = rangoHoja.e.r + 1;
      
      ws['!rows'] = Array.from(
        { length: totalFilas },
        (_, index) => {
      
          // Título principal
         if (index === 0) {
            return { hpt: 30 };
          }
          
          if (index === filaEncabezadoExcel) {
            return { hpt: 26 };
          }
      
          // Información institucional
          if (index >= 1 && index <= 4) {
            return { hpt: 20 };
          }
      
          // Separador
          if (index === 5) {
            return { hpt: 8 };
          }
      
          // Encabezado y datos
          return { hpt: 20 };
        }
      );
      
      
      
      // ============================================================
      // FILTROS AUTOMÁTICOS
      // ============================================================
      
      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: {
            r: filaEncabezadoExcel,
            c: 0
          },
          e: {
            r: rangoHoja.e.r,
            c: rangoHoja.e.c
          }
        })
      };
      
      // ============================================================
      // CONGELAR ENCABEZADOS
      // ============================================================
      
      ws['!freeze'] = {
        xSplit: 0,
        ySplit: filaEncabezadoExcel + 1
      };
      
      // ============================================================
      // MÁRGENES DE IMPRESIÓN
      // ============================================================
      
      ws['!margins'] = {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2
      };
      
      // ============================================================
      // CONFIGURACIÓN DE PÁGINA
      // ============================================================
      
      // Diario puede verse bien vertical.
      // Semanal y mensual tienen muchas columnas,
      // por eso se preparan en orientación horizontal.
      ws['!pageSetup'] = {
        orientation:
          tipoPeriodoReporte === 'dia'
            ? 'portrait'
            : 'landscape',
      
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9
      };
      
      // ============================================================
      // AGREGAR HOJA AL LIBRO
      // ============================================================
      
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        'Reporte'
      );
      
      // ============================================================
      // DESCARGAR ARCHIVO
      // ============================================================
      
      XLSX.writeFile(
        wb,
        nombreArchivo
      );
      
          } catch (err) {
            alert('Error al generar Excel: ' + err.message);
          }
        };


  return {
    tipoPeriodoReporte,
    setTipoPeriodoReporte,
    alcanceReporte,
    setAlcanceReporte,
    filtroGradoReporte,
    setFiltroGradoReporte,
    filtroSeccionReporte,
    setFiltroSeccionReporte,
    generarReporteExcelAvanzado
  };
}
