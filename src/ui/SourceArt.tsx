import ART from '../content/art.json';
import { useState } from 'react';

export interface ArtRecord {
  key: string; file: string; title: string; date: string; culture: string; medium: string;
  source: string; license: string; licenseUrl: string; credit: string; tags: string[]; texture: boolean; paletteOnly: boolean; thumb?: string; author?: string;
}
export const ART_RECORDS = ART as unknown as ArtRecord[];
export const artByKey = (k: string) => ART_RECORDS.find((a) => a.key === k);
export const TEXTURE_ART = ART_RECORDS.filter((a) => a.texture && !a.paletteOnly);
export const artWithTag = (...tags: string[]) => ART_RECORDS.filter((a) => a.tags.some((t) => tags.includes(t))).map((a) => a.key);
const url = (f: string) => `${import.meta.env.BASE_URL}${f}`;

/** Thumbnail strip of the real artworks an experience draws on, with licence + source links. */
export function SourceArtStrip({ keys, title = 'Source art' }: { keys: string[]; title?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const items = keys.map(artByKey).filter(Boolean) as ArtRecord[];
  const sel = open ? artByKey(open) : null;
  return (
    <details className="source-art">
      <summary>{title} ({items.length})</summary>
      <div className="art-strip">
        {items.map((a) => (
          <button key={a.key} className={`art-thumb ${open === a.key ? 'active' : ''}`} onClick={() => setOpen(open === a.key ? null : a.key)} aria-label={a.title}>
            <img src={url(a.thumb ?? a.file)} alt={a.title} loading="lazy" />
          </button>
        ))}
      </div>
      {sel && <ArtCaption a={sel} />}
      <p className="note">Public domain, CC0, CC BY and CC BY-SA images, credited above — full list in <a href="https://github.com/Jalam1001/psychedelic-visions/blob/main/CREDITS.md" target="_blank" rel="noreferrer">CREDITS.md</a>.</p>
    </details>
  );
}

export function ArtCaption({ a }: { a: ArtRecord }) {
  return (
    <p className="art-caption">
      <strong>{a.title}</strong>, {a.date}. {a.culture}. {a.medium}. {a.credit}. <a href={a.licenseUrl} target="_blank" rel="noreferrer">{a.license}</a> · <a href={a.source} target="_blank" rel="noreferrer">source</a>
      {a.paletteOnly && <em> — used as colour reference only.</em>}
    </p>
  );
}

/** Full credits grid for the Learn page. */
export function ArtCredits() {
  return (
    <div className="art-grid">
      {ART_RECORDS.map((a) => (
        <figure key={a.key}>
          <img src={url(a.thumb ?? a.file)} alt={a.title} loading="lazy" />
          <figcaption><ArtCaption a={a} /></figcaption>
        </figure>
      ))}
    </div>
  );
}
