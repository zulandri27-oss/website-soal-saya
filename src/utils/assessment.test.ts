import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePaperMetrics,
  calculateRubricScore,
  computeBloomDistribution,
  filterAssessmentItems,
  getBloomMeta,
  getDifficultyLabel,
  getDiscriminationLabel,
  validateGeneratorInput,
} from './assessment';
import { SEED_ITEMS } from '../data/seedItems';

test('getBloomMeta assigns accurate tier and design-system classes across C1-C6', () => {
  assert.equal(getBloomMeta('C1').tier, 'C1-C2');
  assert.equal(getBloomMeta('C2').verb, 'Understand');
  assert.equal(getBloomMeta('C3').tier, 'C3-C4');
  assert.equal(getBloomMeta('C4').category, 'Analysis');
  assert.equal(getBloomMeta('C5').tier, 'C5-C6');
  assert.equal(getBloomMeta('C6').verb, 'Create');
});

test('filterAssessmentItems filters by query, Bloom group, and verification status', () => {
  const all = filterAssessmentItems(SEED_ITEMS, {
    query: '',
    bloomGroup: 'all',
    status: 'all',
  });
  assert.equal(all.length, SEED_ITEMS.length);

  const analysisItems = filterAssessmentItems(SEED_ITEMS, {
    query: '',
    bloomGroup: 'C3-C4',
    status: 'all',
  });
  assert.ok(analysisItems.length > 0);
  assert.ok(analysisItems.every((i) => i.bloomLevel === 'C3' || i.bloomLevel === 'C4'));

  const searchBio = filterAssessmentItems(SEED_ITEMS, {
    query: 'enzyme',
    bloomGroup: 'all',
    status: 'all',
  });
  assert.ok(searchBio.some((i) => i.subject === 'Biologi'));

  const draftsOnly = filterAssessmentItems(SEED_ITEMS, {
    query: '',
    bloomGroup: 'all',
    status: 'draft',
  });
  assert.ok(draftsOnly.every((i) => i.status === 'draft'));

  const bySubject = filterAssessmentItems(SEED_ITEMS, {
    query: '',
    bloomGroup: 'all',
    status: 'all',
    subject: 'Ekonomi',
  });
  assert.ok(bySubject.length > 0 && bySubject.every((i) => i.subject === 'Ekonomi'));
});

test('computeBloomDistribution totals counts, percentages, and HOTS share', () => {
  const summary = computeBloomDistribution(SEED_ITEMS);
  assert.equal(summary.totalItems, SEED_ITEMS.length);
  assert.equal(summary.rows.length, 6);
  const sumCounts = summary.rows.reduce((acc, row) => acc + row.count, 0);
  assert.equal(sumCounts, SEED_ITEMS.length);
  assert.equal(
    summary.lotsCount + summary.applicationCount + summary.hotsCount,
    SEED_ITEMS.length,
  );
});

test('calculatePaperMetrics handles empty and populated item arrays accurately', () => {
  const empty = calculatePaperMetrics([]);
  assert.equal(empty.itemCount, 0);
  assert.equal(empty.totalPoints, 0);

  const subset = SEED_ITEMS.slice(0, 3);
  const metrics = calculatePaperMetrics(subset);
  assert.equal(metrics.itemCount, 3);
  assert.equal(
    metrics.totalPoints,
    subset.reduce((s, item) => s + item.points, 0),
  );
  assert.equal(
    metrics.totalMinutes,
    subset.reduce((s, item) => s + item.estimatedMinutes, 0),
  );
  assert.ok(metrics.avgDifficulty > 0 && metrics.avgDifficulty <= 1);
});

test('psychometric difficulty and discrimination labels classify accurately', () => {
  assert.equal(getDifficultyLabel(0.8), 'Accessible');
  assert.equal(getDifficultyLabel(0.55), 'Balanced');
  assert.equal(getDifficultyLabel(0.32), 'Challenging');
  assert.equal(getDiscriminationLabel(0.45), 'Excellent');
  assert.equal(getDiscriminationLabel(0.34), 'Good');
  assert.equal(getDiscriminationLabel(0.15), 'Needs Revision');
});

test('calculateRubricScore computes weighted criteria totals and mastery band', () => {
  const criteria = [
    {
      id: 'r1',
      criterion: 'Hypothesis Justification',
      maxPoints: 4,
      levels: {
        exemplary: 'Complete',
        proficient: 'Solid',
        developing: 'Partial',
        emerging: 'Minimal',
      },
    },
    {
      id: 'r2',
      criterion: 'Empirical Evidence',
      maxPoints: 4,
      levels: {
        exemplary: 'Complete',
        proficient: 'Solid',
        developing: 'Partial',
        emerging: 'Minimal',
      },
    },
  ];

  const topScore = calculateRubricScore(criteria, { r1: 'exemplary', r2: 'exemplary' });
  assert.equal(topScore.earnedPoints, 8);
  assert.equal(topScore.maxPoints, 8);
  assert.equal(topScore.percentage, 100);
  assert.equal(topScore.masteryBand, 'Exemplary');

  const mixedScore = calculateRubricScore(criteria, { r1: 'developing', r2: 'emerging' });
  assert.equal(mixedScore.earnedPoints, 3);
  assert.equal(mixedScore.percentage, 38);
  assert.equal(mixedScore.masteryBand, 'Needs Intervention');
});

test('validateGeneratorInput rejects empty topic and out-of-range item count', () => {
  const invalid = validateGeneratorInput({
    subject: '',
    gradeLevel: 'Grade 11',
    curriculumStandard: 'NGSS',
    topic: 'ab',
    sourceMaterial: '',
    bloomLevel: 'C4',
    itemType: 'multiple-choice',
    count: 9,
  });
  assert.ok(invalid.subject);
  assert.ok(invalid.topic);
  assert.ok(invalid.count);

  const valid = validateGeneratorInput({
    subject: 'Biologi',
    gradeLevel: 'Grade 11',
    curriculumStandard: 'Fase F',
    topic: 'Cellular Respiration ATP Yield',
    sourceMaterial: '',
    bloomLevel: 'C4',
    itemType: 'multiple-choice',
    count: 2,
  });
  assert.deepEqual(valid, {});
});

import {
  CURRICULUM_SUBJECTS,
  GRADE_LEVELS,
  formatSubjectLabel,
  getSubjectShortCode,
} from '../data/subjects';

test('CURRICULUM_SUBJECTS includes all 15 requested subjects and formats sub-options cleanly', () => {
  assert.equal(CURRICULUM_SUBJECTS.length, 15);
  assert.equal(
    formatSubjectLabel('Pendidikan Agama dan Budi Pekerti', 'Islam'),
    'Pendidikan Agama dan Budi Pekerti (Islam)',
  );
  assert.equal(
    formatSubjectLabel('Seni dan Prakarya', undefined, ['Seni Rupa', 'Prakarya & Kewirausahaan']),
    'Seni dan Prakarya — Seni Rupa, Prakarya & Kewirausahaan',
  );
  assert.equal(getSubjectShortCode('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)'), 'PJK');
  assert.equal(getSubjectShortCode('Informatika'), 'INF');
});

import {
  formatStimulusForPrompt,
  normalizeGeneratedStimulus,
} from './stimulus';

test('GRADE_LEVELS spans Kelas 1 SD through Kelas 12 SMA and filters accurately', () => {
  assert.equal(GRADE_LEVELS.length, 12);
  assert.equal(GRADE_LEVELS[0].value, 'Kelas 1 SD · Fase A');
  assert.equal(GRADE_LEVELS[5].value, 'Kelas 6 SD · Fase C');
  assert.equal(GRADE_LEVELS[6].value, 'Kelas 7 SMP · Fase D');
  assert.equal(GRADE_LEVELS[11].value, 'Kelas 12 SMA · Fase F');

  const grade12Only = filterAssessmentItems(SEED_ITEMS, {
    query: '',
    bloomGroup: 'all',
    status: 'all',
    gradeLevel: 'Kelas 12 SMA · Fase F',
  });
  assert.ok(grade12Only.length > 0);
  assert.ok(grade12Only.every((i) => i.gradeLevel === 'Kelas 12 SMA · Fase F'));
});

test('normalizeGeneratedStimulus handles data-table, chart-series, and malformed fallbacks cleanly', () => {
  const tableStimulus = normalizeGeneratedStimulus(
    {
      stimulusKind: 'data-table',
      stimulusTitle: 'Laju Reaksi Katalase',
      stimulusSource: 'Lab Biologi SMA',
      stimulusText: 'Data pengamatan gelembung oksigen.',
      stimulusTable: {
        caption: 'Pengamatan pH vs Laju',
        headers: ['pH', 'Laju (ml/s)', 'Keterangan'],
        rows: [
          ['4', '0.2'],
          ['7', '2.5', 'Optimal'],
        ],
      },
    },
    'Enzim Katalase',
  );
  assert.equal(tableStimulus.stimulusKind, 'data-table');
  assert.equal(tableStimulus.stimulusTable?.rows[0].length, 3);
  assert.equal(tableStimulus.stimulusTable?.rows[0][2], '—');

  const chartStimulus = normalizeGeneratedStimulus({
    stimulusKind: 'chart-series',
    stimulusTitle: 'Kurva Pertumbuhan',
    stimulusText: 'Grafik pertumbuhan harian.',
    stimulusChart: {
      title: 'Tinggi Tanaman',
      xAxisLabel: 'Hari',
      yAxisLabel: 'cm',
      seriesALabel: 'Pupuk Organik',
      points: [
        { xLabel: 'H1', seriesA: 2 },
        { xLabel: 'H3', seriesA: 5.5, seriesB: 4.1 },
      ],
    },
  });
  assert.equal(chartStimulus.stimulusKind, 'chart-series');
  assert.equal(chartStimulus.stimulusChart?.points.length, 2);
  assert.ok(formatStimulusForPrompt(chartStimulus).includes('Pupuk Organik=5.5'));

  const malformedChart = normalizeGeneratedStimulus(
    {
      stimulusKind: 'chart-series',
      stimulusText: 'Narasi tanpa titik data cukup.',
      stimulusChart: {
        title: 'Kosong',
        points: [{ xLabel: 'H1', seriesA: 2 }],
      },
    },
    'Ekosistem',
  );
  assert.equal(malformedChart.stimulusKind, 'passage');
  assert.equal(malformedChart.stimulusChart, undefined);
});

import { HttpError, parseGeminiError } from '../../server/geminiService';

test('server geminiService parseGeminiError maps HttpError and upstream 503 JSON cleanly', () => {
  const validationErr = parseGeminiError(new HttpError(400, 'Input tidak valid'), 'fallback');
  assert.equal(validationErr.status, 400);
  assert.equal(validationErr.message, 'Input tidak valid');

  const overloadErr = parseGeminiError(
    new Error(
      JSON.stringify({
        error: { code: 503, message: 'High demand', status: 'UNAVAILABLE' },
      }),
    ),
    'fallback',
  );
  assert.equal(overloadErr.status, 503);
  assert.ok(overloadErr.message.includes('lonjakan permintaan'));
});
