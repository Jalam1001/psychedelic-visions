import { useEffect, useRef } from 'react';
import { avSync } from '../audio/analysis';

/** Live band meters + mini spectrum (drawn with rAF, no React re-render). */
export function Meters() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = (now: number) => {
      const c = ref.current;
      if (c) {
        const ctx = c.getContext('2d')!;
        const w = c.width, h = c.height;
        ctx.clearRect(0, 0, w, h);
        const s = avSync.update(now);
        const n = 96;
        for (let i = 0; i < n; i++) {
          const idx = Math.floor(Math.pow(i / n, 2) * 400) + 1;
          const v = s.spectrum[idx] || 0;
          ctx.fillStyle = `hsl(${260 - i * 2}, 90%, ${45 + v * 25}%)`;
          ctx.fillRect((i / n) * w, h * 0.62 * (1 - v), w / n - 1, h * 0.62 * v);
        }
        const bars: [string, number][] = [['bass', s.bass], ['mid', s.mid], ['high', s.high], ['pulse', s.pulse]];
        bars.forEach(([name, v], i) => {
          const y = h * 0.68 + i * (h * 0.08);
          ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(40, y, w - 44, h * 0.055);
          ctx.fillStyle = ['#ff6fa8', '#ffd166', '#7afcff', '#c86bff'][i]; ctx.fillRect(40, y, (w - 44) * v, h * 0.055);
          ctx.fillStyle = '#cfc6e8'; ctx.font = '10px system-ui'; ctx.fillText(name, 2, y + h * 0.05);
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={280} height={120} className="meters" aria-label="Audio spectrum and band meters" />;
}
