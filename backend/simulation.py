import math
import random
import asyncio
from dataclasses import dataclass, field
from map_loader import RoadNetwork, MapNode
from pathfinding import build_adjacency, dijkstra, PathResult

@dataclass
class SignalState:
    node_id: str
    phase: str
    timer: int

GREEN_TICKS = 50
YELLOW_TICKS = 10
RED_TICKS = 50

def init_signals(signals: list[MapNode]) -> list[SignalState]:
    return [
        SignalState(
            node_id=s.id,
            phase='green',
            timer=GREEN_TICKS - (i * 7) % GREEN_TICKS
        )
        for i, s in enumerate(signals)
    ]

def update_signals(states: list[SignalState]) -> list[SignalState]:
    updated = []
    for s in states:
        new_timer = s.timer - 1
        if new_timer > 0:
            updated.append(SignalState(s.node_id, s.phase, new_timer))
        else:
            if s.phase == 'green':
                updated.append(SignalState(s.node_id, 'yellow', YELLOW_TICKS))
            elif s.phase == 'yellow':
                updated.append(SignalState(s.node_id, 'red', RED_TICKS))
            else:
                updated.append(SignalState(s.node_id, 'green', GREEN_TICKS))
    return updated


@dataclass
class Vehicle:
    id: str
    path: PathResult
    current_section: int
    progress: float
    speed: float
    state: str
    wait_time: int

def distance_metres(lat1, lon1, lat2, lon2):
    dlat = (lat2 - lat1) * 111000
    dlon = (lon2 - lon1) * 111000 * math.cos(math.radians(lat1))
    return math.sqrt(dlat * dlat + dlon * dlon)

def get_vehicle_position(v: Vehicle, network: RoadNetwork) -> tuple[float, float] | None:
    if v.current_section >= len(v.path.node_ids) - 1:
        return None

    from_id = v.path.node_ids[v.current_section]
    to_id = v.path.node_ids[v.current_section + 1]

    from_node = network.nodes.get(from_id)
    to_node = network.nodes.get(to_id)
    if not from_node or not to_node:
        return None

    t = v.progress
    lat = from_node.lat + (to_node.lat - from_node.lat) * t
    lon = from_node.lon + (to_node.lon - from_node.lon) * t
    return (lat, lon)

def is_near_red_signal(
    v: Vehicle,
    network: RoadNetwork,
    signal_map: dict[str, SignalState]
) -> bool:
    if v.current_section + 1 >= len(v.path.node_ids):
        return False
    
    target_node_id = v.path.node_ids[v.current_section + 1]
    
    state = signal_map.get(target_node_id)
    if not state or state.phase == 'green':
        return False

    pos = get_vehicle_position(v, network)
    node = network.nodes.get(target_node_id)
    if pos and node:
        dist = distance_metres(pos[0], pos[1], node.lat, node.lon)
        if dist < 15:
            return True
            
    return False

@dataclass
class SimulationState:
    vehicles: list[Vehicle] = field(default_factory=list)
    signals: list[SignalState] = field(default_factory=list)
    tick: int = 0

class Simulation:
    def __init__(self, network: RoadNetwork, spawn_rate: int = 10, max_vehicles: int = 150, speed_multiplier: float = 1.0):
        self.network = network
        self.adjacency = build_adjacency(network)
        self.spawn_rate = spawn_rate
        self.max_vehicles = max_vehicles
        self.speed_multiplier = speed_multiplier
        self.state = SimulationState(signals=init_signals(network.signals))
        self.connected_signals = [
            s for s in network.signals
            if len(self.adjacency.get(s.id, [])) >= 2
        ]

    def spawn_vehicle(self):
        if len(self.connected_signals) < 2:
            return

        start = random.choice(self.connected_signals)
        end = random.choice(self.connected_signals)
        if start.id == end.id:
            return

        path = dijkstra(self.adjacency, start.id, end.id)
        if not path or len(path.node_ids) < 4:
            return

        from_node = self.network.nodes.get(path.node_ids[0])
        to_node = self.network.nodes.get(path.node_ids[1])
        if not from_node or not to_node:
            return

        section_len = distance_metres(
            from_node.lat, from_node.lon,
            to_node.lat, to_node.lon
        )
        edges = self.adjacency.get(from_node.id, [])
        max_speed = edges[0]['max_speed'] if edges else 50
        speed_ms = ((max_speed + random.uniform(-15, 15)) / 3.6) * self.speed_multiplier
        progress_per_tick = (speed_ms * 0.1) / max(section_len, 1)

        vehicle = Vehicle(
            id=f"v-{self.state.tick}-{random.randint(1000,9999)}",
            path=path,
            current_section=0,
            progress=0.0,
            speed=progress_per_tick,
            state='moving',
            wait_time=0
        )
        self.state.vehicles.append(vehicle)

    def tick(self):
        self.state.signals = update_signals(self.state.signals)
        signal_map = {s.node_id: s for s in self.state.signals}

        if self.state.tick % self.spawn_rate == 0:
            self.spawn_vehicle()

        # tick vehicles
        updated = []
        for v in self.state.vehicles:
            blocked = is_near_red_signal(v, self.network, signal_map)

            if blocked:
                v.state = 'waiting'
                v.wait_time += 1
                updated.append(v)
                continue

            new_progress = v.progress + v.speed
            if new_progress >= 1.0:
                next_section = v.current_section + 1
                if next_section >= len(v.path.node_ids) - 1:
                    continue

                from_node = self.network.nodes.get(v.path.node_ids[next_section])
                to_node = self.network.nodes.get(v.path.node_ids[next_section + 1])
                if from_node and to_node:
                    section_len = distance_metres(
                        from_node.lat, from_node.lon,
                        to_node.lat, to_node.lon
                    )
                    next_from_id = v.path.node_ids[next_section]
                    edges = self.adjacency.get(next_from_id, [])
                    road_id = v.path.road_ids[next_section] if next_section < len(v.path.road_ids) else None
                    edge = next((e for e in edges if e['road_id'] == road_id), edges[0] if edges else None)
                    max_speed = edge['max_speed'] if edge else 50
                    speed_ms = ((max_speed + random.uniform(-15, 15)) / 3.6) * self.speed_multiplier
                    v.speed = (speed_ms * 0.1) / max(section_len, 1)

                v.current_section = next_section
                v.progress = 0.0
                v.state = 'moving'
            else:
                v.progress = new_progress
                v.state = 'moving'

            updated.append(v)

        self.state.vehicles = updated[-self.max_vehicles:]
        self.state.tick += 1

    def get_snapshot(self) -> dict:
        waiting_count = sum(1 for v in self.state.vehicles if v.state == 'waiting')
        vehicle_data = []
        for v in self.state.vehicles:
            pos = get_vehicle_position(v, self.network)
            if pos:
                vehicle_data.append({
                    'id': v.id,
                    'lat': pos[0],
                    'lon': pos[1],
                    'state': v.state
                })

        signal_data = [
            {'node_id': s.node_id, 'phase': s.phase}
            for s in self.state.signals
        ]

        return {
            'tick': self.state.tick,
            'vehicles': vehicle_data,
            'signals': signal_data,
            'waiting_count': waiting_count
        }