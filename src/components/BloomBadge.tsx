import type { BloomLevel } from '../types/assessment';
import { getBloomMeta } from '../utils/assessment';

interface BloomBadgeProps {
  level: BloomLevel;
  showVerb?: boolean;
}

export function BloomBadge({ level, showVerb = false }: BloomBadgeProps) {
  const meta = getBloomMeta(level);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em] leading-[14px] whitespace-nowrap shrink-0 tabular-nums ${meta.badgeClasses}`}
    >
      <span>{meta.level}</span>
      {showVerb && (
        <>
          <span aria-hidden="true">·</span>
          <span>{meta.verb}</span>
        </>
      )}
    </span>
  );
}
