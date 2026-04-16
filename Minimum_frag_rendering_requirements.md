# Minimum .frag Rendering Requirements

This is the minimum contract needed to render a `.frag` model with `@thatopen/fragments`.

## Required

- Valid `.frag` binary buffer (`ArrayBuffer` or `Uint8Array`)
- `workerUrl` (fragments worker path, e.g. `/fragments/worker.mjs`)
- `modelId` (unique string per loaded model)
- Three.js camera (`PerspectiveCamera` or `OrthographicCamera`)
- Three.js scene (to add `model.object`)

## Runtime steps (must happen)

1. Initialize fragment runtime with worker URL.
2. Load `.frag` using `modelId` and camera.
3. Bind camera to model (`useCamera(...)`) for LOD/culling.
4. Add model object into scene.
5. Call `update()` during camera movement.
6. Call `update(true)` when camera rests.
7. Dispose model/runtime on cleanup.

## For custom exporter pipelines (XMI -> .frag)

If your exporter can output a valid `.frag` binary that the runtime accepts, it can be rendered.

The renderer does **not** need to know IFC/XMI details. It only needs:

- valid fragment binary
- worker
- model id
- camera + update loop

## Optional but recommended

- `source` label (file/url) for diagnostics
- load/error status logging
- update counters for debugging performance
- local `.frag` upload path for quick validation
