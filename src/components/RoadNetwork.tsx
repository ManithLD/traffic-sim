import React, { useEffect, useState } from 'react'
import { Polyline, CircleMarker } from 'react-leaflet'
import { RoadNetwork } from '../simulation/mapLoader'
import { PathResult } from '../simulation/pathFinding';

const SIGNAL_COLORS = ['red', 'yellow', 'green'];

interface Props {
  network: RoadNetwork
  path: PathResult | null
}

export default function RoadNetworkLayer({ network, path }: Props) {
  const [colorIndex, setColorIndex] = useState(0);
  const START_ID = "node/21436490"
  const END_ID = "node/29605052"

  useEffect(() => {
      const timer = setInterval(() => {
        setColorIndex((prevIndex) => (prevIndex + 1) % SIGNAL_COLORS.length);
      }, 3000);

      return () => clearInterval(timer);
  }, []);

  return (
    <>
      {network.roads.map((road, index) => (
        <Polyline
          key={`path-${road.id}-${index}`}
          positions={road.coordinates}
          color="#555"
          weight={2}
          opacity={0.8}
        />
      ))}
      {network.signals.map((signal) => {
        let signalColor = SIGNAL_COLORS[colorIndex];
        if (signal.id === START_ID) signalColor = 'blue'
        if (signal.id === END_ID) signalColor = 'purple'
        
        return (
          <CircleMarker
          key={`${signal.id}-${colorIndex}`}
          center={[signal.lat, signal.lon]}
          radius={signal.id === START_ID || signal.id === END_ID ? 10 : 5}
          color={signalColor}
          fillColor={signalColor}
          fillOpacity={1}
        />
      )})}
      {path && path.roadIds.map((roadId: string, index: number) => {
        const road = network.roads.find(r => r.id === roadId)
        if (!road) return null
        return (
          <Polyline
            key={`path-${roadId}-${index }`}
            positions={road.coordinates}
            color="orange"
            weight={4}
            opacity={1}
          />
        )
      })}
    </>
  )
}