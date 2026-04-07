"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { WORKER_URL } from "./constants";
import { FilePicker } from "./FilePicker";
import { ModelListItem } from "./ModelListItem";
import { LoadingOverlay, ErrorOverlay } from "./Overlays";

type ModelStatus = "converting" | "loaded" | "error";

export interface ModelEntry {
  id: string;
  fileName: string;
  status: ModelStatus;
  error?: string;
}

export function IFCConverterScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "converting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [models, setModels] = useState<ModelEntry[]>([]);

  const componentsRef = useRef<OBC.Components | null>(null);
  const worldRef = useRef<OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer> | null>(null);
  const fragmentsRef = useRef<OBC.FragmentsManager | null>(null);
  const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);
  const handlesRef = useRef<{ throttledUpdate: () => void; onRest: () => void; getTimer: () => ReturnType<typeof setTimeout> | null } | null>(null);

  const handleFiles = async (files: FileList) => {
    if (!ifcLoaderRef.current || !fragmentsRef.current) return;
    setStatus("converting");

    for (const file of Array.from(files)) {
      const modelId = `${file.name.replace(/\.ifc$/i, "")}-${Date.now()}`;
      
      setModels((prev) => [...prev, { id: modelId, fileName: file.name, status: "converting" }]);

      try {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        await ifcLoaderRef.current.load(data, true, modelId);

        // Visual origin markers for coordinate verification
        const scene = worldRef.current?.scene.three;
        if (scene) {
          scene.add(new THREE.AxesHelper(2));
          const mkSphere = (pos: [number, number, number], color: number) => {
            const mesh = new THREE.Mesh(
              new THREE.SphereGeometry(0.05, 16, 16),
              new THREE.MeshBasicMaterial({ color }),
            );
            mesh.position.set(...pos);
            scene.add(mesh);
          };
          mkSphere([0, 0, 0], 0xffff00);  // Yellow - origin
          mkSphere([0, 0, 1], 0xff0000);   // Red - Z+1
          mkSphere([0, 0, -1], 0x00ff00);  // Green - Z-1
          mkSphere([0, 1, 0], 0x0000ff);   // Blue - Y+1
          mkSphere([1, 0, 0], 0xff00ff);   // Magenta - X+1
        }

        setModels((prev) =>
          prev.map((m) => (m.id === modelId ? { ...m, status: "loaded" } : m))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Conversion failed";
        setModels((prev) =>
          prev.map((m) =>
            m.id === modelId ? { ...m, status: "error", error: message } : m
          )
        );
      }
    }

    setStatus("idle");
  };

  const downloadFrag = async (modelId: string) => {
    const model = fragmentsRef.current?.list.get(modelId);
    if (!model) {
      console.error(`Model ${modelId} not found`);
      return;
    }
    try {
      const buffer = await model.getBuffer(false);
      const fileName = `${modelId}.frag`;
      const file = new File([buffer], fileName);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const removeModel = (modelId: string) => {
    fragmentsRef.current?.core.disposeModel(modelId);
    setModels((prev) => prev.filter((m) => m.id !== modelId));
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;

    async function init() {
      try {
        const components = new OBC.Components();
        componentsRef.current = components;

        const worlds = components.get(OBC.Worlds);
        const world = worlds.create<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>();
        
        world.scene = new OBC.SimpleScene(components);
        world.scene.setup();
        world.scene.three.background = null;

        world.scene.three.traverse((child) => {
          if (child instanceof THREE.AmbientLight) {
            child.intensity = 1.0;
          }
        });

        world.renderer = new OBC.SimpleRenderer(components, container!);
        world.camera = new OBC.OrthoPerspectiveCamera(components);
        worldRef.current = world;

        world.renderer.three.outputColorSpace = THREE.SRGBColorSpace;
        world.renderer.three.toneMapping = THREE.NoToneMapping;

        components.init();
        components.get(OBC.Grids).create(world);

        const fragments = components.get(OBC.FragmentsManager);
        fragments.init(WORKER_URL);
        fragmentsRef.current = fragments;

        let lastUpdate = 0;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const throttledUpdate = () => {
          const now = performance.now();
          if (now - lastUpdate >= 100) {
            lastUpdate = now;
            fragments.core.update();
          } else if (!timer) {
            timer = setTimeout(() => {
              timer = null;
              lastUpdate = performance.now();
              fragments.core.update();
            }, 100 - (now - lastUpdate));
          }
        };

        const onRest = () => fragments.core.update(true);

        world.camera.controls.addEventListener("update", throttledUpdate);
        world.camera.controls.addEventListener("rest", onRest);

        handlesRef.current = { throttledUpdate, onRest, getTimer: () => timer };

        fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(world.camera.three);
          world.scene.three.add(model.object);
          fragments.core.update(true);
        });

        fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
          if (!("isLodMaterial" in material && material.isLodMaterial)) {
            material.polygonOffset = true;
            material.polygonOffsetUnits = 1;
            material.polygonOffsetFactor = Math.random();
          }
        });

        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({
          autoSetWasm: false,
          wasm: { path: "/wasm/", absolute: true },
        });
        // Disable COORDINATE_TO_ORIGIN so geometry preserves IFC coordinates
        // (web-ifc default shifts bbox corner to origin, causing offset)
        ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = false;
        ifcLoaderRef.current = ifcLoader;

        if (disposed) return;
        console.log("[IFC-Converter] Scene initialized");
      } catch (err) {
        if (disposed) return;
        const message = err instanceof Error ? err.message : "Failed to initialize";
        setErrorMsg(message);
        setStatus("error");
      }
    }

    init();

    return () => {
      disposed = true;

      if (handlesRef.current) {
        const t = handlesRef.current.getTimer();
        if (t) clearTimeout(t);
        worldRef.current?.camera.controls.removeEventListener("update", handlesRef.current.throttledUpdate);
        worldRef.current?.camera.controls.removeEventListener("rest", handlesRef.current.onRest);
      }

      if (fragmentsRef.current) {
        for (const [modelId] of fragmentsRef.current.list) {
          fragmentsRef.current.core.disposeModel(modelId);
        }
      }

      componentsRef.current?.dispose();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {status === "idle" && models.length === 0 && (
        <FilePicker onSelect={handleFiles} disabled={false} />
      )}

      {status === "converting" && <LoadingOverlay />}

      {status === "error" && (
        <ErrorOverlay message={errorMsg} onRetry={() => { setStatus("idle"); setErrorMsg(""); }} />
      )}

      {models.length > 0 && (
        <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-10 max-h-80 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900/95 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Loaded Models ({models.length})
            </span>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".ifc,.IFC";
                input.multiple = true;
                input.onchange = (e) => {
                  if (e.target instanceof HTMLInputElement && e.target.files) {
                    handleFiles(e.target.files);
                  }
                };
                input.click();
              }}
              className="rounded border border-neutral-600 px-3 py-1 text-xs text-neutral-400 transition hover:border-neutral-500 hover:text-white"
            >
              + Add Files
            </button>
          </div>
          <div className="space-y-2">
            {models.map((model) => (
              <ModelListItem
                key={model.id}
                model={model}
                onDownload={() => downloadFrag(model.id)}
                onRemove={() => removeModel(model.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
