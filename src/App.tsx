import React, { useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { loadRoadNetwork } from './simulation/mapLoader'
import RoadNetworkLayer from './components/RoadNetwork'

function App() {
  const network = useMemo(() => loadRoadNetwork(), [])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MapContainer
        center={[43.6490, -79.3830]}
        zoom={16}
        minZoom={16}
        maxZoom={18}
        maxBounds={[
          [43.6465, -79.3875],
          [43.6515, -79.3785]
        ]}
        maxBoundsViscosity={1.0}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='© OpenStreetMap contributors © CARTO'
        />
        <RoadNetworkLayer network={network} />
      </MapContainer>
    </div>
  )
}

export default App