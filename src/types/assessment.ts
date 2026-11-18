export type BloomLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export type BloomGroup = 'all' | 'C1-C2' | 'C3-C4' | 'C5-C6';

export type ItemType = 'multiple-choice' | 'short-essay' | 'case-analysis';

export type ItemStatus = 'verified' | 'draft';

export type StimulusKind = 'passage' | 'data-table' | 'chart-series' | 'none';

export type StimulusFormatPreference = 'auto' | 'passage' | 'data-table' | 'chart-series';

export interface GeneratedStimulusPayload {
  stimulusKind: Exclude<StimulusKind, 'none'>;
  stimulusTitle: string;
  stimulusText: string;
  stimulusSource: string;
  stimulusTable?: StimulusTable;
  stimulusChart?: StimulusChart;
}

export type WorkspaceScreen = 'studio' | 'generator' | 'matrix' | 'rubrics';

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
  distractorNote: string;
}

export interface StimulusTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface StimulusChartPoint {
  xLabel: string;
  seriesA: number;
  seriesB?: number;
}

export interface StimulusChart {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  seriesALabel: string;
  seriesBLabel?: string;
  points: StimulusChartPoint[];
}

export interface RubricLevelDescriptors {
  exemplary: string;
  proficient: string;
  developing: string;
  emerging: string;
}

export interface RubricCriterion {
  id: string;
  criterion: string;
  maxPoints: number;
  levels: RubricLevelDescriptors;
}

export interface AssessmentItem {
  id: string;
  code: string;
  subject: string;
  gradeLevel: string;
  curriculumCode: string;
  topic: string;
  learningObjective: string;
  bloomLevel: BloomLevel;
  itemType: ItemType;
  status: ItemStatus;
  stimulusKind: StimulusKind;
  stimulusTitle?: string;
  stimulusText?: string;
  stimulusSource?: string;
  stimulusTable?: StimulusTable;
  stimulusChart?: StimulusChart;
  stem: string;
  options: QuestionOption[];
  correctOptionId: string;
  modelAnswer: string;
  pedagogicalExplanation: string;
  difficultyIndex: number; // 0.00 - 1.00 (proportion answering correctly)
  discriminationIndex: number; // -1.00 - 1.00
  estimatedMinutes: number;
  points: number;
  rubric: RubricCriterion[];
  inExamPaper: boolean;
  updatedAt: string;
}

export type RubricTierKey = 'exemplary' | 'proficient' | 'developing' | 'emerging';

export interface GeneratorFormInput {
  subject: string;
  gradeLevel: string;
  curriculumStandard: string;
  topic: string;
  sourceMaterial: string;
  bloomLevel: BloomLevel;
  itemType: ItemType;
  count: number;
}
