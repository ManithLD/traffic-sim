import { CircleMarker } from 'react-leaflet'

interface VehicleData {
  id: string
  lat: number
  lon: number
  state: string
}

interface Props {
  vehicles: VehicleData[]
}

export default function VehicleLayer({ vehicles }: Props) {
  return (
    <>
      {vehicles.map(v => (
        <CircleMarker
          key={`${v.id}-${v.state}`}
          center={[v.lat, v.lon]}
          radius={4}
          color={v.state === 'waiting' ? '#9333ea' : '#3b82f6'}
          fillColor={v.state === 'waiting' ? '#9333ea' : '#3b82f6'}
          fillOpacity={1}
        />
      ))}
    </>
  )
}