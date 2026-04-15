import { useMemo, useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { buildAdjacencyList, loadRoadNetwork } from './simulation/mapLoader'
import RoadNetworkLayer from './components/RoadNetwork'
import { dijkstra, PathResult } from './simulation/pathFinding'
import VehicleLayer from './components/VehicleLayer'

function App() {
  const network = useMemo(() => loadRoadNetwork(), []);
  const [path, setPath] = useState<PathResult | null>(null);
  const adjacency = useMemo(() => buildAdjacencyList(network), [network]);
  const [approachingSignalId, setApproachingSignalId] = useState<string | null>(null);
  const [signalStates, setSignalStates] = useState<Record<string, string>>({});

  const startNewPath = useCallback(() => {
    const connected = network.signals.filter(s => 
        (adjacency.get(s.id)?.length ?? 0) >= 2
    )
    if (connected.length < 2) return

    const startNode = connected[Math.floor(Math.random() * connected.length)]
    const endNode = connected[Math.floor(Math.random() * connected.length)]
    if (startNode.id === endNode.id) return

    const result = dijkstra(adjacency, startNode.id, endNode.id)
    if (result) setPath(result)
  }, [network, adjacency]);

  useEffect(() => {
    startNewPath();
  }, [startNewPath])

  const updateSignalState = useCallback((id: string, color: string) => {
    setSignalStates(prev => ({ ...prev, [id]: color }));
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MapContainer
        center={[43.6490, -79.3830]}
        zoom={15}
        minZoom={15}
        maxZoom={18}
        maxBoundsViscosity={1.0}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='© OpenStreetMap contributors © CARTO'
        />
        <VehicleLayer network={network} path={path} startNewPath={startNewPath} onApproachSignal={setApproachingSignalId} signalStates={signalStates} />
        <RoadNetworkLayer network={network} path={path} approachingSignalId={approachingSignalId} setSignalStates={updateSignalState} />
      </MapContainer>
    </div>
  )
}

export default App