/* ------------------------------------------------------------------ */
/*  IFC Converter — File Picker UI                                    */
/* ------------------------------------------------------------------ */

interface FilePickerProps {
  onSelect: (files: FileList) => void;
  disabled?: boolean;
}

export function FilePicker({ onSelect, disabled }: FilePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSelect(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center">
      <label className="group cursor-pointer rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900/80 px-12 py-10 backdrop-blur-sm transition hover:border-violet-500 hover:bg-neutral-800/80">
        <input
          type="file"
          accept=".ifc,.IFC"
          multiple
          disabled={disabled}
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-12 w-12 text-neutral-500 transition group-hover:text-violet-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <div className="text-center">
            <p className="text-lg font-medium text-neutral-300 group-hover:text-white">
              Drop IFC files here
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              or click to browse
            </p>
          </div>
          <p className="text-xs text-neutral-600">
            Supports multiple files
          </p>
        </div>
      </label>
    </div>
  );
}
