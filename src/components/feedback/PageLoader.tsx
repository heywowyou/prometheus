interface PageLoaderProps {
  label?: string;
}

/** Shared placeholder for route-level lazy loading and auth bootstrapping. */
function PageLoader({ label = "Loading…" }: PageLoaderProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export default PageLoader;
