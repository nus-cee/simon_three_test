/* ------------------------------------------------------------------ */
/*  IFC Viewer — Fragment loading + throttled LOD updates              */
/* ------------------------------------------------------------------ */

import * as THREE from "three";
import type * as OBC from "@thatopen/components";
import { FRAG_URL, MODEL_ID, THROTTLE_MS } from "./constants";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface FragmentCleanupHandles {
  throttledUpdate: () => void;
  onRest: () => void;
  /** Returns the current pending setTimeout id (if any). */
  getThrottleTimer: () => ReturnType<typeof setTimeout> | null;
}

/* ------------------------------------------------------------------ */
/*  Throttled update wiring                                           */
/* ------------------------------------------------------------------ */

/**
 * Attach throttled `fragments.core.update()` to camera-controls events.
 *
 * Returns handles that the cleanup function needs to remove listeners
 * and clear the trailing timer.
 */
export function wireThrottledUpdates(
  camera: OBC.OrthoPerspectiveCamera,
  fragments: OBC.FragmentsManager,
): FragmentCleanupHandles {
  let lastUpdate = 0;
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;

  const throttledUpdate = () => {
    const now = performance.now();
    if (now - lastUpdate >= THROTTLE_MS) {
      lastUpdate = now;
      fragments.core.update();
    } else if (!throttleTimer) {
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        lastUpdate = performance.now();
        fragments.core.update();
      }, THROTTLE_MS - (now - lastUpdate));
    }
  };

  const onRest = () => {
    fragments.core.update(true);
  };

  camera.controls.addEventListener("update", throttledUpdate);
  camera.controls.addEventListener("rest", onRest);

  console.debug("[IFC] fragments: throttled updates wired", { THROTTLE_MS });

  return {
    throttledUpdate,
    onRest,
    getThrottleTimer: () => throttleTimer,
  };
}

/* ------------------------------------------------------------------ */
/*  Model loading + scene wiring                                      */
/* ------------------------------------------------------------------ */

/**
 * Configure FragmentsManager callbacks and load the school model.
 *
 * Throws on network failure — caller should catch and show error UI.
 */
export async function loadModel(
  fragments: OBC.FragmentsManager,
  world: {
    camera: OBC.OrthoPerspectiveCamera;
    scene: OBC.SimpleScene;
  },
): Promise<void> {
  /* When a model is added, wire camera + add to scene. */
  fragments.list.onItemSet.add(({ value: model }) => {
    model.useCamera(world.camera.three);
    world.scene.three.add(model.object);
    fragments.core.update(true);
    console.debug("[IFC] fragments: model added to scene");
  });

  /* Prevent z-fighting on co-planar surfaces. */
  fragments.core.models.materials.list.onItemSet.add(
    ({ value: material }) => {
      if (!("isLodMaterial" in material && material.isLodMaterial)) {
        material.polygonOffset = true;
        material.polygonOffsetUnits = 1;
        material.polygonOffsetFactor = Math.random();
      }
    },
  );

  /* Fetch the .frag file */
  console.debug("[IFC] fragments: fetching", FRAG_URL);
  const response = await fetch(FRAG_URL);
  if (!response.ok)
    throw new Error(`Fragment fetch failed: ${response.status}`);
  const buffer = await response.arrayBuffer();

  await fragments.core.load(buffer, { modelId: MODEL_ID });
  console.debug("[IFC] fragments: model loaded", { MODEL_ID });

  /* ---- Diagnostic: log a sample of material colors ---- */
  let lambertCount = 0;
  let lodCount = 0;
  const sampleColors: string[] = [];

  fragments.core.models.materials.list.forEach(
    (material: THREE.Material, id: number) => {
      if ("isMeshLambertMaterial" in material && material.isMeshLambertMaterial) {
        lambertCount++;
        const m = material as THREE.MeshLambertMaterial;
        if (sampleColors.length < 8) {
          sampleColors.push(
            `  #${id}: rgb(${m.color.r.toFixed(2)}, ${m.color.g.toFixed(2)}, ${m.color.b.toFixed(2)}) a=${m.opacity}`,
          );
        }
      } else {
        lodCount++;
      }
    },
  );

  console.debug(
    `[IFC] materials: ${lambertCount} lambert, ${lodCount} lod\n` +
      (sampleColors.length ? `Sample (linear values):\n${sampleColors.join("\n")}` : ""),
  );
}
