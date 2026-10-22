import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const EscanerQR = ({
  estudiantes = [],
  onRegistrarIngreso
}) => {
  const [dniEscaneado, setDniEscaneado] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [alumnoEncontrado, setAlumnoEncontrado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [horaUltimoRegistro, setHoraUltimoRegistro] = useState('');

  const lectorRef = useRef(null);
  const ultimoCodigoRef = useRef('');

  // ============================================================
  // PROCESAR DNI
  // ============================================================

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
      const horaActual = new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      setHoraUltimoRegistro(horaActual);

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

  // ============================================================
  // DETENER CÁMARA
  // ============================================================

  const detenerCamara = async () => {
    try {
      if (lectorRef.current) {
        const estado = lectorRef.current.getState();

        if (estado === 2 || estado === 3) {
          await lectorRef.current.stop();
        }

        await lectorRef.current.clear();

        lectorRef.current = null;
      }
    } catch (error) {
      console.error(
        'Error al detener cámara:',
        error
      );
    }

    setCamaraActiva(false);
  };

  // ============================================================
  // INICIAR CÁMARA
  // ============================================================

  const iniciarCamara = async () => {
    try {
      setMensaje('');
      setAlumnoEncontrado(null);
      setCamaraActiva(true);

      setTimeout(async () => {
        try {
          const lector = new Html5Qrcode(
            'lector-qr'
          );

          lectorRef.current = lector;

          await lector.start(
            {
              facingMode: 'environment'
            },
            {
              fps: 10,
              qrbox: {
                width: 250,
                height: 250
              }
            },

            async (codigoLeido) => {
              const codigo = String(
                codigoLeido || ''
              ).trim();

              if (
                !codigo ||
                codigo === ultimoCodigoRef.current ||
                procesando
              ) {
                return;
              }

              ultimoCodigoRef.current = codigo;

              await detenerCamara();

              await procesarDNI(codigo);

              setTimeout(() => {
                ultimoCodigoRef.current = '';
              }, 1800);
            },

            () => {
              // Se ignoran errores mientras
              // la cámara busca un QR.
            }
          );
        } catch (error) {
          console.error(error);

          setCamaraActiva(false);

          setMensaje(
            'No se pudo abrir la cámara. Revise los permisos del navegador.'
          );
        }
      }, 150);
    } catch (error) {
      console.error(error);

      setMensaje(
        'No se pudo iniciar la cámara.'
      );
    }
  };

  // ============================================================
  // LIMPIAR CÁMARA AL SALIR
  // ============================================================

  useEffect(() => {
    return () => {
      detenerCamara();
    };
  }, []);

  // ============================================================
  // REGISTRO MANUAL
  // ============================================================

  const manejarSubmit = async (e) => {
    e.preventDefault();

    await procesarDNI(dniEscaneado);

    setDniEscaneado('');
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-4">

      {/* TÍTULO */}
      <div>
        <h2 className="text-lg font-black text-slate-800">
          Control de ingreso QR
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          Escanee el código QR del estudiante.
        </p>
      </div>

      {/* ======================================================
          CÁMARA QR
         ====================================================== */}

      <div className="space-y-3">

        {!camaraActiva ? (
          <button
            type="button"
            onClick={iniciarCamara}
            disabled={procesando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black py-3 rounded-xl"
          >
            Abrir cámara
          </button>
        ) : (
          <>
            <div
              id="lector-qr"
              className="w-full overflow-hidden rounded-xl border border-slate-300 bg-black"
            />

            <button
              type="button"
              onClick={detenerCamara}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl"
            >
              Cerrar cámara
            </button>
          </>
        )}

      </div>

      {/* SEPARADOR */}

      <div className="flex items-center gap-3">
        <div className="h-px bg-slate-200 flex-1" />

        <span className="text-xs font-bold text-slate-400">
          O INGRESE EL DNI
        </span>

        <div className="h-px bg-slate-200 flex-1" />
      </div>

      {/* ======================================================
          REGISTRO MANUAL
         ====================================================== */}

      <form
        onSubmit={manejarSubmit}
        className="space-y-3"
      >

        <input
          type="text"
          value={dniEscaneado}
          onChange={(e) =>
            setDniEscaneado(
              e.target.value.replace(/\D/g, '')
            )
          }
          placeholder="DNI del estudiante"
          maxLength={8}
          inputMode="numeric"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest"
        />

        <button
          type="submit"
          disabled={
            procesando ||
            dniEscaneado.length !== 8
          }
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black py-3 rounded-xl"
        >
          {procesando
            ? 'Registrando...'
            : 'Registrar ingreso'}
        </button>

      </form>

      {/* ======================================================
          DATOS DEL ESTUDIANTE
         ====================================================== */}

      {alumnoEncontrado && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">

          <p className="font-black text-slate-800">
            {alumnoEncontrado.name}
          </p>

          <p className="text-sm text-slate-600 mt-1">
            {alumnoEncontrado.grade}
            {' - '}
            {alumnoEncontrado.section}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            DNI: {alumnoEncontrado.dni}
          </p>
          {horaUltimoRegistro && (
          <p className="text-sm font-bold text-emerald-700 mt-2">
            Hora de ingreso: {horaUltimoRegistro}
          </p>
        )}

        </div>
      )}

      {/* ======================================================
          MENSAJE
         ====================================================== */}

      {mensaje && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-sm font-bold text-center">
          {mensaje}
        </div>
      )}

    </div>
  );
};

export default EscanerQR;
