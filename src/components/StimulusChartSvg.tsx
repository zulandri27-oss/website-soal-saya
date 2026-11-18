import { useState } from 'react';
import type { StimulusChart } from '../types/assessment';

interface StimulusChartSvgProps {
  chart: StimulusChart;
}

export function StimulusChartSvg({ chart }: StimulusChartSvgProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 540;
  const height = 220;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 38;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const allValues = chart.points.flatMap((pt) =>
    pt.seriesB !== undefined ? [pt.seriesA, pt.seriesB] : [pt.seriesA],
  );
  const rawMax = Math.max(...allValues, 10);
  const yMax = Math.ceil(rawMax / 10) * 10;

  const getX = (index: number) => {
    if (chart.points.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (chart.points.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return padTop + plotHeight - (val / yMax) * plotHeight;
  };

  const lineAPath = chart.points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(pt.seriesA).toFixed(1)}`)
    .join(' ');

  const hasSeriesB = chart.points.some((pt) => pt.seriesB !== undefined);
  const lineBPath = hasSeriesB
    ? chart.points
        .map(
          (pt, idx) =>
            `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(pt.seriesB ?? 0).toFixed(1)}`,
        )
        .join(' ')
    : '';

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => Math.round(yMax * frac));

  return (
    <div className="mt-3 rounded border border-[#E2E8F0] bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-[#0F172A]">{chart.title}</p>
        <div className="flex items-center gap-4 text-[11px] font-medium text-[#475569]">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-[2px] bg-[#0F172A]" />
            {chart.seriesALabel}
          </span>
          {hasSeriesB && chart.seriesBLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-[2px] bg-[#2563EB]" />
              {chart.seriesBLabel}
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={chart.title}
      >
        {/* Horizontal gridlines */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[#64748B] text-[10px] font-mono tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padLeft}
          y1={padTop}
          x2={padLeft}
          y2={padTop + plotHeight}
          stroke="#CBD5E1"
          strokeWidth="1"
        />
        <line
          x1={padLeft}
          y1={padTop + plotHeight}
          x2={width - padRight}
          y2={padTop + plotHeight}
          stroke="#CBD5E1"
          strokeWidth="1"
        />

        {/* Data lines */}
        <path
          d={lineAPath}
          fill="none"
          stroke="#0F172A"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {hasSeriesB && (
          <path
            d={lineBPath}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.2"
            strokeDasharray="5 3"
            strokeLinejoin="round"
          />
        )}

        {/* Data points & interactive hover */}
        {chart.points.map((pt, idx) => {
          const cx = getX(idx);
          const cyA = getY(pt.seriesA);
          const cyB = pt.seriesB !== undefined ? getY(pt.seriesB) : null;
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={pt.xLabel}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {isHovered && (
                <line
                  x1={cx}
                  y1={padTop}
                  x2={cx}
                  y2={padTop + plotHeight}
                  stroke="#CBD5E1"
                  strokeDasharray="3 3"
                />
              )}
              <circle
                cx={cx}
                cy={cyA}
                r={isHovered ? 5 : 3.5}
                fill="#0F172A"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              {cyB !== null && (
                <circle
                  cx={cx}
                  cy={cyB}
                  r={isHovered ? 5 : 3.5}
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              )}
              <text
                x={cx}
                y={padTop + plotHeight + 16}
                textAnchor="middle"
                className="fill-[#475569] text-[10px] font-mono tabular-nums"
              >
                {pt.xLabel}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={padLeft + plotWidth / 2}
          y={height - 4}
          textAnchor="middle"
          className="fill-[#64748B] text-[10px] font-medium"
        >
          {chart.xAxisLabel}
        </text>
      </svg>

      {hoveredIdx !== null && chart.points[hoveredIdx] && (
        <div className="mt-1.5 flex items-center gap-4 border-t border-[#F1F5F9] pt-1.5 text-[11px] text-[#334155] tabular-nums">
          <span className="font-mono font-medium">
            {chart.xAxisLabel}: {chart.points[hoveredIdx].xLabel}
          </span>
          <span>
            {chart.seriesALabel}: <strong>{chart.points[hoveredIdx].seriesA}</strong>
          </span>
          {chart.points[hoveredIdx].seriesB !== undefined && (
            <span className="text-[#2563EB]">
              {chart.seriesBLabel}: <strong>{chart.points[hoveredIdx].seriesB}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
