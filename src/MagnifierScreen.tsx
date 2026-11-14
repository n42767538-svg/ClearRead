import {
  Camera,
  Contrast,
  Flashlight,
  Image as ImageIcon,
  ImagePlus,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sun,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import sampleBottleImg from "../assets/images/sample_medicine_label_1794639095356.jpg";
import { ScreenHeader } from "./ScreenHeader";

interface MagnifierScreenProps {
  onBack: () => void;
  onReadFrozenText: (imageDataUrl: string) => void;
}

type PreviewSource = "camera" | "sample" | "uploaded";

export function MagnifierScreen({
  onBack,
  onReadFrozenText,
}: MagnifierScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  const [source, setSource] = useState<PreviewSource>("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const [zoom, setZoom] = useState(1.5);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [bwFilterOn, setBwFilterOn] = useState(false);
  const [frozenImageUrl, setFrozenImageUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Automatically keep screen awake and at maximum brightness boost while Magnifier is open
  useEffect(() => {
    let active = true;
    const navWithWakeLock = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
    };

    if (navWithWakeLock.wakeLock?.request) {
      navWithWakeLock.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (active) {
            wakeLockRef.current = sentinel;
          } else {
            sentinel.release().catch(() => {});
          }
        })
        .catch(() => {
          // Wake lock not permitted; bright white border boost still remains active
        });
    }

    return () => {
      active = false;
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore stop errors
        }
      });
      streamRef.current = null;
    }
    setCameraReady(false);
    setTorchSupported(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setSource("camera");
    setFrozenImageUrl(null);
    setPan({ x: 0, y: 0 });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Camera preview is not available in this browser. You can test the magnifier using the sample medicine bottle or a photo."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === "function") {
        const caps = videoTrack.getCapabilities() as MediaTrackCapabilities & {
          torch?: boolean;
        };
        setTorchSupported(Boolean(caps.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setCameraError(
        "Camera access was declined or no camera was found. You can still test zooming, B&W contrast, and reading with the sample medicine bottle below."
      );
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream || source !== "camera" || !torchSupported) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack || typeof videoTrack.applyConstraints !== "function") return;

    videoTrack
      .applyConstraints({
        advanced: [{ torch: flashlightOn } as MediaTrackConstraintSet],
      })
      .catch(() => {
        // Fallback to screen brightness boost silently if hardware torch rejects
      });
  }, [flashlightOn, source, torchSupported]);

  const handleZoomChange = (nextZoom: number) => {
    const clamped = Math.min(8, Math.max(1, Number(nextZoom.toFixed(1))));
    setZoom(clamped);
    if (clamped === 1) {
      setPan({ x: 0, y: 0 });
    }
  };

  const captureCurrentFrameDataUrl = (): string | null => {
    if (source === "camera" && videoRef.current && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.92);
    }

    const activeSrc = source === "sample" ? sampleBottleImg : uploadedImageUrl;
    if (!activeSrc) return null;

    const imgEl = document.getElementById("magnifier-static-img") as HTMLImageElement | null;
    if (imgEl && imgEl.naturalWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.92);
      }
    }

    return activeSrc;
  };

  const handleToggleFreeze = () => {
    if (frozenImageUrl) {
      setFrozenImageUrl(null);
      return;
    }
    const snapshot = captureCurrentFrameDataUrl();
    if (snapshot) {
      setFrozenImageUrl(snapshot);
    }
  };

  const handleUseSample = () => {
    stopCamera();
    setCameraError(null);
    setSource("sample");
    setFrozenImageUrl(null);
    setPan({ x: 0, y: 0 });
    setZoom(2.0);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        stopCamera();
        setCameraError(null);
        setUploadedImageUrl(reader.result);
        setSource("uploaded");
        setFrozenImageUrl(null);
        setPan({ x: 0, y: 0 });
        setZoom(1.0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || zoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const maxOffset = (zoom - 1) * 140;
    setPan({
      x: Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.panX + dx)),
      y: Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.panY + dy)),
    });
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
  };

  const activeStaticSrc =
    frozenImageUrl ??
    (source === "sample" ? sampleBottleImg : source === "uploaded" ? uploadedImageUrl : null);

  const showLiveVideo = source === "camera" && !frozenImageUrl && !cameraError;

  // Combined visual filter for Black & White High-Contrast + Flashlight Brightness Boost
  const previewFilter = [
    bwFilterOn ? "grayscale(100%) contrast(215%)" : "",
    flashlightOn ? "brightness(1.32) contrast(1.12)" : bwFilterOn ? "brightness(1.08)" : "",
  ]
    .filter(Boolean)
    .join(" ") || "none";

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <ScreenHeader
        title="Magnifier & Light"
        onBack={() => {
          stopCamera();
          onBack();
        }}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
        {/* Automatic Bright White Screen Boost Frame */}
        <section
          aria-label="Magnifier preview with bright screen illumination border"
          className={`rounded-[32px] border-[4px] border-black bg-white p-3 shadow-[0_0_0_6px_#FFFFFF,0_10px_28px_rgba(0,0,0,0.14)] sm:p-4 ${
            flashlightOn ? "ring-4 ring-amber-300" : ""
          }`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 text-[20px] font-bold text-black">
            <span className="inline-flex items-center gap-2">
              <Sun className="h-6 w-6 text-[#C2410C] stroke-[2.75]" aria-hidden="true" />
              <span>Bright Screen Light Active</span>
            </span>
            {bwFilterOn && <span>High-Contrast Black &amp; White ON</span>}
          </div>

          <div className="overflow-hidden rounded-2xl border-[3px] border-black bg-neutral-950">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative flex h-[340px] w-full items-center justify-center overflow-hidden sm:h-[430px] ${
                zoom > 1 ? "cursor-grab active:cursor-grabbing touch-none" : ""
              }`}
            >
              {cameraError && source === "camera" && !frozenImageUrl ? (
                <div className="flex max-w-xl flex-col items-center gap-5 p-6 text-center text-white">
                  <Camera className="h-12 w-12 text-amber-300" aria-hidden="true" />
                  <p className="text-[22px] font-semibold leading-relaxed">
                    {cameraError}
                  </p>
                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={handleUseSample}
                      className="min-h-[64px] rounded-2xl border-2 border-white bg-[#0A3678] px-6 py-3 text-[22px] font-bold text-white hover:bg-[#082B61]"
                    >
                      Use Sample Medicine Bottle
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[64px] rounded-2xl border-2 border-white bg-[#C2410C] px-6 py-3 text-[22px] font-bold text-white hover:bg-[#9A3412]"
                    >
                      Upload Photo from Gallery
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="min-h-[54px] rounded-xl border border-white/60 px-5 py-2 text-[20px] font-semibold text-white hover:bg-white/10"
                  >
                    Try Camera Again
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      filter: previewFilter,
                    }}
                    className={`h-full w-full object-cover transition-transform duration-100 ${
                      showLiveVideo ? "block" : "hidden"
                    }`}
                  />

                  {activeStaticSrc && (
                    <img
                      id="magnifier-static-img"
                      src={activeStaticSrc}
                      alt={
                        frozenImageUrl
                          ? "Frozen magnified view"
                          : "Magnified bottle or document photo"
                      }
                      referrerPolicy="no-referrer"
                      draggable={false}
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        filter: previewFilter,
                      }}
                      className="h-full w-full select-none object-contain transition-transform duration-100"
                    />
                  )}

                  {source === "camera" && !cameraReady && !cameraError && (
                    <p className="absolute text-[24px] font-bold text-white">
                      Starting camera...
                    </p>
                  )}
                </>
              )}
            </div>

            {/* High-Contrast Status Strip Below Preview */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-white px-5 py-3 text-[20px] font-bold text-black">
              <span>
                {frozenImageUrl
                  ? "Image Frozen (Steady to read)"
                  : source === "camera" && cameraReady
                  ? "Live Camera Active"
                  : source === "sample"
                  ? "Sample Medicine Bottle"
                  : source === "uploaded"
                  ? "Uploaded Photo"
                  : "Waiting for Camera"}
              </span>
              <div className="flex flex-wrap items-center gap-4">
                {zoom > 1 && (pan.x !== 0 || pan.y !== 0) && (
                  <button
                    type="button"
                    onClick={() => setPan({ x: 0, y: 0 })}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-black bg-slate-100 px-3 py-1 text-[19px] font-bold text-black hover:bg-slate-200"
                  >
                    <RotateCcw className="h-5 w-5" aria-hidden="true" />
                    <span>Center View</span>
                  </button>
                )}
                <span className="tabular-nums text-[#0A3678]">
                  Zoom: {zoom.toFixed(1)}x
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Large Zoom Slider + Step Buttons */}
        <section
          aria-label="Zoom control"
          className="rounded-3xl border-2 border-black bg-slate-50 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="zoom-slider"
              className="font-display text-[24px] font-extrabold text-black sm:text-[26px]"
            >
              Zoom Size (1x to 8x)
            </label>
            <span className="font-display text-[28px] font-extrabold tabular-nums text-[#0A3678]">
              {zoom.toFixed(1)}x
            </span>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.5)}
              disabled={zoom <= 1}
              aria-label="Zoom out"
              className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-white text-black transition-colors hover:bg-slate-200 disabled:opacity-40"
            >
              <Minus className="h-8 w-8 stroke-[3]" aria-hidden="true" />
            </button>

            <input
              id="zoom-slider"
              type="range"
              min={1}
              max={8}
              step={0.5}
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="senior-slider"
            />

            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.5)}
              disabled={zoom >= 8}
              aria-label="Zoom in"
              className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-white text-black transition-colors hover:bg-slate-200 disabled:opacity-40"
            >
              <Plus className="h-8 w-8 stroke-[3]" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-3 text-[20px] font-medium text-neutral-800">
            {zoom > 1
              ? "Tip: Drag your finger across the picture to look around."
              : "Slide right or tap + to make small print larger."}
          </p>
        </section>

        {/* Flashlight & Black & White Filter Side-by-Side */}
        <section
          aria-label="Light and contrast controls"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          <button
            type="button"
            onClick={() => setFlashlightOn((prev) => !prev)}
            aria-pressed={flashlightOn}
            className={`flex min-h-[84px] items-center justify-center gap-4 rounded-3xl border-[3px] border-black px-6 py-4 text-[24px] font-extrabold transition-colors active:scale-[0.99] sm:text-[26px] ${
              flashlightOn
                ? "bg-amber-300 text-black hover:bg-amber-400"
                : "bg-white text-black hover:bg-slate-100"
            }`}
          >
            <Flashlight className="h-8 w-8 shrink-0 stroke-[2.75]" aria-hidden="true" />
            <span>{flashlightOn ? "Flashlight: ON" : "Flashlight: OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setBwFilterOn((prev) => !prev)}
            aria-pressed={bwFilterOn}
            className={`flex min-h-[84px] items-center justify-center gap-4 rounded-3xl border-[3px] border-black px-6 py-4 text-[24px] font-extrabold transition-colors active:scale-[0.99] sm:text-[26px] ${
              bwFilterOn
                ? "bg-black text-white hover:bg-neutral-800"
                : "bg-white text-black hover:bg-slate-100"
            }`}
          >
            <Contrast className="h-8 w-8 shrink-0 stroke-[2.75]" aria-hidden="true" />
            <span>{bwFilterOn ? "Black & White: ON" : "Black & White Filter"}</span>
          </button>
        </section>

        {/* Primary Freeze Frame Button */}
        <button
          type="button"
          onClick={handleToggleFreeze}
          disabled={source === "camera" && !cameraReady && !frozenImageUrl}
          className={`flex min-h-[84px] w-full items-center justify-center gap-4 rounded-3xl border-[3px] border-black px-6 py-4 text-[24px] font-extrabold text-white transition-colors active:scale-[0.99] disabled:opacity-40 sm:text-[28px] ${
            frozenImageUrl
              ? "bg-[#C2410C] hover:bg-[#9A3412]"
              : "bg-[#0A3678] hover:bg-[#082B61]"
          }`}
        >
          {frozenImageUrl ? (
            <>
              <Play className="h-8 w-8 shrink-0 stroke-[2.75]" aria-hidden="true" />
              <span>Resume Live View</span>
            </>
          ) : (
            <>
              <Pause className="h-8 w-8 shrink-0 stroke-[2.75]" aria-hidden="true" />
              <span>Freeze Frame</span>
            </>
          )}
        </button>

        {/* Read Frozen Text Aloud */}
        {frozenImageUrl && (
          <button
            type="button"
            onClick={() => onReadFrozenText(frozenImageUrl)}
            className="flex min-h-[76px] w-full items-center justify-center gap-4 rounded-3xl border-[3px] border-black bg-[#15803D] px-6 py-4 text-[24px] font-extrabold text-white transition-colors hover:bg-[#166534] active:scale-[0.99]"
          >
            <Volume2 className="h-8 w-8 shrink-0 stroke-[2.75]" aria-hidden="true" />
            <span>Read Frozen Text Aloud</span>
          </button>
        )}

        {/* Gallery Upload, Sample Bottle & Back to Live Camera */}
        <section
          aria-label="Photo source options"
          className="flex flex-col gap-4 border-t-2 border-black/15 pt-5"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[76px] items-center justify-center gap-3 rounded-3xl border-[3px] border-black bg-[#C2410C] px-6 py-4 text-[22px] font-extrabold text-white transition-colors hover:bg-[#9A3412] active:scale-[0.99] sm:text-[24px]"
            >
              <ImagePlus className="h-7 w-7 shrink-0 stroke-[2.75]" aria-hidden="true" />
              <span>Upload Photo from Gallery</span>
            </button>

            {source !== "sample" ? (
              <button
                type="button"
                onClick={handleUseSample}
                className="flex min-h-[76px] items-center justify-center gap-3 rounded-3xl border-[3px] border-black bg-white px-6 py-4 text-[22px] font-extrabold text-black transition-colors hover:bg-slate-100 active:scale-[0.99] sm:text-[24px]"
              >
                <ImageIcon className="h-7 w-7 shrink-0 stroke-[2.75]" aria-hidden="true" />
                <span>Try Sample Medicine Bottle</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                className="flex min-h-[76px] items-center justify-center gap-3 rounded-3xl border-[3px] border-black bg-[#0A3678] px-6 py-4 text-[22px] font-extrabold text-white transition-colors hover:bg-[#082B61] active:scale-[0.99] sm:text-[24px]"
              >
                <Camera className="h-7 w-7 shrink-0 stroke-[2.75]" aria-hidden="true" />
                <span>Back to Live Camera</span>
              </button>
            )}
          </div>

          {source === "uploaded" && (
            <button
              type="button"
              onClick={startCamera}
              className="flex min-h-[76px] w-full items-center justify-center gap-3 rounded-3xl border-[3px] border-black bg-[#0A3678] px-6 py-4 text-[22px] font-extrabold text-white transition-colors hover:bg-[#082B61] active:scale-[0.99] sm:text-[24px]"
            >
              <Camera className="h-7 w-7 shrink-0 stroke-[2.75]" aria-hidden="true" />
              <span>Back to Live Camera</span>
            </button>
          )}

          {flashlightOn && !torchSupported && (
            <p className="text-[20px] font-medium text-neutral-800">
              Extra bright screen light active (device camera flash not detected).
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
