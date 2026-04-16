# Fragment Runtime Conclusion (for Boss)

## Executive conclusion

- Your architecture drawing is correct in direction: `Source file -> Converter -> .frag -> Fragment Runtime -> in-memory 3D objects -> canvas display`.
- `.frag` loading and `.frag` generation are two different stages.
- In-memory 3D objects are runtime objects (not files), such as `THREE.Object3D / Mesh / BufferGeometry / Material`.
- For `@thatopen/fragments` runtime, the practical display contract is: fragment buffer + modelId + runtime(worker) + camera binding + scene mounting + update loop.

## Clarification on the "5 conditions"

Use this wording in report to avoid ambiguity:

- **Loader minimum (API level):** `buffer + modelId` are required, `camera` is optional in signature.
- **Stable visualization minimum (runtime level):** `buffer + modelId + worker + camera + scene + update loop`.

Why this wording is safer:

- API docs show `camera` optional in `load(...)`.
- But for interactive BIM behavior (LOD/culling and visible output), you still need camera binding, scene mounting, and updates.

## Direct answers for management

- Can IFC become `.frag`? Yes, through converter/importer stage.
- Can `.frag` be rendered directly? Yes, through fragment runtime stage.
- Is rendered output another file? No, it becomes runtime scene objects and then pixels on canvas.
- Is Three.js mandatory? The official `@thatopen/fragments` runtime is Three-based. The format itself is open (FlatBuffers), so non-Three rendering is possible only with custom runtime/adapter work.

## Scope statement for current repo

- `/fragment-core-test` demonstrates pure `@thatopen/fragments` runtime path (no `@thatopen/components` in that route stack).
- `/ifc-converter` demonstrates IFC input conversion/export workflow.

## Recommended one-line summary

"`@thatopen/fragments` solves efficient runtime loading/rendering of `.frag`; IFC/XMI to `.frag` is a separate conversion responsibility."
