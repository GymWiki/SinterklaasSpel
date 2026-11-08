'use client';
import { useEffect, useRef } from 'react';

export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const colors = ['#ff5d73', '#ffc93c', '#7dff8a', '#4de1ff', '#d68bff', '#ffffff'];
    let w = 0, h = 0, raf = 0;
    const resize = () => {
      w = cv.width = cv.clientWidth;
      h = cv.height = cv.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const P = Array.from({ length: 220 }, () => ({
      x: Math.random() * w, y: -Math.random() * h, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 5,
      s: 6 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="confetti" />;
}
