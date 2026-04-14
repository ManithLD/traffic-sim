type Adjacency = Map<string, { nodeId: string; roadId: string; cost: number }[]>

export interface PathResult {
  signalIds: string[]
  roadIds: string[]
}

export function dijkstra( // add A* later?
  adjacency: Adjacency,
  startId: string,
  endId: string
): PathResult | null {
  const dist = new Map<string, number>()
  const prev = new Map<string, { nodeId: string; roadId: string } | null>()
  const unvisited = new Set<string>()

  for (const id of adjacency.keys()) {
    dist.set(id, Infinity)
    unvisited.add(id)
  }
  dist.set(startId, 0)
  prev.set(startId, null)

  while (unvisited.size > 0) {
    let current: string | null = null
    let smallest = Infinity
    for (const id of unvisited) {
      const d = dist.get(id) ?? Infinity
      if (d < smallest) { smallest = d; current = id }
    }

    if (!current || smallest === Infinity) break
    if (current === endId) break

    unvisited.delete(current)

    for (const neighbour of adjacency.get(current) ?? []) {
      if (!unvisited.has(neighbour.nodeId)) continue

      const newDist = (dist.get(current) ?? Infinity) + neighbour.cost
      if (newDist < (dist.get(neighbour.nodeId) ?? Infinity)) {
        dist.set(neighbour.nodeId, newDist)
        prev.set(neighbour.nodeId, { nodeId: current, roadId: neighbour.roadId })
      }
    }
  }

  if (!prev.has(endId)) return null;

  const signalIds: string[] = [];
  const roadIds: string[] = [];
  let current: string | null = endId;

  while (current !== null) {
    signalIds.unshift(current);
    const p = prev.get(current);
    
    if (p) {
      roadIds.unshift(p.roadId);
      current = p.nodeId; 
    } else {
      current = null;
    }
  }

  return { signalIds, roadIds };
}