export const obtenerDiasSemana = (fechaStr) => {
  const d = new Date(fechaStr + 'T00:00:00');
  const diaSem = d.getDay();
  const diffALunes = diaSem === 0 ? -6 : 1 - diaSem;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diffALunes);

  return Array.from({ length: 5 }, (_, i) => {
    const temp = new Date(lunes);
    temp.setDate(lunes.getDate() + i);
    return temp.toISOString().split('T')[0];
  });
};

export const obtenerDiasMes = (fechaStr) => {
  const [anioStr, mesStr] = fechaStr.split('-');
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  const totalDias = new Date(anio, mes, 0).getDate();

  return Array.from({ length: totalDias }, (_, i) => {
    const dia = String(i + 1).padStart(2, '0');
    return `${anioStr}-${mesStr}-${dia}`;
  });
};

export const obtenerHoraActual = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
