export const RELIGION_OPTIONS = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Khonghucu',
] as const;

export type ReligionOption = (typeof RELIGION_OPTIONS)[number];

export const SENI_PRAKARYA_OPTIONS = [
  'Seni Musik',
  'Seni Rupa',
  'Seni Teater',
  'Seni Tari',
  'Prakarya & Kewirausahaan',
] as const;

export type SeniPrakaryaOption = (typeof SENI_PRAKARYA_OPTIONS)[number];

export interface SubjectCatalogEntry {
  id: string;
  label: string;
  shortCode: string;
  requiresReligion?: boolean;
  requiresSeniPrakarya?: boolean;
}

export const CURRICULUM_SUBJECTS: SubjectCatalogEntry[] = [
  {
    id: 'agama',
    label: 'Pendidikan Agama dan Budi Pekerti',
    shortCode: 'PAB',
    requiresReligion: true,
  },
  {
    id: 'pancasila',
    label: 'Pendidikan Pancasila',
    shortCode: 'PPK',
  },
  {
    id: 'bahasa-indonesia',
    label: 'Bahasa Indonesia',
    shortCode: 'IND',
  },
  {
    id: 'matematika',
    label: 'Matematika',
    shortCode: 'MAT',
  },
  {
    id: 'bahasa-inggris',
    label: 'Bahasa Inggris',
    shortCode: 'ENG',
  },
  {
    id: 'pjok',
    label: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    shortCode: 'PJK',
  },
  {
    id: 'sejarah',
    label: 'Sejarah',
    shortCode: 'SEJ',
  },
  {
    id: 'informatika',
    label: 'Informatika',
    shortCode: 'INF',
  },
  {
    id: 'fisika',
    label: 'Fisika',
    shortCode: 'FIS',
  },
  {
    id: 'kimia',
    label: 'Kimia',
    shortCode: 'KIM',
  },
  {
    id: 'biologi',
    label: 'Biologi',
    shortCode: 'BIO',
  },
  {
    id: 'sosiologi',
    label: 'Sosiologi',
    shortCode: 'SOS',
  },
  {
    id: 'ekonomi',
    label: 'Ekonomi',
    shortCode: 'EKO',
  },
  {
    id: 'geografi',
    label: 'Geografi',
    shortCode: 'GEO',
  },
  {
    id: 'seni-prakarya',
    label: 'Seni dan Prakarya',
    shortCode: 'SNP',
    requiresSeniPrakarya: true,
  },
];

export function formatSubjectLabel(
  baseSubject: string,
  religion?: string,
  seniPrakaryaSelections?: string[],
): string {
  if (baseSubject === 'Pendidikan Agama dan Budi Pekerti' && religion?.trim()) {
    return `${baseSubject} (${religion.trim()})`;
  }
  if (
    baseSubject === 'Seni dan Prakarya' &&
    seniPrakaryaSelections &&
    seniPrakaryaSelections.length > 0
  ) {
    return `${baseSubject} — ${seniPrakaryaSelections.join(', ')}`;
  }
  return baseSubject;
}

export function getSubjectShortCode(subjectLabel: string): string {
  const matched = CURRICULUM_SUBJECTS.find((s) => subjectLabel.startsWith(s.label));
  if (matched) return matched.shortCode;
  return subjectLabel.slice(0, 3).toUpperCase() || 'GEN';
}

export interface GradeLevelOption {
  value: string;
  label: string;
  stage: 'SD' | 'SMP' | 'SMA';
  fase: string;
}

export const GRADE_LEVELS: GradeLevelOption[] = [
  { value: 'Kelas 1 SD · Fase A', label: 'Kelas 1 SD (Fase A)', stage: 'SD', fase: 'Fase A' },
  { value: 'Kelas 2 SD · Fase A', label: 'Kelas 2 SD (Fase A)', stage: 'SD', fase: 'Fase A' },
  { value: 'Kelas 3 SD · Fase B', label: 'Kelas 3 SD (Fase B)', stage: 'SD', fase: 'Fase B' },
  { value: 'Kelas 4 SD · Fase B', label: 'Kelas 4 SD (Fase B)', stage: 'SD', fase: 'Fase B' },
  { value: 'Kelas 5 SD · Fase C', label: 'Kelas 5 SD (Fase C)', stage: 'SD', fase: 'Fase C' },
  { value: 'Kelas 6 SD · Fase C', label: 'Kelas 6 SD (Fase C)', stage: 'SD', fase: 'Fase C' },
  { value: 'Kelas 7 SMP · Fase D', label: 'Kelas 7 SMP (Fase D)', stage: 'SMP', fase: 'Fase D' },
  { value: 'Kelas 8 SMP · Fase D', label: 'Kelas 8 SMP (Fase D)', stage: 'SMP', fase: 'Fase D' },
  { value: 'Kelas 9 SMP · Fase D', label: 'Kelas 9 SMP (Fase D)', stage: 'SMP', fase: 'Fase D' },
  { value: 'Kelas 10 SMA · Fase E', label: 'Kelas 10 SMA (Fase E)', stage: 'SMA', fase: 'Fase E' },
  { value: 'Kelas 11 SMA · Fase F', label: 'Kelas 11 SMA (Fase F)', stage: 'SMA', fase: 'Fase F' },
  { value: 'Kelas 12 SMA · Fase F', label: 'Kelas 12 SMA (Fase F)', stage: 'SMA', fase: 'Fase F' },
];

