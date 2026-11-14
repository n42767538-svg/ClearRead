import { ExternalLink, Hand, Settings, Type } from "lucide-react";
import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";

interface MakeTextBiggerScreenProps {
  onBack: () => void;
}

const FONT_LEVELS = [
  { label: "Standard", px: 16 },
  { label: "Medium", px: 20 },
  { label: "Large", px: 25 },
  { label: "Largest", px: 30 },
];

export function MakeTextBiggerScreen({ onBack }: MakeTextBiggerScreenProps) {
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(2); // Default highlight on "Large"

  const handleOpenDisplaySettings = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      // Android Intent URI matching Settings.ACTION_DISPLAY_SETTINGS
      window.location.href =
        "intent:#Intent;action=android.settings.DISPLAY_SETTINGS;end";
      setSettingsFeedback(
        "Opening your phone's Display Settings. Follow Step 1 and Step 2 below."
      );
    } else {
      setSettingsFeedback(
        "On an Android phone, this button opens Settings -> Display directly. Follow the 2 easy steps below on your phone."
      );
    }
  };

  const currentLevel = FONT_LEVELS[previewIndex];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <ScreenHeader title="Make Phone Text Bigger" onBack={onBack} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-7 px-5 py-6 sm:px-8">
        {/* Direct Android Display Settings Button */}
        <section aria-label="Open phone settings" className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleOpenDisplaySettings}
            className="flex min-h-[88px] w-full items-center justify-center gap-4 rounded-3xl border-[3px] border-black bg-[#0A3678] px-6 py-5 text-[24px] font-extrabold text-white transition-colors hover:bg-[#082B61] active:scale-[0.99] sm:text-[28px]"
          >
            <Settings className="h-9 w-9 shrink-0 stroke-[2.5]" aria-hidden="true" />
            <span>Open Phone Display Settings</span>
            <ExternalLink className="h-7 w-7 shrink-0 stroke-[2.5]" aria-hidden="true" />
          </button>

          {settingsFeedback && (
            <div
              role="status"
              className="rounded-2xl border-2 border-black bg-blue-50 px-5 py-4 text-[22px] font-bold leading-snug text-black"
            >
              {settingsFeedback}
            </div>
          )}
        </section>

        {/* Simple 2-Step Visual Guide */}
        <section
          aria-label="2-step guide"
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {/* Step 1 */}
          <div className="flex flex-col justify-between rounded-3xl border-[3px] border-black bg-white p-6 sm:p-7">
            <div>
              <p className="font-display text-[22px] font-extrabold text-[#0A3678]">
                Step 1
              </p>
              <h2 className="mt-1 font-display text-[26px] font-extrabold leading-snug text-black sm:text-[28px]">
                Tap &ldquo;Display size and text&rdquo;
              </h2>
              <p className="mt-3 text-[22px] font-medium leading-relaxed text-neutral-800">
                Inside your phone&apos;s Display menu, look for{" "}
                <strong className="font-bold text-black">Display size and text</strong>{" "}
                (or <strong className="font-bold text-black">Font size and style</strong>)
                and tap it once.
              </p>
            </div>

            {/* Visual Mockup of Android Settings List */}
            <div
              aria-hidden="true"
              className="mt-6 overflow-hidden rounded-2xl border-2 border-black bg-slate-50"
            >
              <div className="border-b-2 border-black/15 px-4 py-3 text-[19px] font-semibold text-neutral-600">
                Brightness level
              </div>
              <div className="flex items-center justify-between border-y-[3px] border-[#0A3678] bg-blue-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0A3678] text-white">
                    <Type className="h-6 w-6 stroke-[2.75]" />
                  </span>
                  <span className="text-[22px] font-extrabold text-black">
                    Display size and text
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-xl bg-[#C2410C] px-3 py-1.5 text-[18px] font-bold text-white">
                  <Hand className="h-5 w-5" />
                  <span>Tap here</span>
                </span>
              </div>
              <div className="px-4 py-3 text-[19px] font-semibold text-neutral-600">
                Screen timeout
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col justify-between rounded-3xl border-[3px] border-black bg-white p-6 sm:p-7">
            <div>
              <p className="font-display text-[22px] font-extrabold text-[#C2410C]">
                Step 2
              </p>
              <h2 className="mt-1 font-display text-[26px] font-extrabold leading-snug text-black sm:text-[28px]">
                Slide the bar right to &ldquo;Large&rdquo;
              </h2>
              <p className="mt-3 text-[22px] font-medium leading-relaxed text-neutral-800">
                Drag the Font Size circle to the right until the sample words are easy to
                read. Try sliding the practice bar below:
              </p>
            </div>

            {/* Interactive Practice Font Size Slider */}
            <div className="mt-6 rounded-2xl border-2 border-black bg-slate-50 p-5">
              <div className="min-h-[88px] rounded-xl border-2 border-black bg-white p-4">
                <p
                  style={{ fontSize: `${currentLevel.px}px` }}
                  className="font-semibold leading-snug text-black transition-all"
                >
                  Sample text: Your messages and menus will look this big.
                </p>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[20px] font-bold text-black">
                  <span>Selected: {currentLevel.label}</span>
                  <span className="tabular-nums text-[#0A3678]">
                    {currentLevel.px}px
                  </span>
                </div>

                <input
                  type="range"
                  aria-label="Practice font size slider"
                  min={0}
                  max={FONT_LEVELS.length - 1}
                  step={1}
                  value={previewIndex}
                  onChange={(e) => setPreviewIndex(Number(e.target.value))}
                  className="senior-slider"
                />

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {FONT_LEVELS.map((level, idx) => (
                    <button
                      key={level.label}
                      type="button"
                      onClick={() => setPreviewIndex(idx)}
                      className={`min-h-[48px] rounded-xl border-2 border-black px-2 py-1 text-[17px] font-bold transition-colors ${
                        previewIndex === idx
                          ? "bg-[#0A3678] text-white"
                          : "bg-white text-black hover:bg-slate-200"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
