import { useId } from 'react';

export function Slider(props: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string; log?: boolean }) {
  const { label, value, min, max, step = 0.01, onChange, format, log } = props;
  const id = useId();
  const toPos = (v: number) => (log ? Math.log(v / min) / Math.log(max / min) : v);
  const fromPos = (x: number) => (log ? min * Math.pow(max / min, x) : x);
  return (
    <label className="slider" htmlFor={id}>
      <span className="slider-label">{label}<em>{format ? format(value) : value.toFixed(step >= 1 ? 0 : 2)}</em></span>
      <input id={id} type="range" min={log ? 0 : min} max={log ? 1 : max} step={log ? 0.001 : step} value={toPos(value)}
        onChange={(e) => onChange(fromPos(parseFloat(e.target.value)))} aria-label={label} />
    </label>
  );
}

export function Select<T extends string>(props: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <label className="select" htmlFor={id}>
      <span className="slider-label">{props.label}</span>
      <select id={id} value={props.value} onChange={(e) => props.onChange(e.target.value as T)}>
        {props.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Toggle(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <span>{props.label}</span>
    </label>
  );
}
