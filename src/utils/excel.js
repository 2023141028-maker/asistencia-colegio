export const cargarLibreriaExcel = () => {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      resolve(window.XLSX);
      return;
    }

    const existente = document.querySelector('script[data-sheetjs-dh="true"]');
    if (existente) {
      existente.addEventListener('load', () => resolve(window.XLSX), { once: true });
      existente.addEventListener(
        'error',
        () => reject(new Error('No se pudo cargar el procesador de Excel')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
    script.dataset.sheetjsDh = 'true';
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('No se pudo cargar el procesador de Excel'));
    document.head.appendChild(script);
  });
};
