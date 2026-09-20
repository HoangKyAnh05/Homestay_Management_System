import { useEffect, useRef } from 'react';

/**
 * AmbientEffectsLayer
 * Renders floating Golden Fireflies & Falling Autumn Maple Leaves (Lá Phong Đỏ Sa Pa)
 * with 60 FPS physics, wind velocity, and interactive mouse repulsion/attraction.
 */
export default function AmbientEffectsLayer() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0, lastX: 0, lastY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      const vx = e.clientX - mouseRef.current.lastX;
      const vy = e.clientY - mouseRef.current.lastY;
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        vx: Math.max(-15, Math.min(15, vx)),
        vy: Math.max(-15, Math.min(15, vy)),
        lastX: e.clientX,
        lastY: e.clientY,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 1. Fireflies (Đom đóm hoàng hôn / đêm trăng sao)
    const fireflyCount = 28;
    const fireflies = Array.from({ length: fireflyCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 1.2,
      baseAlpha: Math.random() * 0.6 + 0.3,
      alpha: 0,
      phase: Math.random() * Math.PI * 2,
      speedPhase: Math.random() * 0.03 + 0.015,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(Math.random() * 0.5 + 0.2), // gentle upward float
      hue: Math.random() > 0.3 ? 42 : 18, // gold (42) or warm amber (18)
    }));

    // 2. Red Maple Leaves (Lá phong đỏ bay lơ lửng)
    const leafCount = 14;
    const leaves = Array.from({ length: leafCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height - height * 0.5,
      size: Math.random() * 12 + 10,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 0.03,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01,
      swayAmp: Math.random() * 1.5 + 0.8,
      fallSpeed: Math.random() * 0.8 + 0.6,
      color: Math.random() > 0.4 ? 'rgba(217, 72, 54, ' : 'rgba(234, 88, 12, ', // Crimson / Vermilion
      opacity: Math.random() * 0.35 + 0.45,
    }));

    // Draw single stylized maple leaf
    const drawMapleLeaf = (cx, cy, size, angle, colorStr, opacity) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = `${colorStr}${opacity})`;
      ctx.shadowColor = 'rgba(180, 40, 20, 0.4)';
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.moveTo(0, -size);
      // Top tip
      ctx.quadraticCurveTo(size * 0.3, -size * 0.7, size * 0.8, -size * 0.3);
      // Right lobe
      ctx.quadraticCurveTo(size * 0.4, -size * 0.1, size * 0.9, size * 0.2);
      ctx.quadraticCurveTo(size * 0.3, size * 0.3, size * 0.4, size * 0.7);
      // Base
      ctx.quadraticCurveTo(0, size * 0.4, -size * 0.4, size * 0.7);
      // Left lobe
      ctx.quadraticCurveTo(-size * 0.3, size * 0.3, -size * 0.9, size * 0.2);
      ctx.quadraticCurveTo(-size * 0.4, -size * 0.1, -size * 0.8, -size * 0.3);
      ctx.quadraticCurveTo(-size * 0.3, -size * 0.7, 0, -size);
      ctx.closePath();
      ctx.fill();

      // Leaf stem
      ctx.beginPath();
      ctx.moveTo(0, size * 0.4);
      ctx.lineTo(0, size * 0.9);
      ctx.strokeStyle = `rgba(120, 30, 15, ${opacity * 0.8})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // 1. Render Fireflies
      fireflies.forEach((f) => {
        f.phase += f.speedPhase;
        f.alpha = Math.max(0, f.baseAlpha * Math.sin(f.phase));

        // Physics
        f.x += f.vx;
        f.y += f.vy;

        // Mouse proximity reaction
        const dx = f.x - mouse.x;
        const dy = f.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (1 - dist / 120) * 1.5;
          f.x += (dx / dist) * force + mouse.vx * 0.1;
          f.y += (dy / dist) * force + mouse.vy * 0.1;
        }

        // Screen wrap
        if (f.y < -20) f.y = height + 20;
        if (f.x < -20) f.x = width + 20;
        if (f.x > width + 20) f.x = -20;

        if (f.alpha > 0.02) {
          ctx.save();
          // Glow halo
          const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 3.5);
          gradient.addColorStop(0, `hsla(${f.hue}, 95%, 75%, ${f.alpha})`);
          gradient.addColorStop(0.4, `hsla(${f.hue}, 90%, 60%, ${f.alpha * 0.5})`);
          gradient.addColorStop(1, `hsla(${f.hue}, 90%, 50%, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius * 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Core bright spark
          ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 2. Render Maple Leaves
      leaves.forEach((leaf) => {
        leaf.swayPhase += leaf.swaySpeed;
        leaf.angle += leaf.angularSpeed;

        const sway = Math.sin(leaf.swayPhase) * leaf.swayAmp;
        leaf.x += sway + 0.3; // drift slightly right
        leaf.y += leaf.fallSpeed;

        // Mouse wind effect
        const dx = leaf.x - mouse.x;
        const dy = leaf.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          const wind = (1 - dist / 140) * 2;
          leaf.x += (dx / dist) * wind + mouse.vx * 0.15;
          leaf.y += (dy / dist) * wind + mouse.vy * 0.15;
          leaf.angularSpeed += (Math.random() - 0.5) * 0.05;
        }

        // Screen wrap
        if (leaf.y > height + 30) {
          leaf.y = -30;
          leaf.x = Math.random() * width;
        }
        if (leaf.x > width + 40) leaf.x = -40;
        if (leaf.x < -40) leaf.x = width + 40;

        drawMapleLeaf(leaf.x, leaf.y, leaf.size, leaf.angle, leaf.color, leaf.opacity);
      });

      // Decay mouse velocity
      mouse.vx *= 0.92;
      mouse.vy *= 0.92;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="ambient-effects-root" aria-hidden="true">
      {/* 2D Canvas with Leaves & Fireflies */}
      <canvas
        ref={canvasRef}
        className="ambient-particles-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {/* Realistic Flowing Mist Fog Waves */}
      <div className="ambient-fog-stream fog-stream-1"></div>
      <div className="ambient-fog-stream fog-stream-2"></div>
    </div>
  );
}
