import torontoData from '../data/toronto.json'

export interface MapNode {
    id: string
    lat: number
    lon: number
    isSignal: boolean
}

export interface Road {
    id: string
    name: string
    coordinates: [number, number][]
    nodeIds: string[] 
}

export interface RoadNetwork {
    nodes: MapNode[]
    roads: Road[]
    signals: MapNode[]
}

const getCoordId = (lat: number, lon: number) => 
    `node-${lat.toFixed(6)}-${lon.toFixed(6)}`;

function getImportedData(): any {
    let data = (torontoData as any)?.default ?? torontoData;
    while (data && typeof data === 'object' && 'default' in data) {
        data = (data as any).default;
    }
    return typeof data === 'string' ? JSON.parse(data) : data;
}

export function loadRoadNetwork(): RoadNetwork {
    const rawData = getImportedData();
    const allNodesMap = new Map<string, MapNode>();
    const roads: Road[] = [];

    if (rawData.type === 'FeatureCollection') {
        for (const feature of rawData.features) {
            const { geometry, properties, id: featureId } = feature;
            if (!geometry) continue;

            // Roads
            if (geometry.type === 'LineString') {
                const coords = geometry.coordinates as [number, number][]; // [lon, lat]
                const nodeIds: string[] = [];

                for (const [lon, lat] of coords) {
                    const id = getCoordId(lat, lon);
                    nodeIds.push(id);
                    if (!allNodesMap.has(id)) {
                        allNodesMap.set(id, { id, lat, lon, isSignal: false });
                    }
                }

                roads.push({
                    id: featureId?.toString() || `road-${roads.length}`,
                    name: properties?.name || 'Unknown',
                    coordinates: coords.map(([lon, lat]) => [lat, lon] as [number, number]),
                    nodeIds
                });
            }
        }

        // Points
        for (const feature of rawData.features) {
            if (feature.geometry?.type === 'Point') {
                const [lon, lat] = feature.geometry.coordinates;
                const id = getCoordId(lat, lon);
                const node = allNodesMap.get(id);
                if (node) node.isSignal = true;
            }
        }
    } 

    else if (rawData.elements) {
        const osmNodes = new Map<number, MapNode>();

        for (const el of rawData.elements) {
            if (el.type === 'node') {
                const id = el.id.toString();
                const node = {
                    id,
                    lat: el.lat,
                    lon: el.lon,
                    isSignal: el.tags?.highway === 'traffic_signals'
                };
                allNodesMap.set(id, node);
                osmNodes.set(el.id, node);
            }
        }

        for (const el of rawData.elements) {
            if (el.type === 'way' && el.nodes) {
                const nodeIds: string[] = [];
                const coords: [number, number][] = [];

                for (const osmId of el.nodes) {
                    const node = osmNodes.get(osmId);
                    if (node) {
                        nodeIds.push(node.id);
                        coords.push([node.lat, node.lon]);
                    }
                }

                roads.push({
                    id: el.id.toString(),
                    name: el.tags?.name || 'Unknown',
                    coordinates: coords,
                    nodeIds
                });
            }
        }
    }

    const nodes = Array.from(allNodesMap.values());
    const signals = nodes.filter(n => n.isSignal);

    return { nodes, roads, signals };
}

function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dlat = (lat2 - lat1) * 111000
  const dlon = (lon2 - lon1) * 111000 * Math.cos(lat1 * Math.PI / 180)
  return Math.sqrt(dlat * dlat + dlon * dlon)
}

export function buildAdjacencyList(network: RoadNetwork): Map<string, { signalId: string, roadId: string }[]> {
  const adjacency = new Map<string, { signalId: string, roadId: string }[]>()

  for (const road of network.roads) {
    const signalsOnRoad: string[] = []

    for (const [lat, lon] of road.coordinates) {
      for (const signal of network.signals) {
        const dist = distanceMetres(lat, lon, signal.lat, signal.lon)
        if (dist < 40 && !signalsOnRoad.includes(signal.id)) {
          signalsOnRoad.push(signal.id)
        }
      }
    }

    for (let i = 0; i < signalsOnRoad.length - 1; i++) {
      const from = signalsOnRoad[i]
      const to = signalsOnRoad[i + 1]

      const fromList = adjacency.get(from) || []
      if (!fromList.some(n => n.signalId === to)) {
        fromList.push({ signalId: to, roadId: road.id })
        adjacency.set(from, fromList)
      }

      const toList = adjacency.get(to) || []
      if (!toList.some(n => n.signalId === from)) {
        toList.push({ signalId: from, roadId: road.id })
        adjacency.set(to, toList)
      }
    }
  }

  return adjacency
}