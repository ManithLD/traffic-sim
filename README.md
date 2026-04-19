# UrbanFlow Simulation Engine

---

Hello there! This project was based on a shower thought and my curiosity to simulate real time traffic and adding a traffic light optimization twist. The goal of this project is not only to improve my own skills in full stack simulation development but also to demonstrate or find a way to optimize a centralized traffic system. This will hopefully lead me to create some F1 simulations in the future :)

---

## What is this?

Traffic simulation engine built on real road data from downtown Toronto (for now... will add the ability to import custom maps later).
It models how vehicles move through a road network, where users can:

- add or remove traffic signals
- block roads with construction zones
- observe vehicle flow in real time
- run a basic signal timing system that adjusts lights based on traffic conditions

The goal is to simulate how small changes in road control affect congestion and waiting times.

---

## Status

In progress

Core simulation, routing, and visualization are working.
Signal optimization and user controls are still being expanded.

---

## Tech Stack

- React + TypeScript (frontend + map visualization)
- FastAPI (simulation backend + WebSockets)
- Python (routing + simulation engine)
- OpenStreetMap (road network data)
- Leaflet (map rendering)

---

## Setup

### Clone repository

```bash
git clone https://github.com/ManithLD/traffic-sim.git
cd traffic-sim
```

### Backend (FastAPI)

```bash
# Navigate to backend
cd backend

# Create / reset virtual environment (Windows PowerShell)
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install fastapi uvicorn

# Run backend
uvicorn main:app --reload --port 8000
```

**Test backend**
http://localhost:8000/health
http://localhost:8000/network

Expected:

```json
{"status":"ok"}
```

---

### Frontend (React)

```bash
# Navigate to frontend
cd traffic-sim

# Install dependencies
npm install

# Start frontend
npm start
```

**Open app**
http://localhost:3000

---

## Architecture

- Backend runs simulation tick loop
- Vehicles move through graph-based road network
- Dijkstra used for routing, will add A* and other routing options later
- Traffic signals update independently via timers
- WebSocket streams state to frontend (~10Hz)
- Frontend renders everything with Leaflet
- Backend is the single source of truth

---

## Notes

- Start backend before frontend (obviously...)
- If `/network` fails, restart backend with `--reload`
