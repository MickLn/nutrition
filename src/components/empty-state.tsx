import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-bg text-blue">
        <Icon className="size-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
