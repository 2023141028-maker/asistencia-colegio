import { useState } from 'react';
import {
  generarReporteDiarioExcel,
  generarReporteSemanalExcel,
  generarReporteMensualExcel
} from '../services/excelService';

export default function useReportes({ estudiantes, asistencias, fechaHoy }) {
  const [tipoPeriodoReporte, setTipoPeriodoReporte] = useState('dia');
  const [alcanceReporte, setAlcanceReporte] = useState('todos');
  const [filtroGradoReporte, setFiltroGradoReporte] = useState('PRIMERO');
  const [filtroSeccionReporte, setFiltroSeccionReporte] = useState('RESPONSABILIDAD');

  const generarReporteExcelAvanzado = async () => {
    if (estudiantes.length === 0) {
      alert('El padrón escolar no tiene alumnos registrados.');
      return;
    }

    let listaExportar = [...estudiantes];
    let tituloAlcance = 'GENERAL - TODOS LOS GRADOS';

    if (alcanceReporte === 'grado') {
      listaExportar = estudiantes.filter(
        (e) => e.grade === filtroGradoReporte
      );
      tituloAlcance = `GRADO: ${filtroGradoReporte}`;
    } else if (alcanceReporte === 'aula') {
      listaExportar = estudiantes.filter(
        (e) =>
          e.grade === filtroGradoReporte &&
          e.section === filtroSeccionReporte
      );
      tituloAlcance = `AULA: ${filtroGradoReporte} - ${filtroSeccionReporte}`;
    }

    listaExportar.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return a.name.localeCompare(b.name);
    });

    if (listaExportar.length === 0) {
      alert('No hay estudiantes para el alcance seleccionado.');
      return;
    }

    try {
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

      if (tipoPeriodoReporte === 'semana') {
        await generarReporteSemanalExcel({
          fecha: fechaHoy,
          alcanceTexto: tituloAlcance,
          estudiantes: listaExportar,
          asistenciasPorFecha: asistencias,
          nombreArchivo:
            `Asistencia_Semanal_${fechaHoy}_${alcanceReporte.toUpperCase()}.xlsx`
        });
        return;
      }

      await generarReporteMensualExcel({
        fecha: fechaHoy,
        alcanceTexto: tituloAlcance,
        estudiantes: listaExportar,
        asistenciasPorFecha: asistencias,
        nombreArchivo:
          `Consolidado_Mensual_${fechaHoy.slice(0, 7)}_${alcanceReporte.toUpperCase()}.xlsx`
      });
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
