import React from 'react'
import { Polyline, CircleMarker } from 'react-leaflet'
import { RoadNetwork } from '../simulation/mapLoader'
import { OneWayDecorator } from './OneWayLayer'

interface SignalData {
  node_id: string
  phase: string
}

interface Props {
  network: RoadNetwork
  signals: SignalData[]
}

const PHASE_COLORS: Record<string, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444'
}

export default function RoadNetworkLayer({ network, signals }: Props) {
  const signalMap = new Map(signals.map(s => [s.node_id, s.phase]))

  return (
    <>
      {network.roads.map(road => (
        <React.Fragment key={road.id}>
          <Polyline
            positions={road.coordinates}
            color="#555"
            weight={2}
            opacity={0.8}
          />
          {road.oneWay && <OneWayDecorator positions={road.coordinates} />}
        </React.Fragment>
      ))}
      {network.signals.map(signal => {
        const phase = signalMap.get(signal.id) ?? 'red'
        const color = PHASE_COLORS[phase]
        return (
          <CircleMarker
            key={`${signal.id}-${phase}`}
            center={[signal.lat, signal.lon]}
            radius={7}
            color={color}
            fillColor={color}
            fillOpacity={1}
          />
        )
      })}
    </>
  )
}