import {
  Camera,
  ClipboardPaste,
  Gauge,
  Image as ImageIcon,
  ImagePlus,
  Pause,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import sampleBottleImg from "../assets/images/sample_medicine_label_1794639095356.jpg";
import type { SpeechSpeed } from "../types";
import { ScreenHeader } from "./ScreenHeader";

interface ReadAloudScreenProps {
  onBack: () => void;
  initialPhotoDataUrl?: string | null;
  onConsumeInitialPhoto?: () => void;
}

type PlaybackState = "idle" | "speaking" | "paused";

function pickUsEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const preferredNames = [
    "Google US English",
    "Samantha",
    "Microsoft Aria",
    "Microsoft Jenny",
    "Microsoft Guy",
    "Alex",
    "Ava",
  ];

  for (const name of preferredNames) {
    const match = voices.find((v) => v.name.includes(name) && v.lang.startsWith("en"));
    if (match) return match;
  }

  const usVoice = voices.find((v) => v.lang === "en-US" || v.lang === "en_US");
  if (usVoice) return usVoice;

  const anyEnglish = voices.find((v) => v.lang.startsWith("en"));
  return anyEnglish ?? voices[0];
}

function splitIntoChunks(input: string): string[] {
  const cleaned = input.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const rawParts = cleaned.match(/[^.!?]+[.!?]*\s*/g) ?? [cleaned];
  return rawParts.map((part) => part.trim()).filter(Boolean);
}

async function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read that photo."));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load that image."));
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  const file = new File([blob], "sample.jpg", { type: blob.type || "image/jpeg" });
  return fileToCompressedDataUrl(file);
}

export function ReadAloudScreen({
  onBack,
  initialPhotoDataUrl,
  onConsumeInitialPhoto,
}: ReadAloudScreenProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [text, setText] = useState("");
  const [speed, setSpeed] = useState<SpeechSpeed>("slow");
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Paste a message, take a photo, or upload a photo from your gallery."
  );
  const [ocrLoading, setOcrLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const speedRef = useRef<SpeechSpeed>(speed);
  const stoppedManuallyRef = useRef(false);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const runOcr = useCallback(async (imageDataUrl: string) => {
    setOcrLoading(true);
    setStatusMessage("Reading words from your photo...");
    try {
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\\/$/, "");\n      const response = await fetch(`${apiBaseUrl}/api/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });

      const data = (await response.json()) as {
        text?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setStatusMessage(
          data.error ?? "Could not read that photo. Please try again or paste text."
        );
        return;
      }

      if (!data.text) {
        setStatusMessage(
          data.message ?? "No clear words were found in that photo."
        );
        return;
      }

      setText(data.text);
      setStatusMessage("Words found! Tap the green PLAY button below to listen.");
    } catch {
      setStatusMessage(
        "Could not connect to read that photo. Please check your connection or paste text."
      );
    } finally {
      setOcrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPhotoDataUrl) {
      runOcr(initialPhotoDataUrl);
      onConsumeInitialPhoto?.();
    }
  }, [initialPhotoDataUrl, onConsumeInitialPhoto, runOcr]);

  const stopSpeaking = useCallback(() => {
    stoppedManuallyRef.current = true;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    chunkIndexRef.current = 0;
    setPlayback("idle");
  }, []);

  const speakFromChunk = useCallback(
    (index: number, chosenSpeed: SpeechSpeed) => {
      if (!("speechSynthesis" in window)) {
        setStatusMessage("Voice reading is not supported in this browser.");
        return;
      }

      const chunks = chunksRef.current;
      if (index >= chunks.length) {
        setPlayback("idle");
        chunkIndexRef.current = 0;
        setStatusMessage("Finished reading.");
        return;
      }

      stoppedManuallyRef.current = false;
      chunkIndexRef.current = index;

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = "en-US";
      utterance.rate = chosenSpeed === "slow" ? 0.78 : 1.0;
      utterance.pitch = 1.0;

      const usVoice = pickUsEnglishVoice(
        voices.length ? voices : window.speechSynthesis.getVoices()
      );
      if (usVoice) {
        utterance.voice = usVoice;
      }

      utterance.onend = () => {
        if (stoppedManuallyRef.current) return;
        speakFromChunk(index + 1, speedRef.current);
      };

      utterance.onerror = () => {
        if (stoppedManuallyRef.current) return;
        setPlayback("idle");
        setStatusMessage("Voice playback stopped. Tap PLAY to try again.");
      };

      setPlayback("speaking");
      setStatusMessage(
        `Reading aloud in US English (${chosenSpeed === "slow" ? "Slow" : "Normal"} speed)...`
      );
      window.speechSynthesis.speak(utterance);
    },
    [voices]
  );

  const handlePlay = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setStatusMessage("Please paste text or take a photo first, then tap PLAY.");
      textareaRef.current?.focus();
      return;
    }

    if (!("speechSynthesis" in window)) {
      setStatusMessage("Voice reading is not supported in this browser.");
      return;
    }

    if (playback === "paused") {
      window.speechSynthesis.resume();
      setPlayback("speaking");
      setStatusMessage(
        `Reading aloud in US English (${speed === "slow" ? "Slow" : "Normal"} speed)...`
      );
      return;
    }

    window.speechSynthesis.cancel();
    chunksRef.current = splitIntoChunks(trimmed);
    speakFromChunk(0, speed);
  };

  const handlePause = () => {
    if (!("speechSynthesis" in window) || playback !== "speaking") return;
    window.speechSynthesis.pause();
    setPlayback("paused");
    setStatusMessage("Paused. Tap PLAY to continue listening.");
  };

  const handleStop = () => {
    stopSpeaking();
    setStatusMessage("Stopped. Tap PLAY anytime to read from the beginning.");
  };

  const handleToggleSpeed = () => {
    const nextSpeed: SpeechSpeed = speed === "slow" ? "normal" : "slow";
    setSpeed(nextSpeed);
    speedRef.current = nextSpeed;

    if (playback === "speaking" || playback === "paused") {
      stoppedManuallyRef.current = true;
      window.speechSynthesis.cancel();
      speakFromChunk(chunkIndexRef.current, nextSpeed);
    } else {
      setStatusMessage(
        `Voice speed set to ${nextSpeed === "slow" ? "Slow (Recommended)" : "Normal"}.`
      );
    }
  };

  const handlePaste = async () => {
    stopSpeaking();
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      textareaRef.current?.focus();
      setStatusMessage("Tap inside the white box below and choose Paste.");
      return;
    }
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        setStatusMessage("Your clipboard is empty. Copy some text first, or type below.");
        return;
      }
      setText(clipText);
      setStatusMessage("Text pasted! Tap the green PLAY button to hear it.");
    } catch {
      textareaRef.current?.focus();
      setStatusMessage("Tap inside the white box below and choose Paste.");
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    stopSpeaking();
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      await runOcr(dataUrl);
    } catch {
      setStatusMessage("Could not open that photo. Please try another photo.");
    }
  };

  const handleTrySamplePhoto = async () => {
    stopSpeaking();
    setOcrLoading(true);
    setStatusMessage("Reading words from sample medicine bottle...");
    try {
      const dataUrl = await imageUrlToDataUrl(sampleBottleImg);
      await runOcr(dataUrl);
    } catch {
      setText(
        "RX: 409281. PATIENT: ANNA MILLER. LISINOPRIL 10MG TABLETS. TAKE ONE TABLET BY MOUTH EVERY MORNING WITH FOOD. QTY: 30 TABLETS. DR. MARGARET CHEN."
      );
      setOcrLoading(false);
      setStatusMessage("Sample label loaded! Tap the green PLAY button to listen.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <ScreenHeader
        title="Read Text Aloud"
        onBack={() => {
          stopSpeaking();
          onBack();
        }}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
        {/* Step 1: Input Options */}
        <section
          aria-label="Add text or choose a photo"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrLoading}
              className="flex min-h-[76px] items-center justify-center gap-3 rounded-2xl border-[3px] border-black bg-[#0A3678] px-6 py-4 text-[22px] font-bold text-white transition-colors hover:bg-[#082B61] active:scale-[0.99] disabled:opacity-50 sm:text-[24px]"
            >
              <Camera className="h-8 w-8 shrink-0 stroke-[2.5]" aria-hidden="true" />
              <span>{ocrLoading ? "Reading Photo..." : "Take Photo of Text"}</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={ocrLoading}
              className="flex min-h-[76px] items-center justify-center gap-3 rounded-2xl border-[3px] border-black bg-white px-6 py-4 text-[22px] font-bold text-black transition-colors hover:bg-slate-100 active:scale-[0.99] disabled:opacity-50 sm:text-[24px]"
            >
              <ImagePlus className="h-8 w-8 shrink-0 stroke-[2.5] text-[#0A3678]" aria-hidden="true" />
              <span>{ocrLoading ? "Reading Photo..." : "Upload Photo from Gallery"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePaste}
            className="flex min-h-[76px] items-center justify-center gap-3 rounded-2xl border-[3px] border-black bg-[#C2410C] px-6 py-4 text-[22px] font-bold text-white transition-colors hover:bg-[#9A3412] active:scale-[0.99] sm:h-full sm:text-[24px]"
          >
            <ClipboardPaste className="h-8 w-8 shrink-0 stroke-[2.5]" aria-hidden="true" />
            <span>Paste Copied Text</span>
          </button>
        </section>

        {/* Status Banner */}
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border-2 border-black bg-slate-50 px-5 py-4 text-[22px] font-bold text-black"
        >
          {statusMessage}
        </div>

        {/* Large Textarea */}
        <section aria-label="Text to read" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="read-aloud-textarea"
              className="font-display text-[24px] font-extrabold text-black"
            >
              Words to Read Aloud
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {!text.trim() && (
                <button
                  type="button"
                  onClick={handleTrySamplePhoto}
                  disabled={ocrLoading}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2 text-[20px] font-bold text-black hover:bg-slate-100 disabled:opacity-50"
                >
                  <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  <span>Try Sample Bottle</span>
                </button>
              )}
              {text.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setText("");
                    setStatusMessage("Cleared. Paste text or take a photo anytime.");
                  }}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2 text-[20px] font-bold text-black hover:bg-slate-100"
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                  <span>Clear Text</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            id="read-aloud-textarea"
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              if (playback !== "idle") stopSpeaking();
              setText(e.target.value);
            }}
            placeholder="Paste a text message here, type words, or tap 'Take Photo of Text' above..."
            rows={6}
            className="min-h-[210px] w-full rounded-3xl border-[3px] border-black bg-white p-5 text-[24px] font-medium leading-relaxed text-black placeholder:text-neutral-600"
          />
        </section>

        {/* Playback Controls */}
        <section aria-label="Voice controls" className="flex flex-col gap-4 pb-4">
          <button
            type="button"
            onClick={handlePlay}
            disabled={ocrLoading}
            className="flex min-h-[88px] w-full items-center justify-center gap-4 rounded-3xl border-[3px] border-black bg-[#15803D] px-6 py-4 text-[28px] font-extrabold text-white transition-colors hover:bg-[#166534] active:scale-[0.99] disabled:opacity-50 sm:text-[32px]"
          >
            <Play className="h-9 w-9 shrink-0 fill-white stroke-white" aria-hidden="true" />
            <span>{playback === "paused" ? "RESUME" : "PLAY"}</span>
          </button>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={handlePause}
              disabled={playback !== "speaking"}
              className="flex min-h-[76px] items-center justify-center gap-3 rounded-2xl border-[3px] border-black bg-white px-5 py-4 text-[24px] font-extrabold text-black transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <Pause className="h-8 w-8 shrink-0 stroke-[2.75]" aria-hidden="true" />
              <span>PAUSE</span>
            </button>

            <button
              type="button"
              onClick={handleStop}
              disabled={playback === "idle"}
              className="flex min-h-[76px] items-center justify-center gap-3 rounded-2xl border-[3px] border-black bg-white px-5 py-4 text-[24px] font-extrabold text-black transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <Square className="h-7 w-7 shrink-0 fill-black stroke-black" aria-hidden="true" />
              <span>STOP</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSpeed}
              className="flex min-h-[76px] items-center justify-center gap-3 rounded-2xl border-[3px] border-black bg-[#0A3678] px-5 py-4 text-[24px] font-extrabold text-white transition-colors hover:bg-[#082B61] active:scale-[0.99]"
            >
              <Gauge className="h-8 w-8 shrink-0 stroke-[2.5]" aria-hidden="true" />
              <span>SPEED: {speed === "slow" ? "Slow" : "Normal"}</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
