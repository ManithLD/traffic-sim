import React, { useEffect, useState } from 'react'
import { Polyline, CircleMarker } from 'react-leaflet'
import { RoadNetwork } from '../simulation/mapLoader'
import { PathResult } from '../simulation/pathFinding';
import { OneWayDecorator } from './OneWayLayer';

interface Props {
  network: RoadNetwork,
  path: PathResult | null,
  approachingSignalId: string | null,
  setSignalStates: (id: string, color: string) => void
}

function SmartTrafficLight({ signal, isApproaching, isStart, isEnd, setSignalStates }: any) {
  const [color, setColor] = useState<'red' | 'yellow' | 'green'>(() => {
    const colors: ('red' | 'yellow' | 'green')[] = ['red', 'green'];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  useEffect(() => {
    setSignalStates(signal.id, color);
  }, [color, signal.id, setSignalStates]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isApproaching) {
      if (color === 'red') {
        setColor('yellow');
      } else if (color === 'yellow') {
        timeout = setTimeout(() => setColor('green'), 1000);
      }
    } else {
      const durations = { green: 4000, yellow: 1500, red: 4000 };
      
      timeout = setTimeout(() => {
        setColor(c => {
            if (c === 'green') return 'yellow';
            if (c === 'yellow') return 'red';
            return 'green';
        });
      }, durations[color] + (Math.random() * 500));
    }

    return () => clearTimeout(timeout);
  }, [color, isApproaching]);

  let displayColor: string = color;
  if (isStart) displayColor = "blue";
  if (isEnd) displayColor = "purple";

  return (
      <CircleMarker
          key={`${signal.id}-${displayColor}`} 
          center={[signal.lat, signal.lon]}
          radius={isStart || isEnd ? 10 : 5}
          color={displayColor}
          fillColor={displayColor}
          fillOpacity={1}
      />
  )
}

export default function RoadNetworkLayer({ network, path, approachingSignalId, setSignalStates }: Props) {
  const startId = path?.signalIds[0] ?? null
  const endId = path?.signalIds[path.signalIds.length - 1] ?? null

  return (
    <>
      {network.roads.map((road) => {
        const positions = road.coordinates
        return (
          <React.Fragment key={road.id}>
            <Polyline
              positions={positions}
              color={'#555'}
              weight={2}
              opacity={0.8}
            />

            {road.oneWay && (
              <OneWayDecorator positions={positions} />
            )}
          </React.Fragment>
        )
      })}
      {network.signals.map((signal) => (
        <SmartTrafficLight 
            key={signal.id} 
            signal={signal} 
            isApproaching={approachingSignalId === signal.id}
            isStart={signal.id === startId}
            isEnd={signal.id === endId}
            setSignalStates={setSignalStates}
        />
      ))}
      {path && (() => {
        const pathCoords = path.signalIds 
          .map(id => network.nodes.find(n => n.id === id))
          .filter((n): n is NonNullable<typeof n> => n != null)
          .map(n => [n.lat, n.lon] as [number, number])

        if (pathCoords.length < 2) return null

        return (
          <Polyline
            key="path-line"
            positions={pathCoords}
            color="orange"
            weight={4}
            opacity={1}
          />
        )
      })()}
    </>
  )
}