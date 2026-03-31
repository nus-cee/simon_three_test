/* ------------------------------------------------------------------ */
/*  IFC Viewer — Shared constants                                     */
/* ------------------------------------------------------------------ */

/** Local path served from public/fragments/ — no CDN roundtrip. */
export const WORKER_URL = "/fragments/worker.mjs";

/** Local path served from public/fragments/ — no CDN roundtrip. */
export const FRAG_URL = "/fragments/school_arq.frag";

export const MODEL_ID = "school_arq";

/** Minimum ms between `fragments.core.update()` calls during camera movement. */
export const THROTTLE_MS = 100;
