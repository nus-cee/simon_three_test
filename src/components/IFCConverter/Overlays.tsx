/* ------------------------------------------------------------------ */
/*  IFC Converter — Overlays (spinner/error)                          */
/* ------------------------------------------------------------------ */

interface ErrorOverlayProps {
  message: string;
  onRetry?: () => void;
}

export function LoadingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-violet-500" />
        <p className="text-sm text-neutral-400">Converting IFC to Fragments...</p>
      </div>
    </div>
  );
}

export function ErrorOverlay({ message, onRetry }: ErrorOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/90 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-lg border border-red-800/50 bg-red-950/50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-red-400">Conversion Error</h3>
        <p className="mb-4 text-sm text-neutral-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded bg-red-700 px-4 py-2 text-sm text-white transition hover:bg-red-600"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
