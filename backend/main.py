import os
from fastapi import FastAPI
from map_loader import load_road_network

app = FastAPI()

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'export.json')
network = load_road_network(DATA_PATH)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "nodes": len(network.nodes),
        "roads": len(network.roads),
        "signals": len(network.signals)
    }