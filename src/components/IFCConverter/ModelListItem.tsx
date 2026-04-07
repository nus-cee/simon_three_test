/* ------------------------------------------------------------------ */
/*  IFC Converter — Model List Item                                   */
/* ------------------------------------------------------------------ */

import type { ModelEntry } from "./IFCConverterScene";

interface ModelListItemProps {
  model: ModelEntry;
  onDownload: () => void;
  onRemove: () => void;
}

export function ModelListItem({ model, onDownload, onRemove }: ModelListItemProps) {
  const statusColor =
    model.status === "loaded"
      ? "text-green-400"
      : model.status === "converting"
        ? "text-yellow-400"
        : "text-red-400";

  const statusText =
    model.status === "loaded"
      ? "Ready"
      : model.status === "converting"
        ? "Converting..."
        : "Error";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-200">
          {model.fileName}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${statusColor}`}>{statusText}</span>
          {model.error && (
            <span className="truncate text-xs text-red-400">{model.error}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {model.status === "loaded" && (
          <button
            onClick={onDownload}
            className="rounded border border-violet-700 bg-violet-900/50 px-3 py-1 text-xs text-violet-300 transition hover:bg-violet-700"
          >
            Download .frag
          </button>
        )}
        <button
          onClick={onRemove}
          className="rounded border border-neutral-600 px-2 py-1 text-xs text-neutral-400 transition hover:border-red-600 hover:text-red-400"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
