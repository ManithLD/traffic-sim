import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RoadNetwork } from "../simulation/mapLoader"
import { PathResult } from "../simulation/pathFinding"
import { CircleMarker, useMap } from "react-leaflet"

interface Props {
    network: RoadNetwork
    path: PathResult | null
    startNewPath: () => void
}

interface Vehicle  {
    id: string
    lat: number
    lon: number
}

export default function VehicleLayer({ network, path, startNewPath }: Props) {
    const map = useMap()
    const animationRef = useRef<number | null>(null)
    const vehicleRef = useRef<Vehicle | null>(null)
    const segmentIndexRef = useRef(0)
    const startTimeRef = useRef<number | null>(null)
    const [, forceRender] = useState(0)
    const lastRenderRef = useRef(0)

    const pathCoords = useMemo(() => {
        if (!path) return [];
        return path.signalIds 
            .map(id => network.nodes.find(n => n.id === id))
            .filter((n): n is NonNullable<typeof n> => n != null)
            .map(n => [n.lat, n.lon] as [number, number]);
    }, [path, network]);

    const roadMap = useMemo(() => {
        const map = new Map<string, number>()
        for (const road of network.roads) {
            map.set(road.id, road.maxSpeed)
        }
        return map
    }, [network])

    const animate = useCallback((timestamp: number): void => {
        if (!startTimeRef.current) startTimeRef.current = timestamp

        const segmentIndex = segmentIndexRef.current
        const start = pathCoords[segmentIndex]
        const end = pathCoords[segmentIndex + 1]
        if (!start || !end) return

        const roadId = path?.roadIds[segmentIndex]
        const maxSpeed = roadMap.get(roadId ?? "") ?? 50
        const speed = maxSpeed

        const distance = map.distance(start, end)
        const duration = (distance / speed) * 1000

        const elapsed = timestamp - startTimeRef.current
        let t = elapsed / duration

        if (t >= 1) {
            const overflow = elapsed - duration
            segmentIndexRef.current++
            startTimeRef.current = timestamp - overflow

            if (segmentIndexRef.current >= pathCoords.length - 1) {
                startNewPath()
                return
            }

            return animate(timestamp)
        }

        const lat = start[0] + (end[0] - start[0]) * t
        const lon = start[1] + (end[1] - start[1]) * t

        vehicleRef.current = { id: "car", lat, lon }

        if (timestamp - lastRenderRef.current > 32) {
            lastRenderRef.current = timestamp
            forceRender(v => v + 1)
        }

        animationRef.current = requestAnimationFrame(animate)
    }, [pathCoords, roadMap, map, startNewPath, path?.roadIds])

    useEffect(() => {
        if (pathCoords.length < 2) return

        segmentIndexRef.current = 0
        startTimeRef.current = null

        vehicleRef.current = {
            id: "car",
            lat: pathCoords[0][0],
            lon: pathCoords[0][1]
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [animate, pathCoords])

    const vehicle = vehicleRef.current
    if (!vehicle) return null

    return (
        <CircleMarker
            center={[vehicle.lat, vehicle.lon]}
            radius={15}
            color="red"
            fillColor="red"
            fillOpacity={1}
        />
    )
}