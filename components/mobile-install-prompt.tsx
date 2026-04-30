"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "gryphon-hub-install-prompt-dismissed";

function isStandaloneDisplay() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isMobileBrowser() {
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function MobileInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android">("android");

  useEffect(() => {
    const promptTimer = window.setTimeout(() => {
      if (
        localStorage.getItem(DISMISS_KEY) === "true" ||
        isStandaloneDisplay() ||
        !isMobileBrowser()
      ) {
        return;
      }

      setPlatform(isIos() ? "ios" : "android");
      setIsVisible(true);
    }, 0);

    return () => window.clearTimeout(promptTimer);
  }, []);

  if (!isVisible) {
    return null;
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsVisible(false);
  }

  return (
    <aside className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-4 text-slate-100 shadow-lg shadow-black/10 md:hidden">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-800 text-slate-200">
          <Download className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Install Gryphon Hub</h2>
          <p className="mt-1 text-sm leading-5 text-slate-400">
            For the best mobile experience, add Gryphon Hub to your home
            screen.
          </p>
          <p className="mt-2 text-sm leading-5 text-slate-300">
            {platform === "ios"
              ? "Tap Share, then Add to Home Screen."
              : "Open the browser menu, then tap Install app."}
          </p>
        </div>
        <button
          aria-label="Dismiss install guidance"
          className="flex size-8 shrink-0 items-center justify-center rounded text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
          onClick={dismiss}
          type="button"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
