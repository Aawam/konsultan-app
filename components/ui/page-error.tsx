export function PageError({ error }: { error: unknown }) {
  void error;

  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-xl border border-destructive/25 bg-card px-4 py-8 text-center sm:px-6 sm:py-10"
    >
      <p className="page-eyebrow text-destructive">Gangguan data</p>
      <h1 className="mt-2 text-lg font-bold text-foreground sm:text-xl">Tidak dapat memuat data</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Koneksi atau layanan data sedang bermasalah. Muat ulang halaman untuk mencoba kembali.
      </p>
      <a
        href=""
        className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        Muat ulang halaman
      </a>
    </div>
  )
}
