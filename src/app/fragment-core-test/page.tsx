import Link from "next/link";
import { FragmentCoreScene } from "@/components/FragmentCoreTest/FragmentCoreScene";

export default function FragmentCoreTestPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-neutral-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4">
        <div className="pointer-events-auto">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            Fragment Core Test
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-100">
            Pure engine_fragment runtime
          </h1>
        </div>
        <Link
          href="/"
          className="pointer-events-auto rounded-full border border-neutral-800 bg-neutral-950/60 px-4 py-2 text-sm text-neutral-300 backdrop-blur transition hover:border-neutral-600 hover:text-white"
        >
          Back home
        </Link>
      </div>

      <FragmentCoreScene />
    </main>
  );
}
