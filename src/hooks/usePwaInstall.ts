import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'swasti_pwa_install_dismissed_until';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
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
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

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

    // Capture standard PWA beforeinstallprompt event (Chromium, Android, Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return choice.outcome === 'accepted';
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

  return {
    canInstall: !isStandalone && !isInstalled,
    hasNativePrompt: !!deferredPrompt,
    isStandalone,
    isInstalled,
    isIOS,
    isDismissed,
    installApp,
    dismissBanner,
    resetDismissal
  };
}
