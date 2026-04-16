# Fragment Evidence Index

This table maps each architecture claim to concrete evidence in this repository and installed package typings.

## A. Conversion and loading are separate stages

| Claim | Evidence |
|---|---|
| `IfcLoader` converts IFC into Fragments | `node_modules/@thatopen/components/dist/index.d.ts:2403` |
| Conversion API returns a `FragmentsModel` | `node_modules/@thatopen/components/dist/index.d.ts:2505` |
| Fragment runtime loads from binary buffer | `node_modules/@thatopen/fragments/dist/index.d.ts:1849` |

## B. What loader needs at API level

| Claim | Evidence |
|---|---|
| `load` input is `buffer + options` | `node_modules/@thatopen/fragments/dist/index.d.ts:1859` |
| `modelId` is required in options | `node_modules/@thatopen/fragments/dist/index.d.ts:1860` |
| `camera` is optional in signature | `node_modules/@thatopen/fragments/dist/index.d.ts:1861` |
| Runtime constructor takes `workerURL` | `node_modules/@thatopen/fragments/dist/index.d.ts:1839` |

## C. Runtime object is in-memory object, not file

| Claim | Evidence |
|---|---|
| Loaded model exposes `object: THREE.Object3D` | `node_modules/@thatopen/fragments/dist/index.d.ts:1266` |
| Camera binding method exists for model runtime behavior | `node_modules/@thatopen/fragments/dist/index.d.ts:1564` |

## D. Practical display contract in this project

| Claim | Evidence |
|---|---|
| Pure fragments runtime is used in new test route | `src/components/FragmentCoreTest/FragmentCoreScene.tsx:6` |
| Runtime instantiated with worker URL | `src/components/FragmentCoreTest/FragmentCoreScene.tsx:199` |
| Buffer loaded with `modelId` and `camera` | `src/components/FragmentCoreTest/FragmentCoreScene.tsx:86` |
| Model is mounted into scene | `src/components/FragmentCoreTest/FragmentCoreScene.tsx:92` |
| Update loop drives runtime updates | `src/components/FragmentCoreTest/FragmentCoreScene.tsx:207` |
| Forced update on camera rest | `src/components/FragmentCoreTest/FragmentCoreScene.tsx:220` |
| Source `.frag` is fetched as binary buffer | `src/components/FragmentCoreTest/FragmentCoreScene.tsx:116` |

## E. Format-level openness vs runtime choice

| Claim | Evidence |
|---|---|
| Fragments format is FlatBuffers-based | `node_modules/@thatopen/fragments/README.md:39` |
| Official runtime engine is built on Three.js | `node_modules/@thatopen/fragments/README.md:50` |

## Suggested report wording (safe)

- API minimum: `buffer + modelId` (camera optional by signature).
- Visualization minimum in practice: `buffer + modelId + worker + camera + scene + update loop`.
