export function PanelSkeleton() {
  return (
    <div aria-hidden="true" className="mt-4 flex flex-col gap-3">
      <div className="h-9 w-40 rounded-xl bg-surface" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-surface motion-safe:animate-pulse" />
      ))}
    </div>
  );
}

export default function Loading() {
  return <PanelSkeleton />;
}
