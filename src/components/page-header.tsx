export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 pb-4 pt-2">
      <div>
        {subtitle && <p className="text-sm text-texte-discret">{subtitle}</p>}
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-actif">{title}</h1>
      </div>
      {children}
    </header>
  );
}
