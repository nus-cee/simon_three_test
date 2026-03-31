"use client";

/* ------------------------------------------------------------------ */
/*  IFC Viewer — Main orchestrator component                          */
/*                                                                    */
/*  This is intentionally thin. Heavy logic lives in:                 */
/*    setupRenderer.ts   — color-space & tone-mapping                 */
/*    setupCamera.ts     — BIM-style mouse/touch controls             */
/*    setupFragments.ts  — worker, throttled updates, model loading   */
/*    cleanup.ts         — teardown / disposal                        */
/*    Overlays.tsx       — loading spinner & error UI                 */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import * as OBC from "@thatopen/components";

import { WORKER_URL } from "./constants";
import { setupRenderer } from "./setupRenderer";
import { setupCamera } from "./setupCamera";
import {
  wireThrottledUpdates,
  loadModel,
} from "./setupFragments";
import { dispose, type CleanupRefs } from "./cleanup";
import { LoadingOverlay, ErrorOverlay } from "./Overlays";

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

type Status = "loading" | "loaded" | "error";

export function IFCScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  /* Keeps a stable reference so the retry callback can bump it. */
  const attemptRef = useRef(0);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    attemptRef.current += 1;
    setStatus("loading");
    setErrorMsg("");
    setAttempt(attemptRef.current);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;

    /* Populated during init(), consumed by the cleanup closure. */
    const refs: CleanupRefs = {
      camera: null,
      components: null,
      fragments: null,
      handles: null,
    };

    async function init(el: HTMLDivElement) {
      try {
        /* ---- 1. OBC world ---- */
        console.debug("[IFC] init: creating OBC world...");
        refs.components = new OBC.Components();

        const worlds = refs.components.get(OBC.Worlds);
        const world = worlds.create<
          OBC.SimpleScene,
          OBC.OrthoPerspectiveCamera,
          OBC.SimpleRenderer
        >();

        world.scene = new OBC.SimpleScene(refs.components);
        world.scene.setup();
        world.scene.three.background = null;

        /* ---- Fix upstream bug: SimpleScene.setup() accidentally gives  */
        /*      the AmbientLight the DirectionalLight's intensity (1.5). */
        /*      Correct it back to 1.0 for proper BIM lighting balance.  */
        world.scene.three.traverse((child) => {
          if (child instanceof THREE.AmbientLight) {
            child.intensity = 1.0;
            console.debug("[IFC] scene: ambient light intensity fixed to 1.0");
          }
        });

        world.renderer = new OBC.SimpleRenderer(refs.components, el);
        world.camera = new OBC.OrthoPerspectiveCamera(refs.components);

        refs.camera = world.camera;

        /* ---- 3. Renderer color management ---- */
        setupRenderer(world.renderer);

        /* ---- 4. Start the render loop ---- */
        refs.components.init();

        /* ---- 5. BIM-style camera controls ---- */
        setupCamera(world.camera);

        /* ---- 6. Grid ---- */
        refs.components.get(OBC.Grids).create(world);

        /* ---- 7. FragmentsManager + throttled updates ---- */
        refs.fragments = refs.components.get(OBC.FragmentsManager);
        refs.fragments.init(WORKER_URL);
        refs.handles = wireThrottledUpdates(world.camera, refs.fragments);

        if (disposed) return;

        /* ---- 8. Load the model ---- */
        await loadModel(refs.fragments, world);
        if (disposed) return;

        /* ---- 9. Initial camera position ---- */
        await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);
        await refs.fragments.core.update(true);

        console.debug("[IFC] init: complete");
        setStatus("loaded");
      } catch (err) {
        if (disposed) return;
        const message =
          err instanceof Error ? err.message : "Unknown error loading fragment";
        console.error("[IFC] init failed:", message);
        setErrorMsg(message);
        setStatus("error");
      }
    }

    init(container);

    /* ---- Cleanup ---- */
    return () => {
      disposed = true;
      dispose(refs);
    };
    // Re-run the full init when `attempt` bumps (user clicked "Retry").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Three.js mount point */}
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Loading overlay */}
      {status === "loading" && <LoadingOverlay />}

      {/* Error overlay */}
      {status === "error" && (
        <ErrorOverlay message={errorMsg} onRetry={retry} />
      )}
    </div>
  );
}
