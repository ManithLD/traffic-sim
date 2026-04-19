# UrbanFlow Simulation Engine

## What is this?
A traffic simulation engine built on real map data from downtown Toronto.
The simulator lets you interactively manage the road network block roads 
with construction zones, add or remove traffic signals, and configure 
intersections. Once the network is set up, vehicles are generated and flow 
through the city. A signal optimization engine then takes over, adjusting 
traffic light timings in real time to minimize how long cars spend waiting.

## Status
In progress

## Tech Stack
- React + TypeScript (simulation + interactive map)
- Go (optimization engine)
- Python (map data pipeline)
- OpenStreetMap via Overpass API (road network data)
