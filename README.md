# German States & Capitals Study Map

Minimal web MVP for studying Germany's 16 states and capitals.

## Features
- Germany map rendered from real state boundary geometry in `germany-states.geojson`.
- D3 projection fitting (`projection.fitSize`) to scale the GeoJSON to the SVG viewport.
- Capital city dots (projected from lat/lon) for each state.
- Independent toggles for state labels and capital labels.
- Four study presets:
  - Study mode (show all)
  - Show states, hide capitals
  - Show capitals, hide states
  - Hard mode (hide both)
- Timed, scored quiz mode with both prompt types:
  - Identify a capital from a state name.
  - Identify a state from a capital name.

## Data requirement
Place a valid `germany-states.geojson` file in the project root. The app expects a GeoJSON `FeatureCollection` with 16 state features and a state-name field such as `name`, `NAME_1`, `state`, `land`, or `GEN`.

## Run locally
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.
