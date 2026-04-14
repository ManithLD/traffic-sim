import { useEffect, useMemo, useRef, useState } from "react"
import { RoadNetwork } from "../simulation/mapLoader"
import { PathResult } from "../simulation/pathFinding"
import { CircleMarker } from "react-leaflet"

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
    const [vehicle, setVehicle] = useState<Vehicle | null>(null)
    const indexRef = useRef(0)

    const pathCoords = useMemo(() => {
        if (!path) return [];
        return path.signalIds 
            .map(id => network.nodes.find(n => n.id === id))
            .filter((n): n is NonNullable<typeof n> => n != null)
            .map(n => [n.lat, n.lon] as [number, number]);
    }, [path, network]);

    useEffect(() => {
        if (pathCoords.length < 2) {
            setVehicle(null);
            return;
        }

        indexRef.current = 0
        setVehicle({ id: 'car', lat: pathCoords[0][0], lon: pathCoords[0][1] })

        const timer = setInterval(() => {
            indexRef.current++
            if (indexRef.current >= pathCoords.length) {
                indexRef.current = 0
                startNewPath();
            }
            
            const [lat, lon] = pathCoords[indexRef.current]
            setVehicle({ id: 'car', lat, lon })
        }, 500)

        return () => clearInterval(timer)   
    }, [pathCoords, startNewPath]);

    if (!vehicle) return null;

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