import math
from dataclasses import dataclass
from map_loader import RoadNetwork, MapNode

@dataclass
class PathResult:
    node_ids: list[str]
    road_ids: list[str]

def distance_metres(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    dlat = (lat2 - lat1) * 111000
    dlon = (lon2 - lon1) * 111000 * math.cos(math.radians(lat1))
    return math.sqrt(dlat * dlat + dlon * dlon)

def build_adjacency(network: RoadNetwork) -> dict[str, list[dict]]:
    adjacency: dict[str, list[dict]] = {}

    for road in network.roads:
        for i in range(len(road.node_ids) - 1):
            from_id = road.node_ids[i]
            to_id = road.node_ids[i + 1]

            from_node = network.nodes.get(from_id)
            to_node = network.nodes.get(to_id)
            if not from_node or not to_node:
                continue

            cost = distance_metres(
                from_node.lat, from_node.lon,
                to_node.lat, to_node.lon
            )

            if from_id not in adjacency:
                adjacency[from_id] = []
            adjacency[from_id].append({
                'node_id': to_id,
                'road_id': road.id,
                'cost': cost,
                'max_speed': road.max_speed
            })

            if not road.one_way:
                if to_id not in adjacency:
                    adjacency[to_id] = []
                adjacency[to_id].append({
                    'node_id': from_id,
                    'road_id': road.id,
                    'cost': cost,
                    'max_speed': road.max_speed
                })

    return adjacency

def dijkstra(
    adjacency: dict[str, list[dict]],
    start_id: str,
    end_id: str
) -> PathResult | None:
    dist = {node_id: float('inf') for node_id in adjacency}
    dist[start_id] = 0
    prev: dict[str, dict | None] = {start_id: None}
    unvisited = set(adjacency.keys())

    while unvisited:
        current = min(
            (n for n in unvisited if n in dist),
            key=lambda n: dist[n],
            default=None
        )

        if current is None or dist[current] == float('inf'):
            break
        if current == end_id:
            break

        unvisited.remove(current)

        for neighbour in adjacency.get(current, []):
            nid = neighbour['node_id']
            if nid not in unvisited:
                continue
            new_dist = dist[current] + neighbour['cost']
            if new_dist < dist.get(nid, float('inf')):
                dist[nid] = new_dist
                prev[nid] = {'node_id': current, 'road_id': neighbour['road_id']}

    if end_id not in prev:
        return None

    node_ids = []
    road_ids = []
    current = end_id

    while current is not None:
        node_ids.insert(0, current)
        p = prev.get(current)
        if p:
            road_ids.insert(0, p['road_id'])
            current = p['node_id']
        else:
            current = None

    return PathResult(node_ids=node_ids, road_ids=road_ids)