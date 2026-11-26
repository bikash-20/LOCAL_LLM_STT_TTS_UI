import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CordProps {
  isLit: boolean;
  onToggle: () => void;
}

const REST_LENGTH = 94;
const MAX_STRETCH = 72;
const PULL_THRESHOLD = 18;

export const Cord: React.FC<CordProps> = ({ isLit, onToggle }) => {
  const [stretch, setStretch] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const currentStretchRef = useRef(0);
  const velocityRef = useRef(0);
  const animIdRef = useRef<number | null>(null);
  const onToggleRef = useRef(onToggle);

  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  // Damped spring solver back to 0 stretch
  const launchSpringSnap = useCallback((initialVelocity = 0) => {
    if (animIdRef.current !== null) {
      cancelAnimationFrame(animIdRef.current);
    }

    velocityRef.current = initialVelocity;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.032);
      lastTime = now;

      const x = currentStretchRef.current;
      const v = velocityRef.current;

      const stiffness = 290;
      const damping = 13;
      const accel = -stiffness * x - damping * v;

      const nextV = v + accel * dt;
      const nextX = x + nextV * dt;

      currentStretchRef.current = nextX;
      velocityRef.current = nextV;
      setStretch(nextX);

      if (Math.abs(nextX) < 0.25 && Math.abs(nextV) < 1.5) {
        currentStretchRef.current = 0;
        velocityRef.current = 0;
        setStretch(0);
        animIdRef.current = null;
        return;
      }

      animIdRef.current = requestAnimationFrame(step);
    };

    animIdRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    return () => {
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (animIdRef.current !== null) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }

    draggingRef.current = true;
    setIsDragging(true);
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    const rawDelta = Math.max(0, e.clientY - startYRef.current);
    // Slight rubbery resistance as it stretches further
    const dampedStretch = Math.min(MAX_STRETCH, rawDelta * 0.78);
    currentStretchRef.current = dampedStretch;
    setStretch(dampedStretch);
  };

  const finishPull = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const totalDelta = e.clientY - startYRef.current;
    const wasClick = Math.abs(totalDelta) < 6;
    const pulledEnough = currentStretchRef.current >= PULL_THRESHOLD;

    if (wasClick) {
      // Give a brisk downward tug then spring snap
      currentStretchRef.current = 30;
      setStretch(30);
      onToggleRef.current();
      launchSpringSnap(180);
      return;
    }

    if (pulledEnough) {
      onToggleRef.current();
    }
    launchSpringSnap(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      currentStretchRef.current = 28;
      setStretch(28);
      onToggle();
      launchSpringSnap(160);
    }
  };

  const cordHeight = Math.max(48, REST_LENGTH + stretch);

  return (
    <div
      className="absolute z-20 flex items-end select-none"
      style={{
        left: 'calc(50% + 26px)',
        top: '31%'
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={isLit}
        aria-label={isLit ? 'Pull cord to turn lamp off' : 'Pull cord to turn lamp on'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPull}
        onPointerCancel={finishPull}
        onKeyDown={handleKeyDown}
        className="group relative flex flex-col items-center px-3 pb-3 pt-0 cursor-grab active:cursor-grabbing focus:outline-none touch-none"
      >
        {/* Vertical Cord Thread */}
        <div
          className="w-[1.75px] rounded-full transition-colors duration-300"
          style={{
            height: `${cordHeight}px`,
            background: isLit
              ? 'linear-gradient(180deg, rgba(255, 224, 175, 0.88) 0%, var(--lamp-cord) 100%)'
              : 'linear-gradient(180deg, rgba(160, 134, 96, 0.55) 0%, var(--lamp-cord-dark) 100%)'
          }}
        />

        {/* Brass Bead */}
        <div
          className={`w-3 h-3 rounded-full transition-transform duration-150 ${
            isDragging ? 'scale-110' : 'group-hover:scale-115'
          }`}
          style={{
            background: isLit
              ? 'radial-gradient(circle at 35% 30%, #fff4db 0%, var(--lamp-bead) 45%, #8a5c24 100%)'
              : 'radial-gradient(circle at 35% 30%, #d4ba8d 0%, #866b43 60%, #423522 100%)',
            boxShadow: isLit
              ? '0 0 12px rgba(255, 198, 110, 0.7)'
              : '0 2px 6px rgba(0, 0, 0, 0.65)'
          }}
        />

        {/* Hint Label next to Bead */}
        <div
          className="pointer-events-none absolute left-full flex items-center gap-2 transition-all duration-300"
          style={{
            bottom: '11px',
            marginLeft: '2px'
          }}
        >
          <span
            className="w-3 sm:w-3.5 h-px flex-shrink-0 transition-colors duration-300"
            style={{
              backgroundColor: isLit ? 'rgba(218, 184, 140, 0.45)' : 'rgba(130, 118, 106, 0.45)'
            }}
          />
          <span
            className="max-w-[96px] sm:max-w-none whitespace-normal sm:whitespace-nowrap text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.22em] leading-snug text-left transition-colors duration-300"
            style={{
              color: isLit ? 'var(--lamp-hint-lit)' : 'var(--lamp-hint-dark)'
            }}
          >
            {isLit ? 'PULL AGAIN FOR DARK' : 'PULL THE CORD'}
          </span>
        </div>
      </button>
    </div>
  );
};
