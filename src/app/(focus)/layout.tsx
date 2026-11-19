import { AmbientGlow } from "@/components/shared/ambient-glow";

/** One-task screens with no navigation: sign-in and onboarding. Full screen on phones, a card from tablet up. */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AmbientGlow />
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col pt-[calc(1rem+env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:justify-center md:px-8 md:py-12">
        <div className="flex flex-1 flex-col md:flex-none md:rounded-card md:border md:border-border md:bg-surface md:p-10 md:shadow-soft">
          {children}
        </div>
      </main>
    </>
  );
}
