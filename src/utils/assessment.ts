import type {
  AssessmentItem,
  BloomGroup,
  BloomLevel,
  GeneratorFormInput,
  ItemStatus,
  RubricCriterion,
  RubricTierKey,
} from '../types/assessment';

export interface BloomMeta {
  level: BloomLevel;
  verb: string;
  category: string;
  tier: Exclude<BloomGroup, 'all'>;
  badgeClasses: string;
  barColor: string;
}

const BLOOM_META_MAP: Record<BloomLevel, BloomMeta> = {
  C1: {
    level: 'C1',
    verb: 'Remember',
    category: 'Recall',
    tier: 'C1-C2',
    badgeClasses: 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
    barColor: '#64748B',
  },
  C2: {
    level: 'C2',
    verb: 'Understand',
    category: 'Comprehension',
    tier: 'C1-C2',
    badgeClasses: 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
    barColor: '#475569',
  },
  C3: {
    level: 'C3',
    verb: 'Apply',
    category: 'Application',
    tier: 'C3-C4',
    badgeClasses: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    barColor: '#F59E0B',
  },
  C4: {
    level: 'C4',
    verb: 'Analyze',
    category: 'Analysis',
    tier: 'C3-C4',
    badgeClasses: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    barColor: '#D97706',
  },
  C5: {
    level: 'C5',
    verb: 'Evaluate',
    category: 'Evaluation',
    tier: 'C5-C6',
    badgeClasses: 'bg-[#FFF7ED] text-[#9A3412] border-[#FED7AA]',
    barColor: '#EA580C',
  },
  C6: {
    level: 'C6',
    verb: 'Create',
    category: 'Creation',
    tier: 'C5-C6',
    badgeClasses: 'bg-[#FFF7ED] text-[#9A3412] border-[#FED7AA]',
    barColor: '#C2410C',
  },
};

export const ALL_BLOOM_LEVELS: BloomLevel[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

export function getBloomMeta(level: BloomLevel): BloomMeta {
  return BLOOM_META_MAP[level];
}

export function getBloomGroupForLevel(level: BloomLevel): Exclude<BloomGroup, 'all'> {
  return BLOOM_META_MAP[level].tier;
}

export interface ItemFilterOptions {
  query: string;
  bloomGroup: BloomGroup;
  status: 'all' | ItemStatus;
  subject?: string;
  gradeLevel?: string;
}

export function filterAssessmentItems(
  items: AssessmentItem[],
  options: ItemFilterOptions,
): AssessmentItem[] {
  const normalizedQuery = options.query.trim().toLowerCase();

  return items.filter((item) => {
    if (options.bloomGroup !== 'all') {
      if (getBloomGroupForLevel(item.bloomLevel) !== options.bloomGroup) {
        return false;
      }
    }

    if (options.status !== 'all' && item.status !== options.status) {
      return false;
    }

    if (options.subject && options.subject !== 'all') {
      const matchesExact = item.subject === options.subject;
      const matchesPrefix = item.subject.startsWith(`${options.subject} (`) ||
        item.subject.startsWith(`${options.subject} —`);
      if (!matchesExact && !matchesPrefix) {
        return false;
      }
    }

    if (options.gradeLevel && options.gradeLevel !== 'all') {
      if (item.gradeLevel !== options.gradeLevel) {
        return false;
      }
    }

    if (normalizedQuery.length > 0) {
      const searchable = [
        item.code,
        item.subject,
        item.topic,
        item.curriculumCode,
        item.stem,
        item.stimulusTitle ?? '',
      ]
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}

export interface BloomDistributionRow {
  level: BloomLevel;
  verb: string;
  tier: Exclude<BloomGroup, 'all'>;
  count: number;
  percentage: number;
  points: number;
}

export interface BloomDistributionSummary {
  totalItems: number;
  rows: BloomDistributionRow[];
  lotsCount: number; // C1-C2
  applicationCount: number; // C3
  hotsCount: number; // C4-C6
  hotsPercentage: number;
}

export function computeBloomDistribution(items: AssessmentItem[]): BloomDistributionSummary {
  const totalItems = items.length;
  const counts: Record<BloomLevel, { count: number; points: number }> = {
    C1: { count: 0, points: 0 },
    C2: { count: 0, points: 0 },
    C3: { count: 0, points: 0 },
    C4: { count: 0, points: 0 },
    C5: { count: 0, points: 0 },
    C6: { count: 0, points: 0 },
  };

  for (const item of items) {
    counts[item.bloomLevel].count += 1;
    counts[item.bloomLevel].points += item.points;
  }

  const rows: BloomDistributionRow[] = ALL_BLOOM_LEVELS.map((level) => {
    const meta = getBloomMeta(level);
    const { count, points } = counts[level];
    return {
      level,
      verb: meta.verb,
      tier: meta.tier,
      count,
      percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
      points,
    };
  });

  const lotsCount = counts.C1.count + counts.C2.count;
  const applicationCount = counts.C3.count;
  const hotsCount = counts.C4.count + counts.C5.count + counts.C6.count;

  return {
    totalItems,
    rows,
    lotsCount,
    applicationCount,
    hotsCount,
    hotsPercentage: totalItems > 0 ? Math.round((hotsCount / totalItems) * 100) : 0,
  };
}

export interface PaperMetrics {
  itemCount: number;
  totalPoints: number;
  totalMinutes: number;
  avgDifficulty: number;
  avgDiscrimination: number;
  hotsSharePercent: number;
  verifiedCount: number;
}

export function calculatePaperMetrics(items: AssessmentItem[]): PaperMetrics {
  const itemCount = items.length;
  if (itemCount === 0) {
    return {
      itemCount: 0,
      totalPoints: 0,
      totalMinutes: 0,
      avgDifficulty: 0,
      avgDiscrimination: 0,
      hotsSharePercent: 0,
      verifiedCount: 0,
    };
  }

  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  const totalMinutes = items.reduce((sum, item) => sum + item.estimatedMinutes, 0);
  const avgDifficulty =
    Math.round((items.reduce((sum, item) => sum + item.difficultyIndex, 0) / itemCount) * 100) /
    100;
  const avgDiscrimination =
    Math.round(
      (items.reduce((sum, item) => sum + item.discriminationIndex, 0) / itemCount) * 100,
    ) / 100;
  const hotsCount = items.filter((item) =>
    ['C4', 'C5', 'C6'].includes(item.bloomLevel),
  ).length;
  const verifiedCount = items.filter((item) => item.status === 'verified').length;

  return {
    itemCount,
    totalPoints,
    totalMinutes,
    avgDifficulty,
    avgDiscrimination,
    hotsSharePercent: Math.round((hotsCount / itemCount) * 100),
    verifiedCount,
  };
}

export function getDifficultyLabel(p: number): string {
  if (p >= 0.75) return 'Accessible';
  if (p >= 0.45) return 'Balanced';
  if (p >= 0.25) return 'Challenging';
  return 'High Rigor';
}

export function getDiscriminationLabel(d: number): string {
  if (d >= 0.4) return 'Excellent';
  if (d >= 0.3) return 'Good';
  if (d >= 0.2) return 'Marginal';
  return 'Needs Revision';
}

const RUBRIC_WEIGHTS: Record<RubricTierKey, number> = {
  exemplary: 1.0,
  proficient: 0.75,
  developing: 0.5,
  emerging: 0.25,
};

export interface RubricScoreResult {
  earnedPoints: number;
  maxPoints: number;
  percentage: number;
  masteryBand: 'Exemplary' | 'Proficient' | 'Developing' | 'Needs Intervention';
}

export function calculateRubricScore(
  criteria: RubricCriterion[],
  selectedRatings: Record<string, RubricTierKey>,
): RubricScoreResult {
  const maxPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  if (maxPoints === 0) {
    return {
      earnedPoints: 0,
      maxPoints: 0,
      percentage: 0,
      masteryBand: 'Needs Intervention',
    };
  }

  let earnedPoints = 0;
  for (const criterion of criteria) {
    const rating = selectedRatings[criterion.id] ?? 'proficient';
    earnedPoints += criterion.maxPoints * RUBRIC_WEIGHTS[rating];
  }

  const roundedEarned = Math.round(earnedPoints * 10) / 10;
  const percentage = Math.round((roundedEarned / maxPoints) * 100);

  let masteryBand: RubricScoreResult['masteryBand'] = 'Needs Intervention';
  if (percentage >= 85) masteryBand = 'Exemplary';
  else if (percentage >= 70) masteryBand = 'Proficient';
  else if (percentage >= 50) masteryBand = 'Developing';

  return {
    earnedPoints: roundedEarned,
    maxPoints,
    percentage,
    masteryBand,
  };
}

export type GeneratorValidationErrors = Partial<Record<keyof GeneratorFormInput, string>>;

export function validateGeneratorInput(input: GeneratorFormInput): GeneratorValidationErrors {
  const errors: GeneratorValidationErrors = {};

  if (!input.subject.trim()) {
    errors.subject = 'Subject discipline is required.';
  }
  if (!input.gradeLevel.trim()) {
    errors.gradeLevel = 'Grade or phase level is required.';
  }
  if (!input.topic.trim() || input.topic.trim().length < 3) {
    errors.topic = 'Enter a specific topic or learning concept (min. 3 characters).';
  }
  if (input.count < 1 || input.count > 5) {
    errors.count = 'Generate between 1 and 5 items per batch.';
  }

  return errors;
}
