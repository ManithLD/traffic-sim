import { useMemo, useState, useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { buildAdjacencyList, loadRoadNetwork } from './simulation/mapLoader'
import RoadNetworkLayer from './components/RoadNetwork'
import { dijkstra, PathResult } from './simulation/pathFinding'

function App() {
  const network = useMemo(() => loadRoadNetwork(), [])
  const [path, setPath] = useState<PathResult | null>(null);
  const adjacency = useMemo(() => buildAdjacencyList(network), [network])

  useEffect(() => {
    const interval = setInterval(() => {
      // only pick well-connected signals
      const connected = network.signals.filter(s => 
        (adjacency.get(s.id)?.length ?? 0) >= 2
      )
      if (connected.length < 2) return

      const startNode = connected[Math.floor(Math.random() * connected.length)]
      const endNode = connected[Math.floor(Math.random() * connected.length)]
      if (startNode.id === endNode.id) return

      const result = dijkstra(adjacency, startNode.id, endNode.id)
      if (result) setPath(result)
    }, 5000)
  return () => clearInterval(interval)
}, [network, adjacency])

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
        <RoadNetworkLayer network={network} path={path} />
      </MapContainer>
    </div>
  )
}

export default App