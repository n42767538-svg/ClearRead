import { ArrowLeft } from "lucide-react";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <header className="border-b-2 border-black bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[60px] shrink-0 items-center gap-3 rounded-2xl border-2 border-black bg-white px-5 py-3 text-[22px] font-bold text-black transition-colors hover:bg-slate-100 active:scale-[0.99] whitespace-nowrap"
        >
          <ArrowLeft className="h-7 w-7 shrink-0 stroke-[2.75]" aria-hidden="true" />
          <span>Back to Home</span>
        </button>

        <h1 className="font-display text-[28px] font-extrabold tracking-tight text-black sm:text-[34px]">
          {title}
        </h1>
      </div>
    </header>
  );
}
