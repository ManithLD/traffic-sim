import torontoData from '../data/export.json'

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

export function buildAdjacencyList(network: RoadNetwork) {
    const adjacency = new Map<
        string,
        { nodeId: string; roadId: string; cost: number }[]
    >()

    const nodeMap = new Map(network.nodes.map(n => [n.id, n]))

    for (const road of network.roads) {
        for (let i = 0; i < road.nodeIds.length - 1; i++) {
            const fromId = road.nodeIds[i]
            const toId = road.nodeIds[i + 1]

            const fromNode = nodeMap.get(fromId)
            const toNode = nodeMap.get(toId)
            if (!fromNode || !toNode) continue

            const cost = distanceMetres(
                fromNode.lat,
                fromNode.lon,
                toNode.lat,
                toNode.lon
            )

            // forward
            if (!adjacency.has(fromId)) adjacency.set(fromId, [])
                adjacency.get(fromId)!.push({
                    nodeId: toId,
                    roadId: road.id,
                    cost
            })

            // backward
            if (!adjacency.has(toId)) adjacency.set(toId, [])
                adjacency.get(toId)!.push({
                    nodeId: fromId,
                    roadId: road.id,
                    cost
            })
        }
    }

    return adjacency
}