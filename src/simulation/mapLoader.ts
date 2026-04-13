import torontoData from '../data/toronto.json'

function getImportedData(): unknown {
    let data = (torontoData as any)?.default ?? torontoData

    while (data && typeof data === 'object' && 'default' in data) {
        data = (data as any).default
    }

    if (typeof data === 'string') {
        try {
            data = JSON.parse(data)
        } catch {
            throw new Error('Failed to parse the imported map data as JSON.')
        }
    }

    return data
}

const rawData = getImportedData()

interface GeoJSONGeometry {
    type: 'Point' | 'LineString' | string
    coordinates?: unknown
}

interface GeoJSONFeature {
    type: 'Feature'
    id?: string | number
    properties?: Record<string, any>
    geometry?: GeoJSONGeometry
}

interface TorontoGeoJSON {
    type: 'FeatureCollection'
    features: GeoJSONFeature[]
}

interface OSMNodeElement {
    type: 'node'
    id: number
    lat: number
    lon: number
    tags?: Record<string, string>
}

interface OSMWayElement {
    type: 'way'
    id: number
    nodes: number[]
    tags?: Record<string, string>
}

interface TorontoOSMData {
    elements: (OSMNodeElement | OSMWayElement)[]
}

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
}

export interface RoadNetwork {
    nodes: MapNode[]
    roads: Road[]
    signals: MapNode[]
}

function isGeoJSON(data: unknown): data is TorontoGeoJSON {
    return (
        !!data &&
        typeof data === 'object' &&
        Array.isArray((data as any).features)
    )
}


function isOSMData(data: unknown): data is TorontoOSMData {
    return (
        !!data &&
        typeof data === 'object' &&
        Array.isArray((data as any).elements)
    )
}

function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dlat = (lat2 - lat1) * 111000
    const dlon = (lon2 - lon1) * 111000 * Math.cos(lat1 * Math.PI / 180)
    return Math.sqrt(dlat * dlat + dlon * dlon)
}

export function loadRoadNetwork(): RoadNetwork {
    const nodes: MapNode[] = []
    const roads: Road[] = []

    if (isGeoJSON(rawData)) {
        const features = rawData.features

        for (const feature of features) {
        const geom = feature.geometry
        const props = feature.properties

        if (!geom || !geom.type) continue

        // Intersections or Signals
        if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
            const [lon, lat] = geom.coordinates as [number, number]
            nodes.push({
                id: feature.id != null ? String(feature.id) : `point-${lat}-${lon}`,
                lat,
                lon,
                isSignal:
                    props?.highway === 'traffic_signals' ||
                    props?.traffic_signals === 'signal'
            })
        } 

        // Roads
        else if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
            const coords = (geom.coordinates as [number, number][]).map(
                ([lon, lat]) => [lat, lon] as [number, number]
            )
            roads.push({
                id: feature.id != null ? String(feature.id) : `road-${roads.length}`,
                name: props?.name || 'Unknown',
                coordinates: coords
            })
        }
        }
    } 
    
    else if (isOSMData(rawData)) {
        const osmNodes = new Map<number, MapNode>()

        // Signals
        for (const element of rawData.elements) {
            if (element.type === 'node') {
                const node: MapNode = {
                    id: element.id.toString(),
                    lat: element.lat,
                    lon: element.lon,
                    isSignal: element.tags?.highway === 'traffic_signals'
                }
                nodes.push(node)
                osmNodes.set(element.id, node)
            }
        }

        // Roads but for OSM data
        for (const element of rawData.elements) {
        if (element.type === 'way' && Array.isArray(element.nodes)) {
            const coords: [number, number][] = element.nodes
                .map((nodeId) => osmNodes.get(nodeId))
                .filter((node): node is MapNode => !!node)
                .map((node) => [node.lat, node.lon])
            roads.push({
                id: element.id.toString(),
                name: element.tags?.name || 'Unknown',
                coordinates: coords
            })
        }
        }
    } 
    
    else {
        throw new Error('Unsupported map data format: Expected GeoJSON or OSM elements.')
    }

    const signals = nodes.filter((n) => n.isSignal)

    return { nodes, roads, signals }
}

export function buildAdjacencyList(network: RoadNetwork): Map<string, { signalId: string, roadId: string }[]> {
    const adjacencyList = new Map<string, { signalId: string, roadId: string }[]>()

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
            adjacencyList.set(signalsOnRoad[i], [...(adjacencyList.get(signalsOnRoad[i]) || []), { signalId: signalsOnRoad[i + 1], roadId: road.id }])
            adjacencyList.set(signalsOnRoad[i + 1], [...(adjacencyList.get(signalsOnRoad[i + 1]) || []), { signalId: signalsOnRoad[i], roadId: road.id }])
        }
    }

    return adjacencyList
}