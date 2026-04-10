import React from 'react'
import { Polyline, CircleMarker } from 'react-leaflet'
import { RoadNetwork } from '../simulation/mapLoader'

interface Props {
  network: RoadNetwork
}

export default function RoadNetworkLayer({ network }: Props) {
  return (
    <>
      {network.roads.map((road) => (
        <Polyline
          key={road.id}
          positions={road.coordinates}
          color="#555"
          weight={2}
          opacity={0.8}
        />
      ))}
      {network.signals.map((signal) => (
        <CircleMarker
          key={signal.id}
          center={[signal.lat, signal.lon]}
          radius={5}
          color="red"
          fillColor="red"
          fillOpacity={1}
        />
      ))}
    </>
  )
}