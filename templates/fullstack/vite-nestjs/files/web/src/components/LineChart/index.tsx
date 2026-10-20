import { useId, useMemo, useState, type PointerEvent } from 'react';
import styles from './index.module.css';

export interface LineChartPoint {
  label: string;
  value: number | null;
}
export interface LineChartProps {
  data: readonly LineChartPoint[];
  title: string;
  unit?: string;
  emptyText?: string;
  formatValue?: (value: number) => string;
}

const LEFT = 54,
  RIGHT = 620,
  TOP = 24,
  BOTTOM = 224;
const CARD_WIDTH = 144,
  CARD_HEIGHT = 52;
const defaultFormat = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);

/** A dependency-free SVG chart extracted from the source dashboard's trend chart. */
export function LineChart({
  data,
  title,
  unit = '',
  emptyText = 'No data',
  formatValue = defaultFormat,
}: LineChartProps) {
  const id = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const model = useMemo(() => {
    const valid = data.filter((point) => point.value !== null && Number.isFinite(point.value));
    let min = 0,
      max = 1;
    for (const point of valid) {
      min = Math.min(min, point.value!);
      max = Math.max(max, point.value!);
    }
    const step = 10 ** Math.floor(Math.log10(max - min));
    const low = Math.floor(min / step) * step;
    const high = Math.max(low + step, Math.ceil(max / step) * step);
    const x = (index: number) =>
      LEFT + (data.length === 1 ? 0.5 : index / Math.max(data.length - 1, 1)) * (RIGHT - LEFT);
    const y = (value: number) => BOTTOM - ((value - low) / (high - low)) * (BOTTOM - TOP);
    const segments: Array<Array<{ x: number; y: number }>> = [];
    let segment: Array<{ x: number; y: number }> = [];
    data.forEach((point, index) => {
      if (point.value === null || !Number.isFinite(point.value)) {
        if (segment.length) segments.push(segment);
        segment = [];
      } else segment.push({ x: x(index), y: y(point.value) });
    });
    if (segment.length) segments.push(segment);
    const count = Math.min(data.length, 6);
    const ticks = Array.from({ length: count }, (_, index) =>
      count === 1 ? 0 : Math.round((index * (data.length - 1)) / (count - 1)),
    );
    return { valid, low, high, x, y, segments, ticks };
  }, [data]);
  const point = activeIndex === null ? undefined : data[activeIndex];
  const active =
    point && activeIndex !== null
      ? {
          x: model.x(activeIndex),
          y: point.value !== null && Number.isFinite(point.value) ? model.y(point.value) : null,
        }
      : null;
  const cardLeft = active
    ? Math.min(Math.max(active.x - CARD_WIDTH / 2, LEFT), RIGHT - CARD_WIDTH)
    : LEFT;
  const cardTop = (() => {
    if (!active) return TOP;
    const preferred = Math.max(TOP, (active.y ?? 100) - CARD_HEIGHT - 12);
    let best = TOP,
      bestScore = Infinity;
    for (let top = TOP; top + CARD_HEIGHT <= BOTTOM; top += 4) {
      let coverage = 0;
      for (const segment of model.segments) {
        segment.forEach((a, index) => {
          const b = segment[index + 1];
          if (!b || b.x < cardLeft || a.x > cardLeft + CARD_WIDTH) return;
          coverage += Math.max(
            0,
            Math.min(Math.max(a.y, b.y), top + CARD_HEIGHT + 8) -
              Math.max(Math.min(a.y, b.y), top - 8),
          );
        });
      }
      const score = coverage * 1000 + Math.abs(top - preferred);
      if (score < bestScore) {
        best = top;
        bestScore = score;
      }
    }
    return best;
  })();
  const readout = point
    ? `${point.label}: ${point.value === null || !Number.isFinite(point.value) ? emptyText : `${formatValue(point.value)} ${unit}`}`
    : '';

  const readPointer = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!data.length || !bounds.width) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    setActiveIndex(Math.round(ratio * (data.length - 1)));
  };
  return (
    <figure className={styles.figure}>
      <figcaption id={`${id}-title`}>
        {title}
        {unit && <span className={styles.unit}>{unit}</span>}
      </figcaption>
      <svg
        className={styles.chart}
        viewBox="0 0 640 270"
        role="img"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        tabIndex={data.length ? 0 : undefined}
        onFocus={() => {
          if (data.length) setActiveIndex((index) => index ?? 0);
        }}
        onBlur={() => setActiveIndex(null)}
        onKeyDown={(event) => {
          if (!data.length) return;
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            setActiveIndex((index) =>
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? data.length - 1
                  : Math.min(
                      data.length - 1,
                      Math.max(0, (index ?? 0) + (event.key === 'ArrowRight' ? 1 : -1)),
                    ),
            );
          } else if (event.key === 'Escape') setActiveIndex(null);
        }}
      >
        <defs>
          <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="currentColor" stopOpacity=".22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[model.high, (model.low + model.high) / 2, model.low].map((value, index) => (
          <g key={index} className={styles.grid}>
            <text x={LEFT - 10} y={model.y(value) + 4} textAnchor="end">
              {formatValue(value)}
            </text>
            <line x1={LEFT} x2={RIGHT} y1={model.y(value)} y2={model.y(value)} />
          </g>
        ))}
        {model.segments.map((segment, index) => (
          <g key={index} data-segment="true">
            <polygon
              points={`${segment[0]!.x},${BOTTOM} ${segment.map((p) => `${p.x},${p.y}`).join(' ')} ${segment[segment.length - 1]!.x},${BOTTOM}`}
              fill={`url(#${id}-area)`}
            />
            <polyline
              className={styles.line}
              points={segment.map((p) => `${p.x},${p.y}`).join(' ')}
            />
            {segment.length === 1 && (
              <circle cx={segment[0]!.x} cy={segment[0]!.y} r="3" fill="currentColor" />
            )}
          </g>
        ))}
        {model.ticks.map((index) => (
          <text
            className={styles.tick}
            key={index}
            x={model.x(index)}
            y="251"
            textAnchor={
              index === 0 && data.length > 1
                ? 'start'
                : index === data.length - 1 && data.length > 1
                  ? 'end'
                  : 'middle'
            }
          >
            {data[index]!.label}
          </text>
        ))}
        {!model.valid.length && (
          <text x="337" y="124" textAnchor="middle" className={styles.empty}>
            {emptyText}
          </text>
        )}
        {active && point && (
          <g pointerEvents="none">
            <line className={styles.crosshair} x1={active.x} x2={active.x} y1={TOP} y2={BOTTOM} />
            {active.y !== null && <circle cx={active.x} cy={active.y} r="4" fill="currentColor" />}
            <g className={styles.tooltip} transform={`translate(${cardLeft},${cardTop})`}>
              <rect width={CARD_WIDTH} height={CARD_HEIGHT} rx="5" />
              <text x={CARD_WIDTH / 2} y="21" textAnchor="middle">
                {point.label}
              </text>
              <text x={CARD_WIDTH / 2} y="41" textAnchor="middle">
                {point.value === null || !Number.isFinite(point.value)
                  ? emptyText
                  : `${formatValue(point.value)} ${unit}`}
              </text>
            </g>
          </g>
        )}
        <rect
          x={LEFT}
          y={TOP}
          width={RIGHT - LEFT}
          height={BOTTOM - TOP}
          fill="transparent"
          onPointerDown={readPointer}
          onPointerMove={readPointer}
          onPointerLeave={(event) => {
            if (event.pointerType !== 'touch') setActiveIndex(null);
          }}
          onPointerCancel={() => setActiveIndex(null)}
        />
      </svg>
      <span id={`${id}-description`} className={styles.readout} aria-live="polite">
        {readout || title}
      </span>
    </figure>
  );
}
