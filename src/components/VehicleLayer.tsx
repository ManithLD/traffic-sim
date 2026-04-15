import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RoadNetwork } from "../simulation/mapLoader"
import { PathResult } from "../simulation/pathFinding"
import { CircleMarker, useMap } from "react-leaflet"

interface Props {
    network: RoadNetwork,
    path: PathResult | null,
    startNewPath: () => void,
    onApproachSignal: (signalId: string | null) => void,
    signalStates: Record<string, string>
}

interface Vehicle {
    id: string,
    lat: number,
    lon: number
}

// TODO: add momentum
export default function VehicleLayer({ network, path, startNewPath, onApproachSignal, signalStates }: Props) {
    const STOP_DISTANCE = 100
    const map = useMap()
    const animationRef = useRef<number | null>(null)
    const vehicleRef = useRef<Vehicle | null>(null)
    const segmentIndexRef = useRef(0)
    const startTimeRef = useRef<number | null>(null)
    const [, forceRender] = useState(0)
    const lastRenderRef = useRef(0)
    const waitingAtLightRef = useRef(false)
    const pausedTRef = useRef(0.98)
    const signalStatesRef = useRef(signalStates)

    useEffect(() => {
        signalStatesRef.current = signalStates
    }, [signalStates])

    const pathCoords = useMemo(() => {
        if (!path) return []
        return path.signalIds
            .map(id => network.nodes.find(n => n.id === id))
            .filter((n): n is NonNullable<typeof n> => n != null)
            .map(n => [n.lat, n.lon] as [number, number])
    }, [path, network])

    const roadMap = useMemo(() => {
        const map = new Map<string, number>()
        for (const road of network.roads) {
            map.set(road.id, road.maxSpeed)
        }
        return map
    }, [network])

    const animate = useCallback((timestamp: number): void => {
        if (startTimeRef.current === null) {
            startTimeRef.current = timestamp
        }

        const segmentIndex = segmentIndexRef.current
        const start = pathCoords[segmentIndex]
        const end = pathCoords[segmentIndex + 1]
        if (!start || !end) return

        const targetSignalId = path?.signalIds[segmentIndex + 1]
        const targetSignalColor = signalStatesRef.current[targetSignalId ?? ""]
        const isAtLight = targetSignalColor === "red" || targetSignalColor === "yellow"

        const roadId = path?.roadIds[segmentIndex]
        const maxSpeed = roadMap.get(roadId ?? "") ?? 50
        const speed = maxSpeed

        const distance = map.distance(start, end)
        const duration = (distance / speed) * 1000

        const elapsed = timestamp - startTimeRef.current
        let t = Math.min(elapsed / duration, 1)

        const traveledDistance = t * distance
        const remainingDistance = distance - traveledDistance
        const stopDistance = Math.min(STOP_DISTANCE, distance * 0.5)

        if (isAtLight && remainingDistance <= stopDistance) {
            waitingAtLightRef.current = true
            pausedTRef.current = t

            const lat = start[0] + (end[0] - start[0]) * t
            const lon = start[1] + (end[1] - start[1]) * t
            vehicleRef.current = { id: "car", lat, lon }

            if (timestamp - lastRenderRef.current > 32) {
                lastRenderRef.current = timestamp
                forceRender(v => v + 1)
            }

            animationRef.current = requestAnimationFrame(animate)
            return
        }

        if (waitingAtLightRef.current && !isAtLight) {
            waitingAtLightRef.current = false
            startTimeRef.current = timestamp - pausedTRef.current * duration
        }

        if (t >= 1 && !waitingAtLightRef.current) {
            const overflow = elapsed - duration
            segmentIndexRef.current++
            startTimeRef.current = timestamp - overflow

            if (segmentIndexRef.current >= pathCoords.length - 1) {
                onApproachSignal(null)
                startNewPath()
                return
            }

            const nextSignalId = path?.signalIds[segmentIndexRef.current + 1]
            if (nextSignalId) onApproachSignal(nextSignalId)
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
    }, [pathCoords, roadMap, map, startNewPath, path?.roadIds, path?.signalIds, onApproachSignal])

    useEffect(() => {
        if (pathCoords.length < 2) return

        segmentIndexRef.current = 0
        startTimeRef.current = null
        waitingAtLightRef.current = false

        vehicleRef.current = {
            id: "car",
            lat: pathCoords[0][0],
            lon: pathCoords[0][1]
        }

        const firstTargetSignalId = path?.signalIds[1]
        if (firstTargetSignalId) onApproachSignal(firstTargetSignalId)

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [animate, pathCoords, onApproachSignal, path?.signalIds])

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