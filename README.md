# German States & Capitals Study Map

Minimal web MVP for studying Germany's 16 states and capitals.

## Features
- Map of Germany split into state regions with visible borders.
- Capital city dots for each state.
- Independent toggles for state labels and capital labels.
- Four study presets:
  - Study mode (show all)
  - Show states, hide capitals
  - Show capitals, hide states
  - Hard mode (hide both)
- Timed, scored quiz mode with both prompt types:
  - Identify a capital from a state name.
  - Identify a state from a capital name.

## Do you need to provide an image?
No. This MVP uses an embedded SVG map directly in `app.js`, so no external image asset is required.

## Run locally
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.
