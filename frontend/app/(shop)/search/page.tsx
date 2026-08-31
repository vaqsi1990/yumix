export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 lg:px-8">
      <h1 className="font-[family-name:var(--font-inter)] text-xl font-semibold text-neutral-900">
        ძებნა
      </h1>
      <form className="mt-4 flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm">
        <input
          type="search"
          name="q"
          placeholder="რესტორანი, კერძი..."
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          autoFocus
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-[#FF0050] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#e60048]"
        >
          ძებნა
        </button>
      </form>
    </div>
  );
}
