import React from 'react';
import {
  CheckSquare, Clock, Edit3, FileSpreadsheet, Plus, Save, Search,
  ShieldCheck, Square, Trash2, Upload, UserCheck, UserPlus, Users, X
} from 'lucide-react';
import { GRADOS_DH } from '../../constants/aulas';

export default function PanelGestion({ ctx }) {
  const {
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
  } = ctx;

  return (
    <>
        {/* =========================================================================
            VISTA 3: PERSONAL Y PADRÓN
           ========================================================================= */}
        {esDirector && vistaDirector === 'gestion' && (
          <div className="space-y-3.5">
            
            {/* SUB-PESTAÑAS */}
            <div className="flex bg-slate-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSubPestanaGestion('personal')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                  subPestanaGestion === 'personal' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Personal Docente y Auxiliares ({usuarios.filter(u => u.rol !== 'director').length})
              </button>
              <button
                type="button"
                onClick={() => setSubPestanaGestion('estudiantes')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                  subPestanaGestion === 'estudiantes' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎓 Padrón de Estudiantes ({estudiantes.length})
              </button>
            </div>

            {mensajeAdmin && (
              <div className="p-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 text-center animate-pulse">
                {mensajeAdmin}
              </div>
            )}

            {/* SECCIÓN A: PERSONAL */}
            {subPestanaGestion === 'personal' && (
              <div className="space-y-3.5">
                
                {/* REGISTRAR NUEVO DOCENTE O AUXILIAR */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-2.5 text-xs">
                    <UserPlus className="w-4 h-4" />
                    <h3>Registrar Nuevo Docente o Auxiliar de Educación</h3>
                  </div>

                  <form onSubmit={registrarPersonal} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cargo a desempeñar</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setNuevoRolPersonal('auxiliar')}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                            nuevoRolPersonal === 'auxiliar' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Auxiliar de Educación
                        </button>
                        <button
                          type="button"
                          onClick={() => setNuevoRolPersonal('docente')}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                            nuevoRolPersonal === 'docente' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" /> Docente de Aula
                        </button>
                      
                    <button
                      type="button"
                      onClick={() => setNuevoRolPersonal('subdirector')}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                        nuevoRolPersonal === 'subdirector' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Subdirector
                    </button>
</div>
                    </div>

                    <input
                      type="text"
                      placeholder={nuevoRolPersonal === 'auxiliar' ? "Nombre del Auxiliar (ej: Ronald Alarcón)" : "Nombre del Docente y Área (ej: Ana Yance - COM)"}
                      value={nuevoNombreDocente}
                      onChange={(e) => setNuevoNombreDocente(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Usuario de acceso"
                        value={nuevoUserDocente}
                        onChange={(e) => setNuevoUserDocente(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Contraseña (DNI)"
                        value={nuevaClaveDocente}
                        onChange={(e) => setNuevaClaveDocente(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">
                          {nuevoRolPersonal === 'auxiliar' ? 'Secciones asignadas al auxiliar:' : 'Aulas a cargo del docente:'}
                        </label>
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          {aulasSeleccionadasNuevas.length} seleccionadas
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {GRADOS_DH.map(g => (
                          <button
                            type="button"
                            key={g}
                            onClick={() => alternarGradoCompleto(g)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold py-1 px-2 rounded-lg transition"
                          >
                            + Todo {g.slice(0, 3)}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {todasLasAulasColegio.map(aula => {
                          const clave = `${aula.grade}|${aula.section}`;
                          const estaMarcada = aulasSeleccionadasNuevas.includes(clave);
                          return (
                            <button
                              type="button"
                              key={clave}
                              onClick={() => alternarSeleccionAula(clave)}
                              className={`p-2 rounded-lg text-xs font-bold border text-left flex items-center justify-between transition-all ${
                                estaMarcada 
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate">{aula.grade} - {aula.section}</span>
                              {estaMarcada ? (
                                <CheckSquare className="w-4 h-4 shrink-0 text-white" />
                              ) : (
                                <Square className="w-4 h-4 shrink-0 text-slate-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <UserPlus className="w-4 h-4" /> Registrar Personal en el Sistema
                    </button>
                  </form>
                </div>

                {/* LISTA ACTUAL DE PERSONAL */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-black text-slate-700 uppercase mb-2.5">
                    Personal Registrado ({usuarios.filter(u => u.rol !== 'director').length})
                  </h3>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {usuarios.filter(u => u.rol !== 'director').map(usr => (
                      <div key={usr.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{usr.nombre}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            Cargo: <b className="uppercase text-emerald-800">{usr.rol}</b> • Usuario: <b>{usr.usuario}</b> • Clave: <code>{usr.clave}</code>
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {usr.aulasAsignadas && usr.aulasAsignadas.length > 0 ? (
                              usr.aulasAsignadas.map((a, i) => (
                                <span key={i} className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {a.grade} - {a.section}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-400">Sin salones asignados</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => abrirModalEditarPersonal(usr)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                            title="Editar usuario, clave o aulas"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => eliminarDocente(usr.id)}
                            className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition"
                            title="Eliminar acceso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN B: ESTUDIANTES */}
            {subPestanaGestion === 'estudiantes' && (
              <div className="space-y-3.5">
                
                {/* CARGA MASIVA DE EXCEL / SIAGIE */}
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>Carga Masiva Excel / SIAGIE (.xlsx)</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold">Formato Oficial MINEDU</span>
                  </div>
                  
                  <label className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition">
                    <Upload className="w-4 h-4" /> Subir Padrón en Excel (.xlsx)
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={procesarArchivoExcel}
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* MATRICULAR ALUMNO INDIVIDUAL */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase mb-2.5">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Matricular Alumno Nuevo Individual</span>
                  </div>

                  <form onSubmit={registrarAlumnoNuevo} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="DNI (8 dígitos)"
                        maxLength={8}
                        value={nuevoDniAlumno}
                        onChange={(e) => setNuevoDniAlumno(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="APELLIDOS Y NOMBRES"
                        value={nuevoNombreAlumno}
                        onChange={(e) => setNuevoNombreAlumno(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={nuevoGradoAlumno}
                        onChange={(e) => setNuevoGradoAlumno(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                      >
                        <option value="PRIMERO">1°</option>
                        <option value="SEGUNDO">2°</option>
                        <option value="TERCERO">3°</option>
                        <option value="CUARTO">4°</option>
                        <option value="QUINTO">5°</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Sección (ej: HONRADEZ)"
                        value={nuevaSeccionAlumno}
                        onChange={(e) => setNuevaSeccionAlumno(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />

                      <input
                        type="tel"
                        placeholder="Celular"
                        value={nuevoCelularAlumno}
                        onChange={(e) => setNuevoCelularAlumno(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" /> Agregar Alumno al Padrón
                    </button>
                  </form>
                </div>

                {/* LISTA DEL PADRÓN */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase">
                      Padrón ({alumnosFiltradosPadron.length} de {estudiantes.length} alumnos)
                    </h3>
                  </div>

                  <div className="relative mb-2.5">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por DNI, Nombre o Aula..."
                      value={busquedaPadron}
                      onChange={(e) => setBusquedaPadron(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {alumnosFiltradosPadron.map(alumno => (
                      <div key={alumno.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{alumno.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            DNI: <b>{alumno.dni || 'S/D'}</b> • <span className="text-emerald-700 font-bold">{alumno.grade} - {alumno.section}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => abrirModalEditarAlumno(alumno)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                            title="Editar datos"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>
                          
                          <button
                            onClick={() => retirarAlumno(alumno.id, alumno.name)}
                            className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition"
                            title="Dar de baja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* MODAL EDITAR PERSONAL */}
        {personalEditando && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                  <UserCheck className="w-4 h-4" />
                  <h4>Editar Credenciales y Aulas</h4>
                </div>
                <button onClick={() => setPersonalEditando(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={guardarEdicionPersonal} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Cargo / Función</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRolPersonal('auxiliar')}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                        editRolPersonal === 'auxiliar' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Auxiliar de Educación
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRolPersonal('docente')}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                        editRolPersonal === 'docente' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" /> Docente de Aula
                    </button>
                  
                    <button
                      type="button"
                      onClick={() => setEditRolPersonal('subdirector')}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                        editRolPersonal === 'subdirector' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Subdirector
                    </button>
</div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Nombre Completo y Área</label>
                  <input
                    type="text"
                    value={editNombrePersonal}
                    onChange={(e) => setEditNombrePersonal(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Usuario de Login</label>
                    <input
                      type="text"
                      value={editUserPersonal}
                      onChange={(e) => setEditUserPersonal(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Contraseña</label>
                    <input
                      type="text"
                      value={editClavePersonal}
                      onChange={(e) => setEditClavePersonal(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">
                      Secciones Asignadas ({editAulasPersonal.length}):
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {GRADOS_DH.map(g => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => alternarGradoCompletoEdicion(g)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold py-1 px-2 rounded-lg transition"
                      >
                        + Todo {g.slice(0, 3)}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {todasLasAulasColegio.map(aula => {
                      const clave = `${aula.grade}|${aula.section}`;
                      const estaMarcada = editAulasPersonal.includes(clave);
                      return (
                        <button
                          type="button"
                          key={clave}
                          onClick={() => alternarSeleccionAulaEdicion(clave)}
                          className={`p-2 rounded-lg text-xs font-bold border text-left flex items-center justify-between transition-all ${
                            estaMarcada 
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{aula.grade} - {aula.section}</span>
                          {estaMarcada ? (
                            <CheckSquare className="w-4 h-4 shrink-0 text-white" />
                          ) : (
                            <Square className="w-4 h-4 shrink-0 text-slate-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPersonalEditando(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDITAR ESTUDIANTE */}
        {alumnoEditando && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                  <Edit3 className="w-4 h-4" />
                  <h4>Editar Datos del Estudiante</h4>
                </div>
                <button onClick={() => setAlumnoEditando(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={guardarEdicionCompletaAlumno} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Documento de Identidad (DNI):
                  </label>
                  <input
                    type="text"
                    value={editDni}
                    onChange={(e) => setEditDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Ingrese los 8 dígitos"
                    maxLength={8}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Apellidos y Nombres:
                  </label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    required
                    placeholder="APELLIDOS Y NOMBRES"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Grado:
                    </label>
                    <select
                      value={editGrado}
                      onChange={(e) => setEditGrado(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="PRIMERO">PRIMERO</option>
                      <option value="SEGUNDO">SEGUNDO</option>
                      <option value="TERCERO">TERCERO</option>
                      <option value="CUARTO">CUARTO</option>
                      <option value="QUINTO">QUINTO</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Sección:
                    </label>
                    <input
                      type="text"
                      value={editSeccion}
                      onChange={(e) => setEditSeccion(e.target.value.toUpperCase())}
                      required
                      placeholder="Ej: RESPONSABILIDAD"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Celular del Apoderado:
                  </label>
                  <input
                    type="tel"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    placeholder="Ej: 964123456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAlumnoEditando(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


    </>
  );
}
