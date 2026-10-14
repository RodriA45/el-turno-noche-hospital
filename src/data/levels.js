// Leyenda: # pared | . suelo | D puerta | X puerta de salida (necesita 3 llaves)
// P inicio jugador | E inicio entidad | K llave | B batería | N nota
export const MAP = [
  '#####################',
  '#...#...#...#...#...#',
  '#.K.#.B.#.N.#.K.#...#',
  '#...#...#...#...#...#',
  '##D###D###D###D###D##',
  '#P..................X',
  '##D###D###D###D###D##',
  '#...#...#...#...#...#',
  '#...#.N.#.B.#...#.K.#',
  '#...#...#.E.#...#...#',
  '#####################',
];

export const S = 3;        // tamaño de celda (metros)
export const WALL_H = 3;   // altura de paredes
export const KEYS_NEEDED = 3;
