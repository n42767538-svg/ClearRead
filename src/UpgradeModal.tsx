import { Check, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

interface UpgradeModalProps {
  onClose: () => void;
  onCompletePurchase: () => void;
}

export function UpgradeModal({ onClose, onCompletePurchase }: UpgradeModalProps) {
  const [purchased, setPurchased] = useState(false);

  const handleConfirmPurchase = () => {
    setPurchased(true);
    onCompletePurchase();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-dialog-title"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border-[3px] border-black bg-white p-6 text-black shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="upgrade-dialog-title"
            className="font-display text-[28px] font-extrabold leading-tight text-black sm:text-[32px]"
          >
            {purchased ? "ClearRead Pro Unlocked" : "ClearRead Lifetime Pro"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-white text-black hover:bg-slate-100"
          >
            <X className="h-8 w-8 stroke-[2.75]" aria-hidden="true" />
          </button>
        </div>

        {purchased ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border-2 border-black bg-emerald-50 p-6">
              <div className="flex items-center gap-3 text-[#15803D]">
                <ShieldCheck className="h-9 w-9 shrink-0 stroke-[2.5]" aria-hidden="true" />
                <span className="font-display text-[26px] font-extrabold">
                  Thank You!
                </span>
              </div>
              <p className="mt-3 text-[22px] font-medium leading-relaxed text-black">
                Your one-time $1.99 upgrade is complete. ClearRead is now ad-free on this device forever.
              </p>
              <div className="mt-4 border-t-2 border-black/15 pt-4 text-[22px] text-neutral-900">
                <span>Amount paid: $1.99</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>One-time payment</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[72px] w-full rounded-2xl border-2 border-black bg-[#0A3678] px-6 py-4 text-[24px] font-bold text-white hover:bg-[#082B61]"
            >
              Return to ClearRead
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border-2 border-black bg-slate-50 p-6">
              <p className="font-display text-[36px] font-extrabold tabular-nums text-[#0A3678]">
                $1.99
              </p>
              <p className="mt-1 text-[22px] font-bold text-black">
                One-time payment · Never pay again
              </p>
            </div>

            <ul className="space-y-4 text-[22px] font-medium leading-snug text-black">
              <li className="flex items-start gap-3">
                <Check className="mt-1 h-7 w-7 shrink-0 stroke-[3] text-[#15803D]" aria-hidden="true" />
                <span>No monthly or yearly subscriptions</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-1 h-7 w-7 shrink-0 stroke-[3] text-[#15803D]" aria-hidden="true" />
                <span>No hidden fees or surprise charges</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-1 h-7 w-7 shrink-0 stroke-[3] text-[#15803D]" aria-hidden="true" />
                <span>100% ad-free forever on this device</span>
              </li>
            </ul>

            <div className="flex flex-col gap-4 pt-2">
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="min-h-[76px] w-full rounded-2xl border-2 border-black bg-[#0A3678] px-6 py-4 text-[24px] font-bold text-white transition-colors hover:bg-[#082B61] active:scale-[0.99]"
              >
                Pay $1.99 Once — Unlock Pro
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-[64px] w-full rounded-2xl border-2 border-black bg-white px-6 py-4 text-[22px] font-bold text-black transition-colors hover:bg-slate-100"
              >
                No Thanks, Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
