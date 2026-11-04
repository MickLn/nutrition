"use client";

import { useEffect, useRef, useState } from "react";
import { PROGRESS } from "@/config/progress";
import type { ChartModel } from "./chart";

type Shape = { height: number; top: number; bottom: number; labelY: number; dotR: number };
export type Mark = { x: number; text: string; align?: "start" | "center" | "end" };

/**
 * Composant « Graphique » du Figma (80:130) : graduations à gauche, grille, points des mesures,
 * ligne de tendance en bleu et point final plus gros. Fait main en SVG, couleurs par jetons.
 * `dashedFrom` : la mesure s'arrête avant la fin de la période, un trait pointillé prolonge la tendance.
 */
export function Graph({
  model,
  shape,
  marks,
  tickLabel,
  label,
  dashed,
  linkDots,
}: {
  model: ChartModel;
  shape: Shape;
  marks: (width: number) => Mark[];
  tickLabel: (v: number) => string;
  label: string;
  /** Prolonge la ligne par un pointillé jusqu'au bord droit. */
  dashed?: boolean;
  /** Relie les points (tour de taille) au lieu d'utiliser la ligne de tendance. */
  linkDots?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState<number>(PROGRESS.chartWidthFallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || PROGRESS.chartWidthFallback));
    ro.observe(el);
    setW(el.clientWidth || PROGRESS.chartWidthFallback);
    return () => ro.disconnect();
  }, []);

  const { left, right } = PROGRESS.chartPad;
  const px = (x: number) => left + x * (w - left - right);
  const py = (y: number) => shape.top + y * (shape.bottom - shape.top);
  const path = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`).join(" ");
  const line = linkDots ? model.dots : model.line;
  const last = line[line.length - 1];

  return (
    <div className="flex items-start" style={{ height: shape.height }} role="img" aria-label={label}>
      <div className="num relative h-full shrink-0 text-mono-petit text-texte-discret" style={{ width: PROGRESS.axisWidth }} aria-hidden>
        {model.ticks.map((t) => (
          <span key={t.value} className="absolute left-0 whitespace-nowrap" style={{ top: py(t.y) - 7 }}>
            {tickLabel(t.value)}
          </span>
        ))}
      </div>
      <div ref={ref} className="relative h-full min-w-0 flex-1">
        <svg width={w} height={shape.height} className="absolute inset-0 overflow-visible" aria-hidden>
          {model.ticks.map((t) => (
            <line key={t.value} x1={0} x2={w} y1={py(t.y)} y2={py(t.y)} className="stroke-trait" strokeWidth={1} />
          ))}
          {!linkDots && model.dots.map((p) => <circle key={p.date} cx={px(p.x)} cy={py(p.y)} r={shape.dotR} className="fill-texte-discret" />)}
          {line.length > 1 && <path d={path(line)} fill="none" className="stroke-actif" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {linkDots && model.dots.map((p) => <circle key={p.date} cx={px(p.x)} cy={py(p.y)} r={shape.dotR} className="fill-fond stroke-actif" strokeWidth={1.5} />)}
          {dashed && last && last.x < 1 && (
            <line x1={px(last.x)} x2={w - right} y1={py(last.y)} y2={py(last.y)} className="stroke-texte-discret" strokeWidth={1.5} strokeDasharray="3 4" />
          )}
          {last && <circle cx={px(last.x)} cy={py(last.y)} r={3.5} className="fill-actif" />}
        </svg>
        {marks(w).map((m) => (
          <span
            key={m.text + m.x}
            className="num absolute whitespace-nowrap text-mono-petit uppercase tracking-[0.08em] text-texte-discret"
            style={{
              top: shape.labelY,
              left: m.x,
              transform: m.align === "end" ? "translateX(-100%)" : m.align === "start" ? undefined : "translateX(-50%)",
            }}
            aria-hidden
          >
            {m.text}
          </span>
        ))}
      </div>
    </div>
  );
}
