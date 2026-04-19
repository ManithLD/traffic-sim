import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import RoadNetworkLayer, { RoadNetwork } from './components/RoadNetwork'
import VehicleLayer from './components/VehicleLayer'

interface VehicleData {
  id: string
  lat: number
  lon: number
  state: string
}

interface SignalData {
  node_id: string
  phase: string
}

interface SimSnapshot {
  tick: number
  vehicles: VehicleData[]
  signals: SignalData[],
  waiting_count: number
}

function App() {
  const [network, setNetwork] = useState<RoadNetwork | null>(null)
  const [snapshot, setSnapshot] = useState<SimSnapshot | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetch('http://localhost:8000/network')
      .then(res => res.json())
      .then(setNetwork)
      .catch(err => console.error('Failed to load network', err))
  }, [])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws')
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as SimSnapshot
      setSnapshot(data)
    }

    ws.onerror = (e) => console.error('WebSocket error', e)
    ws.onclose = () => console.log('WebSocket closed')

    return () => ws.close()
  }, [])

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
        {network && (
          <RoadNetworkLayer
            network={network}
            signals={snapshot?.signals ?? []}
          />
        )}
        <VehicleLayer vehicles={snapshot?.vehicles ?? []} />
      </MapContainer>

      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 1000,
        background: 'white', padding: '10px 16px', borderRadius: 8,
        fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div>Tick: {snapshot?.tick ?? 0}</div>
        <div>Vehicles: {snapshot?.vehicles.length ?? 0}</div>
        <div style={{ color: '#9333ea', fontWeight: 'bold' }}>
          Waiting: {snapshot?.waiting_count ?? 0}
        </div>
      </div>
    </div>
  )
}

export default App