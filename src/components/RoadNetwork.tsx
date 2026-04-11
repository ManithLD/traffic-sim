import React, { useEffect, useState } from 'react'
import { Polyline, CircleMarker } from 'react-leaflet'
import { RoadNetwork } from '../simulation/mapLoader'

const SIGNAL_COLORS = ['red', 'yellow', 'green'];

interface Props {
  network: RoadNetwork
}

export default function RoadNetworkLayer({ network }: Props) {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
      const timer = setInterval(() => {
        setColorIndex((prevIndex) => (prevIndex + 1) % SIGNAL_COLORS.length);
      }, 3000);

      return () => clearInterval(timer);
  }, []);

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
          key={`${signal.id}-${colorIndex}`}
          center={[signal.lat, signal.lon]}
          radius={5}
          color={SIGNAL_COLORS[colorIndex]}
          fillColor={SIGNAL_COLORS[colorIndex]}
          fillOpacity={1}
        />
      ))}
    </>
  )
}