"use client";

import { useEffect } from "react";

const SERVICE_WORKER_URL = "/sw.js";
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;
const APP_CACHE_PREFIX = "gryphon-hub-";

async function clearDevelopmentServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map((registration) => registration.unregister())
  );

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(APP_CACHE_PREFIX))
        .map((cacheName) => caches.delete(cacheName))
    );
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      void clearDevelopmentServiceWorkers();
      return;
    }

    let intervalId: number | undefined;

    async function registerServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register(
          SERVICE_WORKER_URL,
          { scope: "/" }
        );

        await registration.update();

        intervalId = window.setInterval(() => {
          void registration.update();
        }, UPDATE_INTERVAL_MS);

        const updateWhenVisible = () => {
          if (document.visibilityState === "visible") {
            void registration.update();
          }
        };

        document.addEventListener("visibilitychange", updateWhenVisible);

        return () => {
          document.removeEventListener("visibilitychange", updateWhenVisible);
        };
      } catch {
        return undefined;
      }
    }

    let removeVisibilityListener: (() => void) | undefined;

    void registerServiceWorker().then((cleanup) => {
      removeVisibilityListener = cleanup;
    });

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      removeVisibilityListener?.();
    };
  }, []);

  return null;
}
