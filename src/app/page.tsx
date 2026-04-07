import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
            Simon Three Test
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Three.js practice routes
          </h1>
          <p className="max-w-2xl text-base text-stone-300 sm:text-lg">
            Use separate routes for each experiment so you can keep adding new
            scenes without mixing everything into one page.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/rock"
            className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 transition hover:border-stone-600 hover:bg-stone-900"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500">
              Scene 01
            </p>
            <h2 className="mt-3 text-2xl font-medium text-stone-50">
              Rock Material
            </h2>
            <p className="mt-2 text-sm text-stone-300">
              Open the textured raw Three.js scene at `localhost:3000/rock`.
            </p>
          </Link>

          <Link
            href="/loader-test"
            className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 transition hover:border-stone-600 hover:bg-stone-900"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500">
              Scene 02
            </p>
            <h2 className="mt-3 text-2xl font-medium text-stone-50">
              GLTF Loader Test
            </h2>
            <p className="mt-2 text-sm text-stone-300">
              Open the duck loader example at `localhost:3000/loader-test`.
            </p>
          </Link>

          <Link
            href="/ifc-test"
            className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 transition hover:border-stone-600 hover:bg-stone-900"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500">
              Scene 03
            </p>
            <h2 className="mt-3 text-2xl font-medium text-stone-50">
              IFC Test Notes
            </h2>
            <p className="mt-2 text-sm text-stone-300">
              Open research notes for `@thatopen/components` at `localhost:3000/ifc-test`.
            </p>
          </Link>

          <Link
            href="/ifc-converter"
            className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 transition hover:border-stone-600 hover:bg-stone-900"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500">
              Scene 04
            </p>
            <h2 className="mt-3 text-2xl font-medium text-stone-50">
              IFC → Fragments Converter
            </h2>
            <p className="mt-2 text-sm text-stone-300">
              Convert .ifc files to .frag in the browser, preview in 3D, and
              download at `localhost:3000/ifc-converter`.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
