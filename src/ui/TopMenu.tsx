import { ReactNode, useEffect, useId, useRef, useState } from 'react';

export interface MenuItem { label: string; icon: string; onSelect: () => void; hint?: string; pressed?: boolean; keepOpen?: boolean }
export interface MenuMode { id: string; label: string }

/** Compact drop-down for the experience top bar: modes as a radio list + actions as a vertical list.
 *  Disclosure pattern: button[aria-expanded] controls the panel; Escape / outside tap closes and returns focus. */
export function TopMenu({ modes, mode, onMode, items, footer }: { modes: MenuMode[]; mode: string; onMode: (id: string) => void; items: MenuItem[]; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const first = panel.current?.querySelector<HTMLElement>('[aria-checked="true"], button, a');
    first?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); btn.current?.focus(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const els = [...(panel.current?.querySelectorAll<HTMLElement>('button, a') ?? [])];
        const i = els.indexOf(document.activeElement as HTMLElement);
        const n = els[(i + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length];
        if (n) { e.preventDefault(); n.focus(); }
      }
      // keep the experience's single-key shortcuts from firing while the menu is open
      e.stopPropagation();
    };
    document.addEventListener('pointerdown', onDown, true);
    panel.current?.addEventListener('keydown', onKey);
    const p = panel.current;
    return () => { document.removeEventListener('pointerdown', onDown, true); p?.removeEventListener('keydown', onKey); };
  }, [open]);

  const current = modes.find((m) => m.id === mode);
  return (
    <div className="topmenu">
      <button ref={btn} className={`btn menu-btn ${open ? 'on' : ''}`} aria-expanded={open} aria-controls={id} aria-haspopup="true" onClick={() => setOpen((x) => !x)}>
        <span className="sr-only">Mode: </span><span className="menu-label">{current && modes.length > 1 ? current.label : 'Menu'}</span><span aria-hidden className="caret">▾</span>
      </button>
      {open && (
        <div ref={panel} id={id} className="menu-panel" role="group" aria-label="Choose mode">
          {modes.length > 1 && (
            <div role="radiogroup" aria-label="Mode" className="menu-modes">
              <div className="menu-heading">Mode</div>
              {modes.map((m, i) => (
                <button key={m.id} role="radio" aria-checked={m.id === mode} className={`menu-item ${m.id === mode ? 'active' : ''}`}
                  onClick={() => { onMode(m.id); setOpen(false); btn.current?.focus(); }}>
                  <span className="mi-icon" aria-hidden>{m.id === mode ? '●' : '○'}</span>{m.label}<kbd>{i + 1}</kbd>
                </button>
              ))}
            </div>
          )}
          {items.length > 0 && <div className="menu-heading">Actions</div>}
          {items.map((it) => (
            <button key={it.label} className="menu-item" aria-pressed={it.pressed} onClick={() => { it.onSelect(); if (!it.keepOpen) { setOpen(false); } }}>
              <span className="mi-icon" aria-hidden>{it.icon}</span>{it.label}{it.hint && <kbd>{it.hint}</kbd>}
            </button>
          ))}
          {footer}
        </div>
      )}
    </div>
  );
}
