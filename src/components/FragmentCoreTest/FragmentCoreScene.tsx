"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import CameraControls from "camera-controls";
import { FragmentsModels } from "@thatopen/fragments";
import {
  DEFAULT_FRAG_URL,
  UPDATE_THROTTLE_MS,
  WORKER_URL,
} from "./constants";
import { ErrorOverlay, LoadingOverlay } from "./Overlays";

CameraControls.install({ THREE });

type SceneStatus = "loading" | "loaded" | "error";

interface Diagnostics {
  workerUrl: string;
  source: string;
  modelId: string;
  updateCount: number;
  forcedUpdateCount: number;
  cameraBound: boolean;
  loadedAt: string;
}

interface SceneRuntime {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: CameraControls;
  fragments: FragmentsModels;
  frameId: number;
  onResize: () => void;
  onUpdate: () => void;
  onRest: () => void;
}

export function FragmentCoreScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<SceneRuntime | null>(null);
  const updateCountRef = useRef(0);
  const forcedUpdateCountRef = useRef(0);

  const [status, setStatus] = useState<SceneStatus>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingLabel, setLoadingLabel] = useState("Initializing fragment core...");
  const [attempt, setAttempt] = useState(0);

  const [diagnostics, setDiagnostics] = useState<Diagnostics>({
    workerUrl: WORKER_URL,
    source: DEFAULT_FRAG_URL,
    modelId: "school_arq_core",
    updateCount: 0,
    forcedUpdateCount: 0,
    cameraBound: false,
    loadedAt: "",
  });

  const syncCountersToUi = useCallback(() => {
    setDiagnostics((prev) => ({
      ...prev,
      updateCount: updateCountRef.current,
      forcedUpdateCount: forcedUpdateCountRef.current,
    }));
  }, []);

  const loadFromBuffer = useCallback(
    async (buffer: ArrayBuffer, sourceLabel: string, modelId: string) => {
      const runtime = runtimeRef.current;
      if (!runtime) return;

      setStatus("loading");
      setErrorMsg("");
      setLoadingLabel(`Loading ${sourceLabel}...`);
      updateCountRef.current = 0;
      forcedUpdateCountRef.current = 0;
      syncCountersToUi();

      try {
        for (const id of runtime.fragments.models.list.keys()) {
          await runtime.fragments.disposeModel(id);
        }

        const model = await runtime.fragments.load(buffer, {
          modelId,
          camera: runtime.camera,
        });

        model.useCamera(runtime.camera);
        runtime.scene.add(model.object);
        await runtime.fragments.update(true);

        setDiagnostics((prev) => ({
          ...prev,
          source: sourceLabel,
          modelId,
          cameraBound: true,
          loadedAt: new Date().toLocaleTimeString(),
        }));
        syncCountersToUi();
        setStatus("loaded");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load fragment buffer";
        setErrorMsg(message);
        setStatus("error");
      }
    },
    [syncCountersToUi],
  );

  const loadDefaultFragment = useCallback(async () => {
    setLoadingLabel(`Fetching ${DEFAULT_FRAG_URL}...`);
    const response = await fetch(DEFAULT_FRAG_URL);
    if (!response.ok) {
      throw new Error(`Fragment fetch failed: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    await loadFromBuffer(buffer, DEFAULT_FRAG_URL, "school_arq_core");
  }, [loadFromBuffer]);

  const openLocalFrag = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".frag";
    input.onchange = async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const file = target.files?.[0];
      if (!file) return;
      const buffer = await file.arrayBuffer();
      const base = file.name.replace(/\.frag$/i, "") || "local_frag";
      await loadFromBuffer(buffer, file.name, `local_${base}_${Date.now()}`);
    };
    input.click();
  }, [loadFromBuffer]);

  const retry = useCallback(() => {
    setAttempt((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const host = container;

    let disposed = false;
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    let diagnosticsInterval: ReturnType<typeof setInterval> | null = null;

    async function init() {
      try {
        setStatus("loading");
        setErrorMsg("");
        setLoadingLabel("Initializing Three.js scene...");

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(host.clientWidth, host.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#09090b");

        const camera = new THREE.PerspectiveCamera(
          60,
          host.clientWidth / host.clientHeight,
          0.1,
          5000,
        );
        camera.position.set(78, 20, -2.2);

        const controls = new CameraControls(camera, renderer.domElement);
        controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
        controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
        controls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
        controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
        controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
        controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
        controls.touches.three = CameraControls.ACTION.TOUCH_TRUCK;
        controls.smoothTime = 0.15;
        controls.draggingSmoothTime = 0.1;
        controls.truckSpeed = 2;
        controls.dollySpeed = 1;
        controls.dollyToCursor = true;
        controls.infinityDolly = true;
        controls.restThreshold = 0.01;
        controls.minDistance = 1;

        const ambient = new THREE.AmbientLight(0xffffff, 1);
        const directional = new THREE.DirectionalLight(0xffffff, 1.5);
        directional.position.set(35, 60, 20);
        scene.add(ambient, directional, new THREE.GridHelper(200, 60));

        const fragments = new FragmentsModels(WORKER_URL);

        let lastUpdate = 0;

        const onUpdate = () => {
          const now = performance.now();
          if (now - lastUpdate >= UPDATE_THROTTLE_MS) {
            lastUpdate = now;
            void fragments.update();
            updateCountRef.current += 1;
          } else if (!throttleTimer) {
            throttleTimer = setTimeout(() => {
              throttleTimer = null;
              lastUpdate = performance.now();
              void fragments.update();
              updateCountRef.current += 1;
            }, UPDATE_THROTTLE_MS - (now - lastUpdate));
          }
        };

        const onRest = () => {
          void fragments.update(true);
          forcedUpdateCountRef.current += 1;
        };

        controls.addEventListener("update", onUpdate);
        controls.addEventListener("rest", onRest);
        diagnosticsInterval = setInterval(syncCountersToUi, 400);

        const onResize = () => {
          if (!runtimeRef.current) return;
          const w = host.clientWidth;
          const h = host.clientHeight;
          runtimeRef.current.camera.aspect = w / h;
          runtimeRef.current.camera.updateProjectionMatrix();
          runtimeRef.current.renderer.setSize(w, h);
        };

        let frameId = 0;
        const loop = () => {
          if (disposed || !runtimeRef.current) return;
          const delta = 1 / 60;
          controls.update(delta);
          renderer.render(scene, camera);
          frameId = window.requestAnimationFrame(loop);
          runtimeRef.current.frameId = frameId;
        };

        runtimeRef.current = {
          renderer,
          scene,
          camera,
          controls,
          fragments,
          frameId,
          onResize,
          onUpdate,
          onRest,
        };

        window.addEventListener("resize", onResize);
        await controls.setLookAt(78, 20, -2.2, 26, -4, 25);

        loop();

        if (disposed) return;

        await loadDefaultFragment();
      } catch (err) {
        if (disposed) return;
        const message = err instanceof Error ? err.message : "Initialization failed";
        setErrorMsg(message);
        setStatus("error");
      }
    }

    void init();

    return () => {
      disposed = true;
      const runtime = runtimeRef.current;
      if (!runtime) return;

      window.removeEventListener("resize", runtime.onResize);
      window.cancelAnimationFrame(runtime.frameId);
      runtime.controls.removeEventListener("update", runtime.onUpdate);
      runtime.controls.removeEventListener("rest", runtime.onRest);
      runtime.controls.disconnect();
      void runtime.fragments.dispose();
      runtime.renderer.dispose();
      runtime.scene.clear();
      if (throttleTimer) clearTimeout(throttleTimer);
      if (diagnosticsInterval) clearInterval(diagnosticsInterval);

      if (runtime.renderer.domElement.parentElement === host) {
        host.removeChild(runtime.renderer.domElement);
      }

      runtimeRef.current = null;
    };
  }, [attempt, loadDefaultFragment, syncCountersToUi]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      <div className="pointer-events-auto absolute bottom-4 left-4 z-10 w-[320px] rounded-lg border border-neutral-700 bg-neutral-900/90 p-3 text-xs text-neutral-300 backdrop-blur-sm">
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          Fragment Runtime Diagnostics
        </p>
        <p>
          <span className="text-neutral-500">Worker:</span> {diagnostics.workerUrl}
        </p>
        <p>
          <span className="text-neutral-500">Source:</span> {diagnostics.source}
        </p>
        <p>
          <span className="text-neutral-500">Model ID:</span> {diagnostics.modelId}
        </p>
        <p>
          <span className="text-neutral-500">Camera Bound:</span>{" "}
          {diagnostics.cameraBound ? "yes" : "no"}
        </p>
        <p>
          <span className="text-neutral-500">Updates:</span> {diagnostics.updateCount}
          {" · "}
          <span className="text-neutral-500">Forced:</span> {diagnostics.forcedUpdateCount}
        </p>
        <p>
          <span className="text-neutral-500">Loaded At:</span>{" "}
          {diagnostics.loadedAt || "-"}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={openLocalFrag}
            className="rounded border border-neutral-600 px-2 py-1 text-[11px] transition hover:border-neutral-500 hover:text-white"
          >
            Load Local .frag
          </button>
          <button
            onClick={retry}
            className="rounded border border-neutral-600 px-2 py-1 text-[11px] transition hover:border-neutral-500 hover:text-white"
          >
            Reload Default
          </button>
        </div>
      </div>

      {status === "loading" && <LoadingOverlay label={loadingLabel} />}
      {status === "error" && <ErrorOverlay message={errorMsg} onRetry={retry} />}
    </div>
  );
}
