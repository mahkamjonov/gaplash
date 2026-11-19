import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the room's code and data load. Shaped like the waiting room, which comes first. */
export function RoomSkeleton({ panelOnly = false }: { panelOnly?: boolean }) {
  if (panelOnly) {
    return (
      <div className="flex flex-1 flex-col gap-4" aria-hidden>
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="mt-auto h-14 w-full rounded-pill" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden" aria-hidden>
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6 md:justify-center md:px-8 md:py-10">
        <Skeleton className="size-11 rounded-full" />
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10 short:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-card short:aspect-video" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-14 w-full rounded-input" />
            <Skeleton className="h-14 w-full rounded-pill" />
          </div>
        </div>
      </div>
    </div>
  );
}
