export default function Home() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(239,68,68,0.10),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.10),transparent_45%)]" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-5 py-14">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
              Forensic UI • Real-time confidence • Media preview
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Deepfake Detection and Media Authenticity Analyzer
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Upload a single image, video, or audio file and receive an
              authenticity verdict, confidence score, and risk level. Results
              are rendered with forensic widgets for rapid review.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/upload"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start Analysis
              </a>
              <a
                href="/results"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-transparent px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                View Last Result
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
            <div className="text-sm font-medium">Core outputs</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-border/60 bg-background/20 p-4">
                <div className="text-xs text-muted-foreground">Label</div>
                <div className="mt-1 text-base font-semibold">
                  Authentic / Manipulated
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/20 p-4">
                <div className="text-xs text-muted-foreground">Confidence</div>
                <div className="mt-1 text-base font-semibold">0–100%</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/20 p-4">
                <div className="text-xs text-muted-foreground">Risk level</div>
                <div className="mt-1 text-base font-semibold">
                  Low / Medium / High
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
