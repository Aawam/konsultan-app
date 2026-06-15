export function PageError({ error }: { error: unknown }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-red-400">Error</h1>
      <pre className="mt-2 text-sm text-slate-400">{JSON.stringify(error, null, 2)}</pre>
    </div>
  )
}
