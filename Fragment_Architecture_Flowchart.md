# Fragment Architecture Flowchart

This is the polished version of your hand-drawn architecture.

```mermaid
flowchart LR
  A[Source File\nIFC / XMI / other] --> B[Converter / Importer\nmap source semantics to Fragments schema]
  B --> C[.frag Binary\nFlatBuffers-based data]
  C --> D[Fragment Runtime / Loader\n@thatopen/fragments]
  D --> E[In-memory 3D Objects\nObject3D / Mesh / Geometry / Material]
  E --> F[Render Target\nCanvas pixels in frontend]

  C -. data layers .-> C1[Model]
  C -. data layers .-> C2[Item]
  C -. data layers .-> C3[Geometry]
  C -. data layers .-> C4[Material / Style]
  C -. data layers .-> C5[Instance]
  C -. data layers .-> C6[Property]
  C -. data layers .-> C7[Spatial / Index]

  subgraph R[Runtime display contract]
    R1[Fragment Buffer]
    R2[Model ID]
    R3[Worker URL]
    R4[Camera binding]
    R5[Scene mount]
    R6[Update loop\nupdate / update true]
  end

  R1 --> D
  R2 --> D
  R3 --> D
  R4 --> D
  R5 --> D
  R6 --> D
```

## Talking points

- Conversion stage and rendering stage are separate responsibilities.
- Loader does not create `.frag`; it reads `.frag` and instantiates runtime objects.
- Runtime objects are not files; they are in-memory objects used by renderer.
