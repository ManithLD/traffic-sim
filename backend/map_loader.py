import json
import math
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class MapNode:
    id: str
    lat: float
    lon: float
    is_signal: bool

@dataclass
class Road:
    id: str
    name: str
    coordinates: list[tuple[float, float]]
    node_ids: list[str]
    one_way: bool
    max_speed: int

@dataclass
class RoadNetwork:
    nodes: dict[str, MapNode]
    roads: list[Road]
    signals: list[MapNode]

def load_road_network(path: str) -> RoadNetwork:
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    nodes: dict[str, MapNode] = {}
    roads: list[Road] = []

    if 'elements' in data:
        for el in data['elements']:
            if el['type'] == 'node':
                node_id = str(el['id'])
                nodes[node_id] = MapNode(
                    id=node_id,
                    lat=el['lat'],
                    lon=el['lon'],
                    is_signal=el.get('tags', {}).get('highway') == 'traffic_signals'
                )

        for el in data['elements']:
            if el['type'] == 'way' and 'nodes' in el:
                tags = el.get('tags', {})
                node_ids = [str(n) for n in el['nodes'] if str(n) in nodes]
                coords = [(nodes[nid].lat, nodes[nid].lon) for nid in node_ids]

                roads.append(Road(
                    id=str(el['id']),
                    name=tags.get('name', 'Unknown'),
                    coordinates=coords,
                    node_ids=node_ids,
                    one_way=tags.get('oneway') == 'yes',
                    max_speed=int(tags['maxspeed']) if 'maxspeed' in tags else 40
                ))

    signals = [n for n in nodes.values() if n.is_signal]
    return RoadNetwork(nodes=nodes, roads=roads, signals=signals)