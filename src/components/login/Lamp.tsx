import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface LampProps {
  isLit: boolean;
  mouseNorm: { x: number; y: number };
}

interface DustMote {
  id: number;
  left: string;
  top: string;
  size: number;
  dx: string;
  dy: string;
  dur: string;
  delay: string;
}

export const Lamp: React.FC<LampProps> = ({ isLit, mouseNorm }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const isLitRef = useRef(isLit);
  const mouseRef = useRef(mouseNorm);

  useEffect(() => {
    isLitRef.current = isLit;
  }, [isLit]);

  useEffect(() => {
    mouseRef.current = mouseNorm;
  }, [mouseNorm]);

  // Precompute deterministic dust motes floating inside the light cone
  const dustMotes = useMemo<DustMote[]>(
    () => [
      { id: 1, left: '34%', top: '42%', size: 2.5, dx: '12px', dy: '-44px', dur: '7.5s', delay: '0s' },
      { id: 2, left: '58%', top: '46%', size: 2, dx: '-10px', dy: '-38px', dur: '6.8s', delay: '1.1s' },
      { id: 3, left: '43%', top: '56%', size: 3, dx: '16px', dy: '-52px', dur: '8.4s', delay: '0.6s' },
      { id: 4, left: '64%', top: '61%', size: 2, dx: '-14px', dy: '-40px', dur: '7.2s', delay: '2.3s' },
      { id: 5, left: '29%', top: '58%', size: 2, dx: '9px', dy: '-34px', dur: '6.4s', delay: '1.7s' },
      { id: 6, left: '51%', top: '49%', size: 2.5, dx: '-8px', dy: '-48px', dur: '7.9s', delay: '2.9s' },
      { id: 7, left: '40%', top: '68%', size: 2, dx: '11px', dy: '-36px', dur: '6.9s', delay: '0.9s' },
      { id: 8, left: '57%', top: '72%', size: 2.5, dx: '-12px', dy: '-42px', dur: '8.1s', delay: '2.1s' },
      { id: 9, left: '47%', top: '39%', size: 1.8, dx: '8px', dy: '-32px', dur: '6.2s', delay: '3.2s' }
    ],
    []
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 420;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 0.18, 5.75);
    camera.lookAt(0, 0.05, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // Subtle ambient + cool rim light so dark silhouette & brass ring are visible when off
    const ambientLight = new THREE.AmbientLight(0xd8d2cb, 0.34);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0x9ca6c2, 0.92);
    rimLight.position.set(-2.6, 2.5, 2.4);
    scene.add(rimLight);

    const fillRimLight = new THREE.DirectionalLight(0xc29b6a, 0.32);
    fillRimLight.position.set(2.8, 1.2, 1.8);
    scene.add(fillRimLight);

    // Warm Amber PointLight inside shade + Downward SpotLight
    const bulbLight = new THREE.PointLight(0xffb556, 0, 8.5, 1.6);
    bulbLight.position.set(0, 1.06, 0.05);
    scene.add(bulbLight);

    const coneSpot = new THREE.SpotLight(0xffc06a, 0, 10, Math.PI / 3.2, 0.85, 1.35);
    coneSpot.position.set(0, 1.18, 0.12);
    coneSpot.target.position.set(0, -1.65, 0.15);
    scene.add(coneSpot);
    scene.add(coneSpot.target);

    // Soft tight contact shadow directly under the 0.42-radius base (never clips canvas bounds)
    const floorAlphaCanvas = document.createElement('canvas');
    floorAlphaCanvas.width = 128;
    floorAlphaCanvas.height = 128;
    const fCtx = floorAlphaCanvas.getContext('2d');
    if (fCtx) {
      const grad = fCtx.createRadialGradient(64, 64, 8, 64, 64, 62);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.55, '#666666');
      grad.addColorStop(1, '#000000');
      fCtx.fillStyle = grad;
      fCtx.fillRect(0, 0, 128, 128);
    }
    const floorAlphaTex = new THREE.CanvasTexture(floorAlphaCanvas);

    const floorGeo = new THREE.CircleGeometry(0.72, 48);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x050404,
      transparent: true,
      opacity: 0.72,
      alphaMap: floorAlphaTex,
      depthWrite: false
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -1.522;
    scene.add(floorMesh);

    // Subtle vertical gradient texture for warm cream-gold fabric shade glow
    const shadeGradCanvas = document.createElement('canvas');
    shadeGradCanvas.width = 64;
    shadeGradCanvas.height = 256;
    const sCtx = shadeGradCanvas.getContext('2d');
    if (sCtx) {
      const sGrad = sCtx.createLinearGradient(0, 0, 0, 256);
      sGrad.addColorStop(0, '#d89d54');
      sGrad.addColorStop(0.45, '#f6d192');
      sGrad.addColorStop(0.78, '#fff2d2');
      sGrad.addColorStop(1, '#f4c67c');
      sCtx.fillStyle = sGrad;
      sCtx.fillRect(0, 0, 64, 256);
    }
    const shadeGlowTex = new THREE.CanvasTexture(shadeGradCanvas);

    // Lamp Root Group (receives mouse-parallax rotation)
    const lampGroup = new THREE.Group();
    scene.add(lampGroup);

    // Materials
    const charcoalMat = new THREE.MeshStandardMaterial({
      color: 0x1e212a,
      roughness: 0.42,
      metalness: 0.62
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb88a44,
      roughness: 0.26,
      metalness: 0.88
    });

    const shadeOuterMat = new THREE.MeshStandardMaterial({
      color: 0x222630,
      emissive: new THREE.Color(0xffbd66),
      emissiveMap: shadeGlowTex,
      emissiveIntensity: 0,
      roughness: 0.76,
      metalness: 0.04,
      side: THREE.FrontSide
    });

    const shadeInnerMat = new THREE.MeshStandardMaterial({
      color: 0x14161d,
      emissive: new THREE.Color(0xffd28a),
      emissiveIntensity: 0,
      roughness: 0.65,
      metalness: 0.02,
      side: THREE.BackSide
    });

    const neckCupMat = new THREE.MeshStandardMaterial({
      color: 0x1e2028,
      emissive: new THREE.Color(0xffbd63),
      emissiveIntensity: 0,
      roughness: 0.4,
      metalness: 0.35
    });

    const bulbCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffe8b5,
      transparent: true,
      opacity: 0
    });

    // 1. Cream-Gold Fabric Lampshade (open cone + inner lining + subtle rims)
    const shadeGeo = new THREE.CylinderGeometry(0.42, 0.74, 0.78, 56, 1, true);
    const shadeOuter = new THREE.Mesh(shadeGeo, shadeOuterMat);
    shadeOuter.position.y = 1.24;
    lampGroup.add(shadeOuter);

    const shadeInner = new THREE.Mesh(shadeGeo, shadeInnerMat);
    shadeInner.scale.set(0.985, 0.995, 0.985);
    shadeInner.position.y = 1.24;
    lampGroup.add(shadeInner);

    const topRimGeo = new THREE.TorusGeometry(0.42, 0.012, 12, 56);
    const topRim = new THREE.Mesh(topRimGeo, brassMat);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 1.63;
    lampGroup.add(topRim);

    const bottomRimGeo = new THREE.TorusGeometry(0.74, 0.012, 12, 56);
    const bottomRim = new THREE.Mesh(bottomRimGeo, shadeOuterMat);
    bottomRim.rotation.x = Math.PI / 2;
    bottomRim.position.y = 0.85;
    lampGroup.add(bottomRim);

    // 2. Glowing Inner Bulb + Under-shade Neck Cup
    const bulbGeo = new THREE.SphereGeometry(0.13, 24, 24);
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbCoreMat);
    bulbMesh.position.y = 1.02;
    lampGroup.add(bulbMesh);

    const neckCupGeo = new THREE.CylinderGeometry(0.16, 0.075, 0.16, 32);
    const neckCup = new THREE.Mesh(neckCupGeo, neckCupMat);
    neckCup.position.y = 0.82;
    lampGroup.add(neckCup);

    const neckCollarGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.06, 24);
    const neckCollar = new THREE.Mesh(neckCollarGeo, brassMat);
    neckCollar.position.y = 0.72;
    lampGroup.add(neckCollar);

    // 3. Tall Charcoal Pole
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.045, 2.16, 28);
    const poleMesh = new THREE.Mesh(poleGeo, charcoalMat);
    poleMesh.position.y = -0.37;
    lampGroup.add(poleMesh);

    // 4. Mid-Pole Brass Ring Collar (signature detail from reference)
    const midBrassGeo = new THREE.CylinderGeometry(0.066, 0.066, 0.075, 32);
    const midBrass = new THREE.Mesh(midBrassGeo, brassMat);
    midBrass.position.y = -0.22;
    lampGroup.add(midBrass);

    const midRingTop = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.01, 12, 32), brassMat);
    midRingTop.rotation.x = Math.PI / 2;
    midRingTop.position.y = -0.185;
    lampGroup.add(midRingTop);

    const midRingBottom = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.01, 12, 32), brassMat);
    midRingBottom.rotation.x = Math.PI / 2;
    midRingBottom.position.y = -0.255;
    lampGroup.add(midRingBottom);

    // 5. Lower Brass Accent & Stepped Round Dark Base
    const baseCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.12, 0.08, 32), brassMat);
    baseCollar.position.y = -1.41;
    lampGroup.add(baseCollar);

    const baseUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.045, 48), charcoalMat);
    baseUpper.position.y = -1.455;
    lampGroup.add(baseUpper);

    const baseLower = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.05, 48), charcoalMat);
    baseLower.position.y = -1.495;
    lampGroup.add(baseLower);

    const baseBrassTrim = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.013, 14, 48), brassMat);
    baseBrassTrim.rotation.x = Math.PI / 2;
    baseBrassTrim.position.y = -1.472;
    lampGroup.add(baseBrassTrim);

    // Color interpolation targets
    const offShadeColor = new THREE.Color(0x222630);
    const litShadeColor = new THREE.Color(0xffe9be);
    const offInnerColor = new THREE.Color(0x14161d);
    const litInnerColor = new THREE.Color(0xfff1cd);
    const offNeckColor = new THREE.Color(0x1e2028);
    const litNeckColor = new THREE.Color(0xf6ce8c);

    let currentGlow = isLitRef.current ? 1 : 0;
    let rotX = 0;
    let rotY = 0;
    let frameId = 0;

    const animate = () => {
      const targetGlow = isLitRef.current ? 1 : 0;
      currentGlow += (targetGlow - currentGlow) * 0.09;

      // Subtle mouse-parallax rotation
      const targetRotY = mouseRef.current.x * 0.15;
      const targetRotX = -mouseRef.current.y * 0.05;
      rotY += (targetRotY - rotY) * 0.08;
      rotX += (targetRotX - rotX) * 0.08;
      lampGroup.rotation.y = rotY;
      lampGroup.rotation.x = rotX;

      // Interpolate lights & materials smoothly
      bulbLight.intensity = currentGlow * 14.5;
      coneSpot.intensity = currentGlow * 28;
      ambientLight.intensity = 0.34 + currentGlow * 0.32;
      rimLight.intensity = 0.72 - currentGlow * 0.22;

      shadeOuterMat.color.lerpColors(offShadeColor, litShadeColor, currentGlow);
      shadeOuterMat.emissiveIntensity = currentGlow * 0.92;

      shadeInnerMat.color.lerpColors(offInnerColor, litInnerColor, currentGlow);
      shadeInnerMat.emissiveIntensity = currentGlow * 1.1;

      neckCupMat.color.lerpColors(offNeckColor, litNeckColor, currentGlow);
      neckCupMat.emissiveIntensity = currentGlow * 0.55;

      bulbCoreMat.opacity = currentGlow;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 420;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      floorAlphaTex.dispose();
      shadeGlowTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
      {/* Conical Wall & Floor Light Wash (Lit State) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-500 ease-out"
        style={{ opacity: isLit ? 1 : 0 }}
      >
        {/* Upward spill from top of lampshade */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: '5%',
            width: '320px',
            height: '200px',
            background: 'radial-gradient(ellipse at 50% 90%, rgba(255, 200, 125, 0.24), transparent 72%)',
            filter: 'blur(20px)'
          }}
        />

        {/* Downward conical beam onto wall & floor */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: '27%',
            width: '140%',
            maxWidth: '760px',
            height: '66%',
            clipPath: 'polygon(42% 0%, 58% 0%, 98% 100%, 2% 100%)',
            background:
              'linear-gradient(180deg, var(--lamp-cone-top) 0%, var(--lamp-cone-mid) 58%, rgba(180, 110, 48, 0.0) 100%)',
            filter: 'blur(22px)'
          }}
        />

        {/* Warm amber glow behind shade */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: '13%',
            width: '260px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(255, 195, 110, 0.34) 0%, rgba(255, 165, 72, 0.08) 55%, transparent 75%)',
            filter: 'blur(22px)'
          }}
        />

        {/* Floor light pool */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: '4%',
            width: '420px',
            height: '86px',
            background: 'radial-gradient(ellipse at center, var(--lamp-floor-glow) 0%, transparent 72%)',
            filter: 'blur(14px)'
          }}
        />

        {/* Floating Dust Particles in Light */}
        {dustMotes.map((mote) => (
          <span
            key={mote.id}
            className="lamp-dust-mote absolute rounded-full"
            style={
              {
                left: mote.left,
                top: mote.top,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                backgroundColor: 'rgba(255, 226, 178, 0.72)',
                boxShadow: '0 0 6px rgba(255, 196, 112, 0.65)',
                '--dx': mote.dx,
                '--dy': mote.dy,
                '--dur': mote.dur,
                '--delay': mote.delay
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Real 3D Three.js Lamp Canvas */}
      <div ref={mountRef} className="relative z-10 w-full h-full" />
    </div>
  );
};
