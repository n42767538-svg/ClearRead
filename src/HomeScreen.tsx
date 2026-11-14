import { CheckCircle2, Search, Type, Volume2 } from "lucide-react";
import type { AppScreen } from "../types";

interface HomeScreenProps {
  onNavigate: (screen: AppScreen) => void;
  isPro: boolean;
  onOpenUpgrade: () => void;
}

export function HomeScreen({ onNavigate, isPro, onOpenUpgrade }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <header className="border-b-2 border-black bg-white">
        <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
          <h1 className="font-display text-[38px] font-extrabold leading-tight tracking-tight text-black sm:text-[46px]">
            ClearRead
          </h1>
          <p className="mt-2 text-[22px] font-medium leading-snug text-neutral-800 sm:text-[24px]">
            Simple, clear tools to help you read every day.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-8 px-5 py-7 sm:px-8 sm:py-10">
        <section aria-label="Main tools" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => onNavigate("magnifier")}
            className="group flex min-h-[132px] w-full flex-col justify-between rounded-3xl border-[3px] border-black bg-[#0A3678] p-7 text-left text-white shadow-sm transition-transform hover:bg-[#082B61] active:scale-[0.99] lg:min-h-[260px]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A3678]">
                <Search className="h-9 w-9 stroke-[2.75]" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5">
              <span className="block font-display text-[28px] font-extrabold leading-tight sm:text-[30px]">
                Magnifier &amp; Light
              </span>
              <span className="mt-2 block text-[22px] font-medium leading-snug text-blue-100">
                Zoom in on medicine bottles, menus, or bills.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("reader")}
            className="group flex min-h-[132px] w-full flex-col justify-between rounded-3xl border-[3px] border-black bg-[#C2410C] p-7 text-left text-white shadow-sm transition-transform hover:bg-[#9A3412] active:scale-[0.99] lg:min-h-[260px]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[#C2410C]">
                <Volume2 className="h-9 w-9 stroke-[2.75]" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5">
              <span className="block font-display text-[28px] font-extrabold leading-tight sm:text-[30px]">
                Read Text Aloud
              </span>
              <span className="mt-2 block text-[22px] font-medium leading-snug text-orange-50">
                Listen to messages or a photo of small print.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="group flex min-h-[132px] w-full flex-col justify-between rounded-3xl border-[3px] border-black bg-white p-7 text-left text-black shadow-sm transition-transform hover:bg-slate-100 active:scale-[0.99] lg:min-h-[260px]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-[#0A3678] text-white">
                <Type className="h-9 w-9 stroke-[2.75]" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5">
              <span className="block font-display text-[28px] font-extrabold leading-tight text-black sm:text-[30px]">
                Make Phone Text Bigger
              </span>
              <span className="mt-2 block text-[22px] font-medium leading-snug text-neutral-800">
                Open phone display settings with a 2-step guide.
              </span>
            </div>
          </button>
        </section>

        <section
          aria-label="Lifetime Pro Upgrade"
          className="rounded-3xl border-2 border-black bg-slate-50 p-6 sm:p-7"
        >
          {isPro ? (
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="mt-1 h-9 w-9 shrink-0 text-[#15803D]" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-[24px] font-extrabold text-black sm:text-[26px]">
                    ClearRead Lifetime Pro is Active
                  </h2>
                  <p className="mt-1 text-[22px] text-neutral-800">
                    One-time $1.99 payment complete · Ad-free forever
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-[24px] font-extrabold leading-snug text-black sm:text-[26px]">
                  Unlock Lifetime Ad-Free Pro for $1.99 (One-time payment)
                </h2>
                <p className="mt-1 text-[22px] font-medium text-neutral-800">
                  No subscriptions · No hidden fees
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="min-h-[64px] w-full shrink-0 rounded-2xl border-2 border-black bg-[#0A3678] px-7 py-4 text-[22px] font-bold text-white transition-colors hover:bg-[#082B61] active:scale-[0.99] sm:w-auto whitespace-nowrap"
              >
                Upgrade for $1.99
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
