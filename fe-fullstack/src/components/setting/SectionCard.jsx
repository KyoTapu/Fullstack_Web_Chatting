export default function SectionCard({ children }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      {children}
    </div>
  );
}