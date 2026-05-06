import { CircleMarker } from 'react-leaflet'

export interface VehicleData {
  id: string
  lat: number
  lon: number
  state: string
  priority: boolean
}

interface Props {
  vehicles: VehicleData[]
}

export default function VehicleLayer({ vehicles }: Props) {
  console.log(vehicles[0]?.priority)
  return (
    <>
      {vehicles.map(v => (
        <CircleMarker
          key={`${v.id}-${v.state}`}
          center={[v.lat, v.lon]}
          radius={4}
          color={v.priority ? '#ff00d4' : v.state === 'waiting' ? '#9333ea' : '#3b82f6'}
          fillColor={v.priority ? '#ff00d4' : v.state === 'waiting' ? '#9333ea' : '#3b82f6'}
          fillOpacity={1}
        />
      ))}
    </>
  )
}