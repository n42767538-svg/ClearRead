import { useEffect, useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { MagnifierScreen } from "./components/MagnifierScreen";
import { MakeTextBiggerScreen } from "./components/MakeTextBiggerScreen";
import { ReadAloudScreen } from "./components/ReadAloudScreen";
import { UpgradeModal } from "./components/UpgradeModal";
import type { AppScreen } from "./types";

const PRO_STORAGE_KEY = "clearread_pro_unlocked";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(PRO_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingOcrImage, setPendingOcrImage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  const handleCompletePurchase = () => {
    setIsPro(true);
    try {
      window.localStorage.setItem(PRO_STORAGE_KEY, "true");
    } catch {
      // Ignore storage failures in private browsing
    }
  };

  const handleReadFrozenText = (imageDataUrl: string) => {
    setPendingOcrImage(imageDataUrl);
    setScreen("reader");
  };

  return (
    <>
      {screen === "home" && (
        <HomeScreen
          onNavigate={setScreen}
          isPro={isPro}
          onOpenUpgrade={() => setShowUpgradeModal(true)}
        />
      )}

      {screen === "magnifier" && (
        <MagnifierScreen
          onBack={() => setScreen("home")}
          onReadFrozenText={handleReadFrozenText}
        />
      )}

      {screen === "reader" && (
        <ReadAloudScreen
          onBack={() => setScreen("home")}
          initialPhotoDataUrl={pendingOcrImage}
          onConsumeInitialPhoto={() => setPendingOcrImage(null)}
        />
      )}

      {screen === "settings" && (
        <MakeTextBiggerScreen onBack={() => setScreen("home")} />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onCompletePurchase={handleCompletePurchase}
        />
      )}
    </>
  );
}
