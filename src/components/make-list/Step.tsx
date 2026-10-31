// A numbered section of the form. The number is quiet mono text, not a badge: the tier list
// below it is the thing that should draw the eye.
export default function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-baseline gap-3 font-medium">
        <span className="font-mono text-xs tabular-nums text-ink-400">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
