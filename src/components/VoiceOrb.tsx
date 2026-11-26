import React, { useEffect, useRef } from 'react';

interface VoiceOrbProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  userVolume: number;
  aiVolume: number;
}

function toRgba(cssColor: string, alpha: number): string {
  const c = cssColor.trim();
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(ch => ch + ch).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  const rgbMatch = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }
  return `rgba(180, 140, 110, ${alpha})`;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ state, userVolume, aiVolume }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const userVolRef = useRef(userVolume);
  const aiVolRef = useRef(aiVolume);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    userVolRef.current = userVolume;
  }, [userVolume]);

  useEffect(() => {
    aiVolRef.current = aiVolume;
  }, [aiVolume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let animId: number;
    let phase = 0;
    let smoothVol = 0;

    const render = () => {
      const curState = stateRef.current;
      const targetVol = curState === 'listening' ? userVolRef.current : curState === 'speaking' ? aiVolRef.current : 0;
      smoothVol += (targetVol - smoothVol) * 0.18;

      phase += curState === 'thinking' ? 0.045 : curState === 'idle' ? 0.018 : 0.032;

      const centerX = size / 2;
      const centerY = size / 2;
      ctx.clearRect(0, 0, size, size);

      const rootStyles = getComputedStyle(document.documentElement);
      const c1 = rootStyles.getPropertyValue('--c1').trim() || '#4A3524';
      const c2 = rootStyles.getPropertyValue('--c2').trim() || '#E0D1BF';
      const c3 = rootStyles.getPropertyValue('--c3').trim() || '#B05B3B';

      const baseRadius =
        curState === 'listening'
          ? 68 + smoothVol * 28
          : curState === 'speaking'
            ? 68 + smoothVol * 26
            : curState === 'thinking'
              ? 64 + Math.sin(phase * 1.8) * 5
              : 64 + Math.sin(phase) * 2.5;

      const waveAmp =
        curState === 'listening'
          ? 4 + smoothVol * 14
          : curState === 'speaking'
            ? 3.5 + smoothVol * 12
            : curState === 'thinking'
              ? 4
              : 1.5;

      const accent = curState === 'listening' ? c3 : c1;
      const warmEdge = curState === 'listening' ? c1 : c3;

      // Soft ambient outer halo derived strictly from active palette
      const haloGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.4,
        centerX,
        centerY,
        baseRadius * 1.95
      );
      haloGrad.addColorStop(0, toRgba(accent, curState === 'idle' ? 0.24 : 0.36));
      haloGrad.addColorStop(0.55, toRgba(warmEdge, curState === 'idle' ? 0.10 : 0.16));
      haloGrad.addColorStop(1, toRgba(c2, 0));

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.95, 0, Math.PI * 2);
      ctx.fill();

      // Subtle outer resonance ring during active states
      if (curState !== 'idle') {
        const ringScale = 1.24 + (curState === 'thinking' ? Math.sin(phase * 2) * 0.06 : smoothVol * 0.22);
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * ringScale, 0, Math.PI * 2);
        ctx.strokeStyle = toRgba(accent, 0.28);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Smooth organic orb body
      const drawOrganicPath = (radiusOffset: number, phaseShift: number, ampScale: number) => {
        const points = 96;
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const wave =
            Math.sin(angle * 3 + phase + phaseShift) * 0.6 +
            Math.cos(angle * 2 - phase * 0.8 + phaseShift) * 0.4;
          const r = baseRadius + radiusOffset + wave * waveAmp * ampScale;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      };

      // Back translucent layer
      drawOrganicPath(5, 1.4, 1.15);
      ctx.fillStyle = toRgba(warmEdge, 0.22);
      ctx.fill();

      // Main 3D-lit gradient sphere
      drawOrganicPath(0, 0, 1);
      const sphereGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.28,
        centerY - baseRadius * 0.30,
        baseRadius * 0.12,
        centerX,
        centerY,
        baseRadius * 1.1
      );
      sphereGrad.addColorStop(0, toRgba(c2, 0.92));
      sphereGrad.addColorStop(0.45, toRgba(c3, 0.78));
      sphereGrad.addColorStop(1, toRgba(c1, 0.92));
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Crisp specular glass rim
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = toRgba(c2, 0.55);
      ctx.stroke();

      // Soft inner core highlight
      const innerGlow = ctx.createRadialGradient(
        centerX - baseRadius * 0.24,
        centerY - baseRadius * 0.26,
        2,
        centerX - baseRadius * 0.12,
        centerY - baseRadius * 0.12,
        baseRadius * 0.68
      );
      innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = innerGlow;
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-60 h-60 sm:w-72 sm:h-72"
      />
    </div>
  );
};
