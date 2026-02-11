# German States & Capitals Study Map

Minimal web MVP for studying Germany's 16 states and capitals.

## Features
- Germany map rendered from local boundary geometry in `germany-states.geojson`.
- Mercator projection with viewport fitting so the map fills the SVG area.
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

## Data file
The repository includes `germany-states.geojson` as a local GeoJSON `FeatureCollection` with 16 state features.

## Run locally
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.
