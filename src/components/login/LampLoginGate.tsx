import React, { useCallback, useState } from 'react';
import './lampTheme.css';
import { Lamp } from './Lamp';
import { Cord } from './Cord';
import { LoginCard } from './LoginCard';

interface LampLoginGateProps {
  onAuthenticated: () => void;
}

export const LampLoginGate: React.FC<LampLoginGateProps> = ({ onAuthenticated }) => {
  const [isLit, setIsLit] = useState(false);
  const [mouseNorm, setMouseNorm] = useState({ x: 0, y: 0 });

  const handleToggleLamp = useCallback(() => {
    setIsLit((prev) => !prev);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMouseNorm({
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny))
    });
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setMouseNorm({ x: 0, y: 0 })}
      className="relative h-screen w-screen overflow-y-auto overflow-x-hidden flex flex-col justify-between"
      style={{ backgroundColor: 'var(--lamp-bg-dark)' }}
    >
      {/* Dark State Ambient Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 transition-opacity duration-700 ease-out"
        style={{
          opacity: isLit ? 0 : 1,
          background:
            'radial-gradient(55% 60% at 32% 45%, var(--lamp-bg-dark-radial) 0%, var(--lamp-bg-dark) 100%)'
        }}
      />

      {/* Lit State Warm Brown Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 transition-opacity duration-700 ease-out"
        style={{
          opacity: isLit ? 1 : 0,
          background:
            'radial-gradient(58% 68% at 28% 42%, var(--lamp-bg-lit-core) 0%, var(--lamp-bg-lit-mid) 52%, var(--lamp-bg-lit-edge) 100%)'
        }}
      />

      {/* Top-Left Studio Wordmark */}
      <header className="pointer-events-none relative z-20 w-full max-w-6xl mx-auto px-6 pt-6 sm:pt-8">
        <p
          className="text-[11.5px] font-semibold uppercase tracking-[0.26em] transition-colors duration-500"
          style={{
            color: isLit ? '#F8F1E7' : 'rgba(255, 255, 255, 0.88)'
          }}
        >
          SWASTI <span className="font-normal opacity-80">STUDIO</span>
        </p>
      </header>

      {/* Main Responsive Stage: Side-by-side on Desktop, Lamp above Card on Mobile */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 pb-10 pt-2 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-6 lg:gap-10">
        {/* Left: 3D Lamp + Pull Cord */}
        <div className="relative w-full lg:w-[50%] h-[420px] sm:h-[500px] lg:h-[560px] flex items-center justify-center flex-shrink-0">
          <Lamp isLit={isLit} mouseNorm={mouseNorm} />
          <Cord isLit={isLit} onToggle={handleToggleLamp} />
        </div>

        {/* Right: Glass Login Card */}
        <div className="w-full lg:w-[46%] flex items-center justify-center lg:justify-end">
          <LoginCard isLit={isLit} onSuccess={onAuthenticated} />
        </div>
      </main>
    </div>
  );
};
