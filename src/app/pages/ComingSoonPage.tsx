import { Construction } from "lucide-react";

interface ComingSoonPageProps {
  title: string;
}

/** Placeholder for subapps that are routed but not yet implemented. */
function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-24 text-center">
      <Construction className="h-10 w-10 text-muted-foreground opacity-40" />
      <div className="space-y-1">
        <h2 className="section-title">{title}</h2>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  );
}

export default ComingSoonPage;
