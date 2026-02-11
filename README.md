diff --git a/README.md b/README.md
index 0fb61a19abf2adfa148907eb4ab6a101fdabbbe8..28b87f14013f5bd8f4e00f82e2919833c0f50184 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,21 @@
-# funding-rate-alerts
-Tracks perp dex funding rates
+# German States & Capitals Study Map
+
+Interactive web MVP for learning Germany's states and capitals.
+
+## Features
+- Schematic Germany state map with borders.
+- Capital city dots for each state.
+- Independent toggles for state labels and capital labels.
+- One-click study presets:
+  - Study mode (show all)
+  - Show states, hide capitals
+  - Show capitals, hide states
+  - Hard mode (hide both)
+- Timed quiz mode with score tracking.
+
+## Run locally
+```bash
+cd web
+python3 -m http.server 8000
+```
+Then open `http://localhost:8000`.
