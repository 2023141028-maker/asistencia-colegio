import React, { useState } from 'react';

const EscanerQR = ({
  estudiantes = [],
  onRegistrarIngreso
}) => {
  const [dniEscaneado, setDniEscaneado] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [alumnoEncontrado, setAlumnoEncontrado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const procesarDNI = async (dni) => {
    const dniLimpio = String(dni || '').trim();

    if (!/^\d{8}$/.test(dniLimpio)) {
      setMensaje('El código QR no contiene un DNI válido.');
      setAlumnoEncontrado(null);
      return;
    }

    const alumno = estudiantes.find(
      (e) => String(e.dni) === dniLimpio
    );

    if (!alumno) {
      setMensaje('Estudiante no encontrado en el padrón.');
      setAlumnoEncontrado(null);
      return;
    }

    setAlumnoEncontrado(alumno);

    try {
      setProcesando(true);

      const resultado = await onRegistrarIngreso(alumno);

      setMensaje(
        resultado?.mensaje ||
        'Ingreso registrado correctamente.'
      );
    } catch (error) {
      console.error(error);

      setMensaje(
        'No se pudo registrar el ingreso.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    await procesarDNI(dniEscaneado);

    setDniEscaneado('');
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-4">

      <div>
        <h2 className="text-lg font-black text-slate-800">
          Control de ingreso QR
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          Escanee el código QR del estudiante.
        </p>
      </div>

      <form
        onSubmit={manejarSubmit}
        className="space-y-3"
      >
        <input
          type="text"
          value={dniEscaneado}
          onChange={(e) =>
            setDniEscaneado(e.target.value)
          }
          placeholder="DNI del estudiante"
          maxLength={8}
          autoFocus
          inputMode="numeric"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest"
        />

        <button
          type="submit"
          disabled={procesando}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black py-3 rounded-xl"
        >
          {procesando
            ? 'Registrando...'
            : 'Registrar ingreso'}
        </button>
      </form>

      {alumnoEncontrado && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">

          <p className="font-black text-slate-800">
            {alumnoEncontrado.name}
          </p>

          <p className="text-sm text-slate-600 mt-1">
            {alumnoEncontrado.grade} - {alumnoEncontrado.section}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            DNI: {alumnoEncontrado.dni}
          </p>

        </div>
      )}

      {mensaje && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-sm font-bold text-center">
          {mensaje}
        </div>
      )}

    </div>
  );
};

export default EscanerQR;
