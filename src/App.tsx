import React, { useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { buildAdjacencyList, loadRoadNetwork } from './simulation/mapLoader'
import RoadNetworkLayer from './components/RoadNetwork'
import { dijkstra } from './simulation/pathFinding'

function App() {
  const network = useMemo(() => loadRoadNetwork(), [])
  const adjacency = useMemo(() => buildAdjacencyList(network), [network])

  // check our two test signals
  console.log('start neighbours:', adjacency.get('node/24959516'))
  console.log('end neighbours:', adjacency.get('node/29605052'))
  console.log('connected signals:',
    network.signals.filter(s => adjacency.get(s.id) !== undefined).map(s => s.id)
  )
  const path = useMemo(() => {
    // try different start signals until we find a connected pair
    const connected = network.signals.filter(s => adjacency.get(s.id) !== undefined)
    
    for (const start of connected) {
      const result = dijkstra(adjacency, start.id, 'node/29605052')
      if (result) {
        console.log('found path from:', start.id, 'steps:', result.signalIds.length)
        return result
      }
    }
    console.log('no path found')
    return null
  }, [adjacency, network])
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