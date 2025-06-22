// src/utils/validationUtils.ts

// Esta función ahora se encarga de limpiar el RUT antes de validarlo.
export const validarRutChileno = (rutCompleto: string): boolean => {
  if (!rutCompleto || typeof rutCompleto !== 'string') {
    return false;
  }

  // Limpiar el RUT de puntos y convertir a minúsculas
  const rutLimpio = rutCompleto.replace(/\./g, '').toLowerCase();

  if (!/^[0-9]+[-|‐]{1}[0-9k]{1}$/.test(rutLimpio)) {
    return false;
  }

  const [rut, dv] = rutLimpio.split('-');
  const dvCalculado = calcularDv(rut);

  return dvCalculado === dv;
};

const calcularDv = (rutSinDv: string): string => {
  let M = 0;
  let S = 1;
  // No es necesario limpiar puntos aquí porque ya se hizo en la función principal
  for (let T = parseInt(rutSinDv, 10); T; T = Math.floor(T / 10)) {
    S = (S + T % 10 * (9 - M++ % 6)) % 11;
  }
  return S ? (S - 1).toString() : 'k';
};
