import React, { useEffect, useRef } from 'react';

interface VoiceOrbProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  userVolume: number;
  aiVolume: number;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ state, userVolume, aiVolume }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.04;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Read live theme palette variables
      const rootStyles = getComputedStyle(document.documentElement);
      const c1 = rootStyles.getPropertyValue('--c1').trim() || '#9CAF88';
      const c2 = rootStyles.getPropertyValue('--c2').trim() || '#F7F5EF';
      const c3 = rootStyles.getPropertyValue('--c3').trim() || '#E8412C';

      let baseRadius = 80;
      let waveAmp = 10;
      let primaryColor = c1;
      let secondaryColor = c3;
      let glowColor = 'rgba(156, 175, 136, 0.4)';

      if (state === 'listening') {
        baseRadius = 85 + userVolume * 45;
        waveAmp = 15 + userVolume * 35;
        primaryColor = c3; // Color 3 (Tomato / Rose / Peach) for user microphone recording
        secondaryColor = c1;
        glowColor = 'rgba(232, 65, 44, 0.5)';
      } else if (state === 'speaking') {
        baseRadius = 85 + aiVolume * 40;
        waveAmp = 12 + aiVolume * 30;
        primaryColor = c1; // Color 1 (Sage / Mocha / Teal) for AI voice
        secondaryColor = c2;
        glowColor = 'rgba(156, 175, 136, 0.6)';
      } else if (state === 'thinking') {
        baseRadius = 80 + Math.sin(phase * 2) * 8;
        waveAmp = 8;
        primaryColor = c1;
        secondaryColor = c2;
        glowColor = 'rgba(156, 175, 136, 0.3)';
      }

      // Draw background glow
      const gradGlow = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.4, centerX, centerY, baseRadius * 1.8);
      gradGlow.addColorStop(0, glowColor);
      gradGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Draw multiple fluid organic layers
      const layers = 3;
      for (let l = 0; l < layers; l++) {
        ctx.beginPath();
        const layerPhase = phase + l * 0.7;
        const currentRadius = baseRadius - l * 8;
        const points = 60;

        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const offset = Math.sin(angle * 4 + layerPhase) * Math.cos(angle * 3 - layerPhase) * waveAmp;
          const r = currentRadius + offset;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();
        const alpha = 0.4 - l * 0.1;
        ctx.fillStyle = l === 0 ? primaryColor : (l === 1 ? secondaryColor : c2);
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = primaryColor;
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, userVolume, aiVolume]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={360}
        height={360}
        className="w-72 h-72 sm:w-80 sm:h-80"
      />
    </div>
  );
};
