// src/utils/validationUtils.ts
export const validarRutChileno = (rutCompleto: string): boolean => {
    if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rutCompleto)) {
      return false;
    }
    const [rut, dv] = rutCompleto.split('-');
    const dvCalculado = calcularDv(rut);
    return dvCalculado === dv.toLowerCase();
  };
  
  const calcularDv = (rutSinDv: string): string => {
    let M = 0;
    let S = 1;
    for (let T = parseInt(rutSinDv, 10); T; T = Math.floor(T / 10)) {
      S = (S + T % 10 * (9 - M++ % 6)) % 11;
    }
    return S ? (S - 1).toString() : 'k';
  };
  