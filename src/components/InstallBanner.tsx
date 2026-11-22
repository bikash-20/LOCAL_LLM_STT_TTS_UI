import React, { useState } from 'react';
import { Download, X, Sparkles, Share2, PlusSquare, Smartphone, Check } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

export const InstallBanner: React.FC = () => {
  const {
    canShowBanner,
    hasNativePrompt,
    isIOS,
    installApp,
    dismissBanner
  } = usePwaInstall();

  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already installed, running in standalone mode, dismissed, or on desktop without prompt, do not show
  if (!canShowBanner) {
    return null;
  }

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const accepted = await installApp();
      if (accepted) {
        setInstalledSuccess(true);
        setTimeout(() => dismissBanner(365), 2500);
      }
    } else if (isIOS) {
      setShowIOSGuide((prev) => !prev);
    }
  };

  return (
    <div
      className="mx-3 sm:mx-6 my-2.5 rounded-2xl border p-3.5 sm:p-4 transition-all duration-300 shadow-lg relative overflow-hidden animate-fadeIn"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Decorative subtle background tint */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: 'linear-gradient(135deg, var(--c1) 0%, var(--c3) 100%)'
        }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: App Logo Icon + Text Recommendation */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {/* App Logo with 🌸 Flower and Swasti AI */}
          <div className="relative flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden shadow-md border" style={{ borderColor: 'var(--border-color)' }}>
            <img
              src="/favicon.svg"
              alt="Swasti 🌸 Logo"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-[15px] sm:text-[16px] tracking-tight font-sans flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <span>Install Swasti 🌸 AI</span>
              </h3>
              <span
                className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase border flex items-center gap-1"
                style={{
                  backgroundColor: 'rgba(156, 175, 136, 0.15)',
                  borderColor: 'var(--c1)',
                  color: 'var(--c1)'
                }}
              >
                <Sparkles className="w-3 h-3" />
                <span>Recommended</span>
              </span>
            </div>

            <p className="text-[12.5px] sm:text-[13px] font-medium leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
              {isIOS
                ? 'Add Swasti 🌸 to your Home Screen for full-screen voice conversations and offline speed.'
                : 'Install as a native desktop or mobile app for instant offline launch, standalone window, and realistic voice chats.'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          {installedSuccess ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs" style={{ backgroundColor: 'rgba(156, 175, 136, 0.2)', color: 'var(--c1)' }}>
              <Check className="w-4 h-4" />
              <span>Installed!</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] sm:text-[13.5px] font-extrabold text-white transition-all shadow-md hover:scale-[1.02] active:scale-95"
              style={{
                backgroundColor: 'var(--c1)'
              }}
              title={isIOS ? 'Show iOS install guide' : 'Install Swasti 🌸 application'}
            >
              <Download className="w-4 h-4" />
              <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
            </button>
          )}

          <button
            onClick={() => dismissBanner(7)}
            className="p-2 rounded-xl transition-colors hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
            title="Dismiss install recommendation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Manual Install Guide ONLY for iOS Safari */}
      {isIOS && showIOSGuide && (
        <div
          className="mt-3.5 pt-3.5 border-t text-[12.5px] sm:text-[13px] space-y-2 animate-fadeIn"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="space-y-1.5">
            <p className="font-bold flex items-center gap-1.5" style={{ color: 'var(--c1)' }}>
              <Smartphone className="w-4 h-4" />
              <span>How to Install on iPhone / iPad (Safari):</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-1" style={{ color: 'var(--text-secondary)' }}>
              <li>
                Tap the <strong className="font-bold">Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1" style={{ color: 'var(--c1)' }} /> in Safari's bottom toolbar.
              </li>
              <li>
                Scroll down the share sheet and tap <strong className="font-bold">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1" style={{ color: 'var(--c1)' }} />.
              </li>
              <li>
                Tap <strong className="font-bold">Add</strong> in the top-right corner. Swasti 🌸 will appear on your Home Screen!
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
