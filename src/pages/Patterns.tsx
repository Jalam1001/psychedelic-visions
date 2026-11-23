import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import raw from '../content/patterns.html?raw';

const HTML = raw.split('%BASE%').join(import.meta.env.BASE_URL);

/** "The Universal Language of Patterns" — Javed Alam's essay, rendered inside the site. */
export default function Patterns() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    document.title = 'The Universal Language of Patterns | Psychedelic Visions';
    window.scrollTo(0, 0);
    // section targets can take focus so keyboard / screen-reader users land in the right place
    el.querySelectorAll('section[id]').forEach((s) => s.setAttribute('tabindex', '-1'));

    const onClick = async (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const copy = t.closest('.copy-external') as HTMLButtonElement | null;
      if (copy) {
        const url = copy.dataset.url ?? '';
        try { await navigator.clipboard.writeText(url); copy.textContent = 'Copied!'; setTimeout(() => (copy.textContent = 'Copy URL'), 1800); }
        catch { window.prompt('Copy this URL:', url); }
        return;
      }
      const a = t.closest('a') as HTMLAnchorElement | null;
      const href = a?.getAttribute('href') ?? '';
      // in-page anchors (#mandalas) must not be treated as routes by the HashRouter
      if (href.startsWith('#') && !href.startsWith('#/')) {
        e.preventDefault();
        const target = el.querySelector<HTMLElement>(`[id="${href.slice(1)}"]`);
        if (target) {
          const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
          target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          target.focus({ preventScroll: true });
        }
      }
    };
    el.addEventListener('click', onClick);

    // the essay's original header animation: slowly rotating, breathing rings
    const c = el.querySelector<HTMLCanvasElement>('canvas.essay-art');
    let raf = 0;
    if (c && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const x = c.getContext('2d')!;
      let w = 0, h = 0, tt = 0;
      const resize = () => { const r = c.getBoundingClientRect(); w = c.width = r.width * devicePixelRatio; h = c.height = r.height * devicePixelRatio; };
      resize(); addEventListener('resize', resize);
      const draw = () => {
        x.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2, s = Math.min(w, h) * 0.36;
        for (let k = 0; k < 8; k++) {
          const n = 12 + k * 6; x.beginPath();
          for (let j = 0; j <= n * 3; j++) {
            const a = (j * Math.PI * 2) / (n * 3) + tt * (k % 2 ? -0.04 : 0.03);
            const r = s * (0.18 + k * 0.1) * (1 + 0.13 * Math.sin(j * 1.7 + tt * 0.2));
            const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
            j ? x.lineTo(px, py) : x.moveTo(px, py);
          }
          x.strokeStyle = `hsla(${35 + k * 31 + tt * 4},85%,75%,${0.38 - k * 0.025})`;
          x.lineWidth = devicePixelRatio * 0.9; x.stroke();
        }
        tt += 0.01; raf = requestAnimationFrame(draw);
      };
      draw();
      return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); el.removeEventListener('click', onClick); document.title = 'Psychedelic Visions — Living Geometry & Generative Music'; };
    }
    return () => { el.removeEventListener('click', onClick); document.title = 'Psychedelic Visions — Living Geometry & Generative Music'; };
  }, []);

  return (
    <div className="patterns-essay">
      <nav className="crumbs essay-crumbs" aria-label="Site"><Link to="/">← Psychedelic Visions</Link> · <Link to="/learn">Research &amp; references</Link></nav>
      <div ref={root} dangerouslySetInnerHTML={{ __html: HTML }} />
    </div>
  );
}
