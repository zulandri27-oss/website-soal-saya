import type {
  GeneratedStimulusPayload,
  StimulusChart,
  StimulusChartPoint,
  StimulusKind,
  StimulusTable,
} from '../types/assessment';

function sanitizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function sanitizeStimulusTable(raw: unknown): StimulusTable | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const candidate = raw as Record<string, unknown>;
  const rawHeaders = Array.isArray(candidate.headers)
    ? candidate.headers.map((h) => String(h ?? '').trim()).filter(Boolean)
    : [];
  const rawRows = Array.isArray(candidate.rows) ? candidate.rows : [];

  if (rawHeaders.length < 2 || rawRows.length < 1) {
    return undefined;
  }

  const rows: string[][] = rawRows
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) =>
      rawHeaders.map((_, idx) => {
        const cell = row[idx];
        return cell === undefined || cell === null ? '—' : String(cell).trim() || '—';
      }),
    );

  if (rows.length === 0) return undefined;

  return {
    caption: sanitizeString(candidate.caption, 'Data Stimulus'),
    headers: rawHeaders,
    rows,
  };
}

function sanitizeStimulusChart(raw: unknown): StimulusChart | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const candidate = raw as Record<string, unknown>;
  const rawPoints = Array.isArray(candidate.points) ? candidate.points : [];

  const points: StimulusChartPoint[] = [];
  for (const pt of rawPoints) {
    if (!pt || typeof pt !== 'object') continue;
    const rec = pt as Record<string, unknown>;
    const xLabel = sanitizeString(rec.xLabel);
    const seriesA = Number(rec.seriesA);
    if (!xLabel || !Number.isFinite(seriesA)) continue;

    const point: StimulusChartPoint = { xLabel, seriesA };
    if (rec.seriesB !== undefined && rec.seriesB !== null && rec.seriesB !== '') {
      const seriesB = Number(rec.seriesB);
      if (Number.isFinite(seriesB)) {
        point.seriesB = seriesB;
      }
    }
    points.push(point);
  }

  if (points.length < 2) {
    return undefined;
  }

  return {
    title: sanitizeString(candidate.title, 'Grafik Data Stimulus'),
    xAxisLabel: sanitizeString(candidate.xAxisLabel, 'Variabel X'),
    yAxisLabel: sanitizeString(candidate.yAxisLabel, 'Nilai'),
    seriesALabel: sanitizeString(candidate.seriesALabel, 'Seri A'),
    seriesBLabel: sanitizeString(candidate.seriesBLabel) || undefined,
    points,
  };
}

export function normalizeGeneratedStimulus(
  raw: Record<string, unknown>,
  fallbackTopic = 'Topik Asesmen',
): GeneratedStimulusPayload {
  const requestedKind = raw.stimulusKind as StimulusKind | undefined;
  const stimulusTable = sanitizeStimulusTable(raw.stimulusTable);
  const stimulusChart = sanitizeStimulusChart(raw.stimulusChart);

  let stimulusKind: Exclude<StimulusKind, 'none'> = 'passage';
  if (requestedKind === 'chart-series' && stimulusChart) {
    stimulusKind = 'chart-series';
  } else if (requestedKind === 'data-table' && stimulusTable) {
    stimulusKind = 'data-table';
  } else if (stimulusChart && requestedKind !== 'passage' && requestedKind !== 'data-table') {
    stimulusKind = 'chart-series';
  } else if (stimulusTable && requestedKind !== 'passage') {
    stimulusKind = 'data-table';
  }

  return {
    stimulusKind,
    stimulusTitle: sanitizeString(raw.stimulusTitle, `Stimulus Kontekstual: ${fallbackTopic}`),
    stimulusText: sanitizeString(
      raw.stimulusText,
      `Perhatikan konteks kajian mengenai ${fallbackTopic} berikut untuk menjawab pertanyaan asesmen.`,
    ),
    stimulusSource: sanitizeString(raw.stimulusSource, 'EduSoal AI · Gemini Stimulus Engine'),
    stimulusTable: stimulusKind === 'data-table' ? stimulusTable : undefined,
    stimulusChart: stimulusKind === 'chart-series' ? stimulusChart : undefined,
  };
}

export function formatStimulusForPrompt(stimulus: GeneratedStimulusPayload): string {
  const lines: string[] = [
    `Title: ${stimulus.stimulusTitle}`,
    `Source: ${stimulus.stimulusSource}`,
    `Narrative:\n${stimulus.stimulusText}`,
  ];

  if (stimulus.stimulusTable) {
    lines.push(`Table Caption: ${stimulus.stimulusTable.caption}`);
    lines.push(`Table Headers: ${stimulus.stimulusTable.headers.join(' | ')}`);
    for (const row of stimulus.stimulusTable.rows) {
      lines.push(`Row: ${row.join(' | ')}`);
    }
  }

  if (stimulus.stimulusChart) {
    lines.push(`Chart Title: ${stimulus.stimulusChart.title}`);
    lines.push(
      `Axes: X=${stimulus.stimulusChart.xAxisLabel}, Y=${stimulus.stimulusChart.yAxisLabel}`,
    );
    lines.push(
      `Points: ${stimulus.stimulusChart.points
        .map((p) =>
          p.seriesB !== undefined
            ? `${p.xLabel} (${stimulus.stimulusChart!.seriesALabel}=${p.seriesA}, ${stimulus.stimulusChart!.seriesBLabel ?? 'Seri B'}=${p.seriesB})`
            : `${p.xLabel} (${stimulus.stimulusChart!.seriesALabel}=${p.seriesA})`,
        )
        .join('; ')}`,
    );
  }

  return lines.join('\n');
}
