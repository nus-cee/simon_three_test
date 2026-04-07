/* ------------------------------------------------------------------ */
/*  IFC Converter — Shared constants                                  */
/* ------------------------------------------------------------------ */

export const WORKER_URL = "/fragments/worker.mjs";

export const WASM_PATH = "/wasm/";

export const WASM_CONFIG = {
  path: WASM_PATH,
  absolute: true,
} as const;

export const THROTTLE_MS = 100;
