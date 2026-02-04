// Función para comprobar si un jugador es sub21
export function esSub21(jugador) {
  const age = parseInt(jugador.Age, 10);
  return !isNaN(age) && age <= 21;
}

// Función para comprobar si un jugador es mayor o igual a 30
export function esMayor30(jugador) {
  const age = parseInt(jugador.Age, 10);
  return !isNaN(age) && age >= 30;
}