export function AmbientGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60%_100%_at_70%_0%,var(--glow),transparent)]"
    />
  );
}
