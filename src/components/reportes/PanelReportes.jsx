import React from 'react';
import { CalendarRange, Download, FileSpreadsheet, Filter } from 'lucide-react';
import { GRADOS_DH } from '../../constants/aulas';

export default function PanelReportes({
  tipoPeriodoReporte,
  setTipoPeriodoReporte,
  alcanceReporte,
  setAlcanceReporte,
  filtroGradoReporte,
  setFiltroGradoReporte,
  filtroSeccionReporte,
  setFiltroSeccionReporte,
  todasLasAulasColegio,
  generarReporteExcelAvanzado
}) {
  return (
    <div className="space-y-3.5">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-300">
        <div className="flex items-center gap-2 text-emerald-900 font-bold mb-3">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black">Descargar Reportes en Excel (.xlsx)</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5 flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
              1. Período:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                ['dia', '📅 Día'],
                ['semana', '📆 Semana'],
                ['mes', '📊 Mes']
              ].map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setTipoPeriodoReporte(valor)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                    tipoPeriodoReporte === valor
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              2. Alcance:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                ['todos', '🌐 Todo el Colegio'],
                ['grado', '🏫 Por Grado'],
                ['aula', '🚪 Por Aula']
              ].map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setAlcanceReporte(valor)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                    alcanceReporte === valor
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          {(alcanceReporte === 'grado' || alcanceReporte === 'aula') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fadeIn">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Grado</label>
                <select
                  value={filtroGradoReporte}
                  onChange={(e) => setFiltroGradoReporte(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  {GRADOS_DH.map((grado) => (
                    <option key={grado} value={grado}>{grado}</option>
                  ))}
                </select>
              </div>

              {alcanceReporte === 'aula' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sección</label>
                  <select
                    value={filtroSeccionReporte}
                    onChange={(e) => setFiltroSeccionReporte(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {todasLasAulasColegio
                      .filter((a) => a.grade === filtroGradoReporte)
                      .map((a) => (
                        <option key={a.section} value={a.section}>{a.section}</option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={generarReporteExcelAvanzado}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3.5 px-4 rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] mt-2"
          >
            <Download className="w-5 h-5 text-emerald-200" />
            <span>Descargar Reporte en Excel (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
