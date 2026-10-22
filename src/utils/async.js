export const conLimiteDeTiempo = (promesa, ms = 3000) =>
  Promise.race([
    promesa,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms)
    )
  ]);
