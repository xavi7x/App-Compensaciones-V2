// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Un custom hook que retrasa la actualización de un valor.
 * Es útil para evitar llamadas excesivas a la API mientras el usuario escribe en un campo de búsqueda.
 * @param value El valor que se quiere "retrasar" (ej. el término de búsqueda).
 * @param delay El tiempo de espera en milisegundos después de que el usuario deja de escribir.
 * @returns El valor retrasado.
 */
function useDebounce<T>(value: T, delay: number): T {
  // Estado para guardar el valor retrasado
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura un temporizador para actualizar el valor retrasado después del 'delay'
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Función de limpieza: se ejecuta si el 'value' cambia antes de que pase el 'delay'.
    // Esto cancela el temporizador anterior y empieza uno nuevo, reseteando la espera.
    return () => {
      clearTimeout(handler);
    };
  },
  // Solo se vuelve a ejecutar el efecto si 'value' o 'delay' cambian
  [value, delay]
  );

  return debouncedValue;
}

export default useDebounce;