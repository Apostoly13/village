import { useState, useEffect } from "react";
import { X } from "lucide-react";

/**
 * Shows an "Add to Home Screen" nudge after the user's second visit.
 * - Chrome/Android: uses the native beforeinstallprompt event
 * - iOS Safari: shows manual instructions (tap Share → Add to Home Screen)
 * - Already installed (standalone mode): never shows
 * - Dismissed: stored in localStorage, never shown again
 */
export default function PWAInstallBanner() {
  const [show, setShow]             = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS]           = useState(false);

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone) return; // iOS standalone

    // Don't show if the user dismissed it before
    if (localStorage.getItem("pwa_banner_dismissed")) return;

    // Track visits — only show from the second visit onwards
    const visits = parseInt(localStorage.getItem("pwa_visit_count") || "0", 10) + 1;
    localStorage.setItem("pwa_visit_count", String(visits));
    if (visits < 2) return;

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    if (iOS) {
      // iOS doesn't fire beforeinstallprompt — show the manual instructions
      setShow(true);
    } else {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShow(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_banner_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-4 left-3 right-3 lg:left-auto lg:right-4 lg:w-80 z-40 animate-fade-in">
      <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xl flex items-start gap-3">
        {/* App icon */}
        <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/BG Removed- Main Logo.png" alt="The Village" className="w-full h-full object-cover" />
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight mb-0.5">
            Add to your home screen
          </p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tap <strong className="text-foreground">Share</strong> then{" "}
              <strong className="text-foreground">Add to Home Screen</strong> for instant access.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                Install The Village for faster access, even when you're offline.
              </p>
              <button
                onClick={handleInstall}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Install now →
              </button>
            </>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
