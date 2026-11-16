import type { ReactNode } from "react";

/** The big serif title of a list, with an icon, a quiet subtitle and actions. */
export default function ListHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start gap-3 pt-1 sm:pt-4">
      <span className="mt-2.5 flex h-7 w-7 shrink-0 items-center justify-center sm:mt-3.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="mt-2 flex shrink-0 items-center gap-1 sm:mt-4">{actions}</div>}
    </header>
  );
}
