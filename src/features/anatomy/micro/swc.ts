/** SWC is a measured 3D tracing, not a triangulated cell surface. */
export type SwcPoint = {id: number; type: number; x: number; y: number; z: number; radius: number; parent: number};

export function parseSwc(text: string): SwcPoint[] {
  const points = text.split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#')).map(line => {
    const values = line.trim().split(/\s+/).map(Number);
    if (values.length !== 7 || values.some(value => !Number.isFinite(value))) throw new Error('Trazado neuronal inválido.');
    const [id, type, x, y, z, radius, parent] = values;
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(type) || !Number.isInteger(parent) || radius <= 0) throw new Error('Punto neuronal inválido.');
    return {id, type, x, y, z, radius, parent};
  });
  const byId = new Map(points.map(point => [point.id, point]));
  if (!points.length || byId.size !== points.length || points.filter(point => point.parent === -1).length !== 1) throw new Error('La reconstrucción debe tener una raíz y puntos únicos.');
  const visited = new Set<number>();
  for (const point of points) {
    const path = new Set<number>();
    let current: SwcPoint | undefined = point;
    while (current && !visited.has(current.id)) {
      if (path.has(current.id)) throw new Error('El trazado contiene un ciclo.');
      path.add(current.id);
      if (current.parent === -1) break;
      current = byId.get(current.parent);
      if (!current) throw new Error('Falta una conexión del trazado.');
    }
    for (const id of path) visited.add(id);
  }
  return points;
}

export function swcSegments(points: SwcPoint[]) {
  const byId = new Map(points.map(point => [point.id, point]));
  return points.filter(point => point.parent !== -1).map(point => ({from: byId.get(point.parent)!, to: point}));
}
