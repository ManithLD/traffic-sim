import { useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet-polylinedecorator'

interface Props {
  positions: [number, number][]
}

export function OneWayDecorator({ positions }: Props) {
  const map = useMap()

  useEffect(() => {
    const decorator = (L as any).polylineDecorator(positions, {
        patterns: [
            {
                offset: 50,
                repeat: 50,
                symbol: (L as any).Symbol.arrowHead({
                pixelSize: 6,
                pathOptions: { color: '#000000', opacity: 0.7 }
                })
            }
        ]
    })

    decorator.addTo(map)

    return () => {
      map.removeLayer(decorator)
    }
  }, [map, positions])

  return null
}