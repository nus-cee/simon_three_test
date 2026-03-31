/* ------------------------------------------------------------------ */
/*  IFC Viewer — Resource cleanup                                     */
/* ------------------------------------------------------------------ */

import type * as OBC from "@thatopen/components";
import type { FragmentCleanupHandles } from "./setupFragments";

export interface CleanupRefs {
  camera: OBC.OrthoPerspectiveCamera | null;
  components: OBC.Components | null;
  fragments: OBC.FragmentsManager | null;
  handles: FragmentCleanupHandles | null;
}

/**
 * Tear down everything created during init().
 * Safe to call even if init() was only partially completed.
 */
export function dispose(refs: CleanupRefs): void {
  console.debug("[IFC] cleanup: disposing resources");

  /* 1. Clear any pending throttle timer */
  const pendingTimer = refs.handles?.getThrottleTimer();
  if (pendingTimer) clearTimeout(pendingTimer);

  /* 2. Remove camera-controls event listeners */
  if (refs.camera && refs.handles) {
    const cc = refs.camera.controls;
    cc.removeEventListener("update", refs.handles.throttledUpdate);
    cc.removeEventListener("rest", refs.handles.onRest);
    console.debug("[IFC] cleanup: camera listeners removed");
  }

  /* 3. Dispose fragment models */
  if (refs.fragments) {
    for (const [modelId] of refs.fragments.list) {
      refs.fragments.core.disposeModel(modelId);
    }
    console.debug("[IFC] cleanup: fragment models disposed");
  }

  /* 4. Dispose all OBC components (renderer, scene, camera, etc.) */
  if (refs.components) {
    refs.components.dispose();
    console.debug("[IFC] cleanup: OBC components disposed");
  }
}
