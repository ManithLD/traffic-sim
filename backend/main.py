import os
import json
import asyncio
from pathfinding import build_adjacency
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from map_loader import load_road_network
from simulation import Simulation
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'export.json')
network = load_road_network(DATA_PATH)
sim: Simulation | None = None

class SimConfig(BaseModel):
    spawn_rate: int = 10
    max_vehicles: int = 150
    speed_multiplier: float = 1.0
    signal_mode: str = 'fixed'

"""
TODO:
- Interface to let user choose simulation parameters like spawn rate, # of cars, etc
- Allow user to upload custom map data from OpenStreetMap
- Hover over signals to see their details
- Interactive map with ability to add signals, remove signals, block off roads/sections of roads, etc
- More options for path finding? A*? Avoid traffic?
"""

@app.get("/health")
def health():
    adjacency = build_adjacency(network)
    connected = [s for s in network.signals if len(adjacency.get(s.id, [])) >= 2]
    return {"status": "ok", "signals": len(network.signals), "connected_signals": len(connected)}

@app.post("/start")
def start_sim(config: SimConfig):
    global sim
    sim = Simulation(network, spawn_rate=config.spawn_rate, max_vehicles=config.max_vehicles, speed_multiplier=config.speed_multiplier, signal_mode=config.signal_mode)
    return {"status": "started"}

@app.get("/network")
def get_network():
    return {
        "nodes": [
            {
                "id": n.id,
                "lat": n.lat,
                "lon": n.lon,
                "isSignal": n.is_signal
            }
            for n in network.nodes.values()
        ],
        "roads": [
            {
                "id": r.id,
                "name": r.name,
                "coordinates": r.coordinates,
                "nodeIds": r.node_ids,
                "oneWay": r.one_way,
                "maxSpeed": r.max_speed
            }
            for r in network.roads
        ],
        "signals": [
            {
                "id": s.id,
                "lat": s.lat,
                "lon": s.lon,
                "isSignal": s.is_signal
            }
            for s in network.signals
        ]
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            if sim is None:
                await asyncio.sleep(0.1)
                continue
            sim.tick()
            snapshot = sim.get_snapshot()
            await websocket.send_text(json.dumps(snapshot))
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        print("Client disconnected")