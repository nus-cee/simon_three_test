# Simon Three Test

Investigation and fix for the **IFC coordinate offset problem** when loading Revit IFC files into Three.js via `@thatopen/components` v3.

## The Problem

When loading IFC files exported from **Revit 2026 with Shared Coordinates** into Three.js via `@thatopen/components` v3, the model's origin was offset from where it should be.

The Revit origin (at the wall junction) appeared shifted by **105.5mm** (half a floor thickness) in the Z direction. The Three.js origin `(0,0,0)` no longer matched the Revit project origin.

## Root Cause

The root cause is `web-ifc`'s `COORDINATE_TO_ORIGIN` setting, which **defaults to `true`**.

This setting shifts all geometry so the bounding box minimum corner sits at `(0,0,0)`. For this model, the IFC origin was at the wall centerline junction, but the bounding box extended 105.5mm past it — so `COORDINATE_TO_ORIGIN` shifted everything by that amount, moving the true origin away from `(0,0,0)`.

## The Fix

Disable `COORDINATE_TO_ORIGIN` after setting up the IFC loader:

```ts
const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup({ ... });

ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = false;
```

This preserves the original IFC coordinate system, so the Revit origin maps directly to Three.js `(0,0,0)`.

## Tech Stack

- [Next.js 16](https://nextjs.org/)
- [Three.js](https://threejs.org/)
- [@thatopen/components v3](https://github.com/ThatOpen/engine_components)
- [@thatopen/fragments v3](https://github.com/ThatOpen/engine_fragment)
- [web-ifc v0.0.74](https://github.com/ThatOpen/engine_web-ifc)

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/ifc-converter](http://localhost:3000/ifc-converter) to test with your own IFC files.
