import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'swasti_pwa_install_dismissed_until';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return (window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }).__deferredPrompt || null;
  });
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone display mode (PWA installed and active)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // Check if Chrome / system has already installed the app
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> })
        .getInstalledRelatedApps()
        .then((apps) => {
          if (apps && apps.length > 0) {
            setIsInstalled(true);
          }
        })
        .catch(() => {});
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Check dismissal status in localStorage
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setIsDismissed(true);
      }
    } catch (e) {
      console.warn('Could not read install dismissal state:', e);
    }

    // Capture early or live prompt event
    const handlePromptReady = () => {
      const prompt = (window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }).__deferredPrompt;
      if (prompt) {
        setDeferredPrompt(prompt);
      }
    };

    // Live beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as unknown as { __deferredPrompt?: Event }).__deferredPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // App installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as unknown as { __deferredPrompt?: null }).__deferredPrompt = null;
    };

    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    const promptEvent =
      deferredPrompt || (window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }).__deferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          (window as unknown as { __deferredPrompt?: null }).__deferredPrompt = null;
          return true;
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    }
    return false;
  }, [deferredPrompt]);

  const dismissBanner = useCallback((days = 7) => {
    setIsDismissed(true);
    try {
      const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(expiry));
    } catch (e) {
      console.warn('Could not save install dismissal:', e);
    }
  }, []);

  const resetDismissal = useCallback(() => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch (e) {
      console.warn('Could not remove install dismissal:', e);
    }
  }, []);

  const hasNativePrompt = !!deferredPrompt || !!(window as unknown as { __deferredPrompt?: unknown }).__deferredPrompt;

  // IMPORTANT: On desktop, we only show the install recommendation banner if the browser has
  // a real native prompt ready, or on iOS where step-by-step guidance is expected.
  // If the app is already installed, or if dismissed, we NEVER show it.
  const canShowBanner = !isStandalone && !isInstalled && !isDismissed && (hasNativePrompt || isIOS);

  return {
    canInstall: !isStandalone && !isInstalled,
    canShowBanner,
    hasNativePrompt,
    isStandalone,
    isInstalled,
    isIOS,
    isDismissed,
    installApp,
    dismissBanner,
    resetDismissal
  };
}
