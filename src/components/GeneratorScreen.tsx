import { useState } from 'react';
import { ArrowRight, Check, FilePlus2, Sparkles, Trash2 } from 'lucide-react';
import type {
  AssessmentItem,
  BloomLevel,
  GeneratedStimulusPayload,
  GeneratorFormInput,
  ItemType,
  StimulusFormatPreference,
} from '../types/assessment';
import {
  CURRICULUM_SUBJECTS,
  GRADE_LEVELS,
  RELIGION_OPTIONS,
  SENI_PRAKARYA_OPTIONS,
  formatSubjectLabel,
  getSubjectShortCode,
} from '../data/subjects';
import {
  ALL_BLOOM_LEVELS,
  getBloomMeta,
  validateGeneratorInput,
  type GeneratorValidationErrors,
} from '../utils/assessment';
import {
  formatStimulusForPrompt,
  normalizeGeneratedStimulus,
} from '../utils/stimulus';
import { BloomBadge } from './BloomBadge';
import { StimulusChartSvg } from './StimulusChartSvg';
import { StimulusTableBlock } from './StimulusTableBlock';

interface GeneratorScreenProps {
  onSaveGeneratedItem: (item: AssessmentItem, openInStudio: boolean) => void;
  onCreateBlankAndOpenStudio: (seed?: Partial<GeneratorFormInput>) => void;
}

const DEFAULT_FORM: GeneratorFormInput = {
  subject: 'Biologi',
  gradeLevel: 'Kelas 11 SMA · Fase F',
  curriculumStandard: 'BIO-F.11.5 / NGSS HS-LS1-5',
  topic: 'Photosynthetic Light-Dependent Reactions & ATP Synthase',
  sourceMaterial: '',
  bloomLevel: 'C4',
  itemType: 'multiple-choice',
  count: 2,
};

export function GeneratorScreen({
  onSaveGeneratedItem,
  onCreateBlankAndOpenStudio,
}: GeneratorScreenProps) {
  const [form, setForm] = useState<GeneratorFormInput>(DEFAULT_FORM);
  const [baseSubject, setBaseSubject] = useState<string>('Biologi');
  const [religion, setReligion] = useState<string>(RELIGION_OPTIONS[0]);
  const [seniSelections, setSeniSelections] = useState<string[]>([
    SENI_PRAKARYA_OPTIONS[0],
  ]);
  const [errors, setErrors] = useState<GeneratorValidationErrors>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [stagedItems, setStagedItems] = useState<AssessmentItem[]>([]);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  // Automatic Gemini Stimulus state
  const [preferredStimulusKind, setPreferredStimulusKind] =
    useState<StimulusFormatPreference>('auto');
  const [generatedStimulus, setGeneratedStimulus] =
    useState<GeneratedStimulusPayload | null>(null);
  const [isGeneratingStimulus, setIsGeneratingStimulus] = useState(false);
  const [stimulusError, setStimulusError] = useState<string | null>(null);

  function buildResolvedForm(): GeneratorFormInput {
    return {
      ...form,
      subject: formatSubjectLabel(baseSubject, religion, seniSelections),
    };
  }

  function handleBaseSubjectChange(nextBase: string) {
    setBaseSubject(nextBase);
    const resolved = formatSubjectLabel(nextBase, religion, seniSelections);
    setForm((prev) => ({ ...prev, subject: resolved }));
    if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
  }

  function handleReligionChange(nextReligion: string) {
    setReligion(nextReligion);
    setForm((prev) => ({
      ...prev,
      subject: formatSubjectLabel(baseSubject, nextReligion, seniSelections),
    }));
  }

  function handleToggleSeniOption(option: string) {
    const exists = seniSelections.includes(option);
    const next = exists
      ? seniSelections.filter((item) => item !== option)
      : [...seniSelections, option];
    setSeniSelections(next);
    setForm((prev) => ({
      ...prev,
      subject: formatSubjectLabel(baseSubject, religion, next),
    }));
    if (next.length > 0 && errors.subject) {
      setErrors((prev) => ({ ...prev, subject: undefined }));
    }
  }

  async function handleGenerateStimulus() {
    const resolvedForm = buildResolvedForm();
    const validationErrors = validateGeneratorInput(resolvedForm);
    if (baseSubject === 'Seni dan Prakarya' && seniSelections.length === 0) {
      validationErrors.subject =
        'Pilih minimal satu bidang: Seni Musik, Seni Rupa, Seni Teater, Seni Tari, atau Prakarya & Kewirausahaan.';
    }
    if (validationErrors.subject || validationErrors.gradeLevel || validationErrors.topic) {
      setErrors(validationErrors);
      return;
    }

    setIsGeneratingStimulus(true);
    setStimulusError(null);

    try {
      const response = await fetch('/api/stimulus/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: resolvedForm.subject,
          gradeLevel: resolvedForm.gradeLevel,
          curriculumStandard: resolvedForm.curriculumStandard,
          topic: resolvedForm.topic,
          bloomLevel: resolvedForm.bloomLevel,
          preferredKind: preferredStimulusKind,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat stimulus otomatis dengan Gemini.');
      }

      const normalizedStimulus = normalizeGeneratedStimulus(
        (data.stimulus ?? {}) as Record<string, unknown>,
        resolvedForm.topic,
      );
      setGeneratedStimulus(normalizedStimulus);
      setForm((prev) => ({
        ...prev,
        sourceMaterial: formatStimulusForPrompt(normalizedStimulus),
      }));
    } catch (err) {
      setStimulusError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghubungi Gemini untuk membuat stimulus.',
      );
    } finally {
      setIsGeneratingStimulus(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resolvedForm = buildResolvedForm();
    const validationErrors = validateGeneratorInput(resolvedForm);
    if (baseSubject === 'Seni dan Prakarya' && seniSelections.length === 0) {
      validationErrors.subject =
        'Pilih minimal satu bidang: Seni Musik, Seni Rupa, Seni Teater, Seni Tari, atau Prakarya & Kewirausahaan.';
    }
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsGenerating(true);
    setApiError(null);

    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resolvedForm,
          anchoredStimulus: generatedStimulus ?? undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate assessment items.');
      }

      const rawItems = Array.isArray(data.items) ? data.items : [];
      const shortCode = getSubjectShortCode(resolvedForm.subject);
      const normalized: AssessmentItem[] = rawItems.map(
        (raw: Record<string, unknown>, idx: number) => {
          const itemStimulus = generatedStimulus
            ? generatedStimulus
            : raw.stimulusText || raw.stimulusTable || raw.stimulusChart
              ? normalizeGeneratedStimulus(raw, resolvedForm.topic)
              : null;

          return {
            id: `gen-${Date.now()}-${idx}`,
            code:
              typeof raw.code === 'string' && raw.code.trim()
                ? raw.code
                : `ITEM-${shortCode}-${Math.floor(100 + Math.random() * 899)}`,
            subject: resolvedForm.subject.trim(),
            gradeLevel: resolvedForm.gradeLevel.trim(),
            curriculumCode: resolvedForm.curriculumStandard.trim() || 'CUSTOM-STD',
            topic: typeof raw.topic === 'string' ? raw.topic : resolvedForm.topic.trim(),
            learningObjective:
              typeof raw.learningObjective === 'string'
                ? raw.learningObjective
                : `Demonstrate ${getBloomMeta(resolvedForm.bloomLevel).verb.toLowerCase()}-level mastery of ${resolvedForm.topic}.`,
            bloomLevel: ALL_BLOOM_LEVELS.includes(raw.bloomLevel as BloomLevel)
              ? (raw.bloomLevel as BloomLevel)
              : resolvedForm.bloomLevel,
            itemType: resolvedForm.itemType,
            status: 'draft',
            stimulusKind: itemStimulus ? itemStimulus.stimulusKind : 'none',
            stimulusTitle: itemStimulus?.stimulusTitle,
            stimulusText: itemStimulus?.stimulusText,
            stimulusSource: itemStimulus?.stimulusSource ?? 'EduSoal AI Generator',
            stimulusTable: itemStimulus?.stimulusTable,
            stimulusChart: itemStimulus?.stimulusChart,
            stem: typeof raw.stem === 'string' ? raw.stem : '',
            options: Array.isArray(raw.options) ? raw.options : [],
            correctOptionId:
              typeof raw.correctOptionId === 'string' ? raw.correctOptionId : '',
            modelAnswer:
              typeof raw.modelAnswer === 'string' ? raw.modelAnswer : '',
            pedagogicalExplanation:
              typeof raw.pedagogicalExplanation === 'string'
                ? raw.pedagogicalExplanation
                : '',
            difficultyIndex:
              typeof raw.difficultyIndex === 'number' ? raw.difficultyIndex : 0.5,
            discriminationIndex:
              typeof raw.discriminationIndex === 'number'
                ? raw.discriminationIndex
                : 0.35,
            estimatedMinutes:
              typeof raw.estimatedMinutes === 'number' ? raw.estimatedMinutes : 3,
            points: typeof raw.points === 'number' ? raw.points : 4,
            rubric: Array.isArray(raw.rubric) ? raw.rubric : [],
            inExamPaper: false,
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        },
      );

      setStagedItems(normalized);
      setSavedIds({});
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : 'Unexpected error while calling the AI generator.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSave(item: AssessmentItem, openInStudio: boolean) {
    onSaveGeneratedItem(item, openInStudio);
    setSavedIds((prev) => ({ ...prev, [item.id]: true }));
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-[-0.015em] text-[#0F172A]">
            AI Item Generator
          </h1>
          <p className="mt-0.5 text-[14px] text-[#475569]">
            Configure curriculum parameters and Bloom cognitive depth to synthesize calibrated assessment items.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onCreateBlankAndOpenStudio(buildResolvedForm())}
          className="inline-flex items-center gap-1.5 rounded border border-[#E2E8F0] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#0F172A] whitespace-nowrap shrink-0 hover:bg-[#F1F5F9] transition-colors"
        >
          <FilePlus2 className="h-4 w-4 text-[#475569]" />
          <span>Author Manual Item Instead</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 5 COLS: Generator Parameter Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-5 rounded border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] space-y-4"
        >
          <div className="border-b border-[#F1F5F9] pb-3">
            <h2 className="font-display text-[15px] font-semibold text-[#0F172A]">
              Pedagogical Specification
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gen-subject"
                className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]"
              >
                Mata Pelajaran
              </label>
              <select
                id="gen-subject"
                value={baseSubject}
                onChange={(e) => handleBaseSubjectChange(e.target.value)}
                className={`mt-1 w-full rounded border bg-white px-3 py-2 text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 ${
                  errors.subject
                    ? 'border-[#BA1A1A] focus:ring-[#BA1A1A]/15'
                    : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-[#2563EB]/12'
                }`}
              >
                {CURRICULUM_SUBJECTS.map((subj) => (
                  <option key={subj.id} value={subj.label}>
                    {subj.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="gen-grade"
                className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]"
              >
                Kelas / Fase
              </label>
              <select
                id="gen-grade"
                value={form.gradeLevel}
                onChange={(e) => {
                  setForm({ ...form, gradeLevel: e.target.value });
                  if (errors.gradeLevel) setErrors({ ...errors, gradeLevel: undefined });
                }}
                className={`mt-1 w-full rounded border bg-white px-3 py-2 text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 ${
                  errors.gradeLevel
                    ? 'border-[#BA1A1A] focus:ring-[#BA1A1A]/15'
                    : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-[#2563EB]/12'
                }`}
              >
                {(['SD', 'SMP', 'SMA'] as const).map((stage) => (
                  <optgroup
                    key={stage}
                    label={
                      stage === 'SD'
                        ? 'SD (Kelas 1–6)'
                        : stage === 'SMP'
                          ? 'SMP (Kelas 7–9)'
                          : 'SMA (Kelas 10–12)'
                    }
                  >
                    {GRADE_LEVELS.filter((g) => g.stage === stage).map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.gradeLevel && (
                <p className="mt-1 text-[12px] font-medium text-[#BA1A1A]">
                  {errors.gradeLevel}
                </p>
              )}
            </div>
          </div>

          {baseSubject === 'Pendidikan Agama dan Budi Pekerti' && (
            <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <label
                htmlFor="gen-religion"
                className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#475569]"
              >
                Pilihan Agama (Sesuai Agama Masing-masing)
              </label>
              <select
                id="gen-religion"
                value={religion}
                onChange={(e) => handleReligionChange(e.target.value)}
                className="mt-1.5 w-full rounded border border-[#CBD5E1] bg-white px-3 py-1.5 text-[13px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                {RELIGION_OPTIONS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>
          )}

          {baseSubject === 'Seni dan Prakarya' && (
            <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#475569]">
                Bidang Seni & Prakarya (Pilih minimal satu)
              </span>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SENI_PRAKARYA_OPTIONS.map((opt) => {
                  const checked = seniSelections.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-[13px] transition-colors ${
                        checked
                          ? 'border-[#2563EB] bg-[#EFF6FF] font-medium text-[#0F172A]'
                          : 'border-[#E2E8F0] bg-white text-[#475569]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleSeniOption(opt)}
                        className="h-4 w-4 rounded border-[#CBD5E1] accent-[#2563EB]"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              {errors.subject && (
                <p className="mt-1.5 text-[12px] font-medium text-[#BA1A1A]">
                  {errors.subject}
                </p>
              )}
            </div>
          )}

          {errors.subject && baseSubject !== 'Seni dan Prakarya' && (
            <p className="text-[12px] font-medium text-[#BA1A1A]">{errors.subject}</p>
          )}

          <div>
            <label
              htmlFor="gen-standard"
              className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]"
            >
              Curriculum Standard / KD Code
            </label>
            <input
              id="gen-standard"
              type="text"
              value={form.curriculumStandard}
              onChange={(e) => setForm({ ...form, curriculumStandard: e.target.value })}
              placeholder="e.g., BIO-F.11.5 / NGSS HS-LS1-5"
              className="mt-1 w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/12"
            />
          </div>

          <div>
            <label
              htmlFor="gen-topic"
              className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]"
            >
              Assessment Topic & Focus
            </label>
            <input
              id="gen-topic"
              type="text"
              value={form.topic}
              onChange={(e) => {
                setForm({ ...form, topic: e.target.value });
                if (errors.topic) setErrors({ ...errors, topic: undefined });
              }}
              placeholder="Specify exact concept or phenomenon to assess..."
              className={`mt-1 w-full rounded border bg-white px-3 py-2 text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 ${
                errors.topic
                  ? 'border-[#BA1A1A] focus:ring-[#BA1A1A]/15'
                  : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-[#2563EB]/12'
              }`}
            />
            {errors.topic && (
              <p className="mt-1 text-[12px] font-medium text-[#BA1A1A]">
                {errors.topic}
              </p>
            )}
          </div>

          {/* Target Bloom Level */}
          <div>
            <span className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]">
              Target Bloom Cognitive Tier
            </span>
            <div className="mt-1.5 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {ALL_BLOOM_LEVELS.map((lvl) => {
                const meta = getBloomMeta(lvl);
                const selected = form.bloomLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setForm({ ...form, bloomLevel: lvl })}
                    aria-pressed={selected}
                    className={`rounded border px-2 py-2 text-center transition-colors ${
                      selected
                        ? 'border-[#2563EB] bg-[#EFF6FF] text-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="font-mono text-[12px] font-bold">{lvl}</div>
                    <div className="mt-0.5 text-[10px] font-medium truncate">
                      {meta.verb}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gen-type"
                className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]"
              >
                Item Format
              </label>
              <select
                id="gen-type"
                value={form.itemType}
                onChange={(e) =>
                  setForm({ ...form, itemType: e.target.value as ItemType })
                }
                className="mt-1 w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="multiple-choice">Multiple Choice (4 Options)</option>
                <option value="case-analysis">Case Study Analysis (MC)</option>
                <option value="short-essay">Constructed Essay + Rubric</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="gen-count"
                className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]"
              >
                Items to Generate (1–5)
              </label>
              <input
                id="gen-count"
                type="number"
                min={1}
                max={5}
                value={form.count}
                onChange={(e) => {
                  setForm({ ...form, count: Number(e.target.value) || 1 });
                  if (errors.count) setErrors({ ...errors, count: undefined });
                }}
                className="mt-1 w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none"
              />
              {errors.count && (
                <p className="mt-1 text-[12px] font-medium text-[#BA1A1A]">
                  {errors.count}
                </p>
              )}
            </div>
          </div>

          <div
            id="gen-stimulus-section"
            className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="gen-source"
                className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]"
              >
                Context Stimulus (Otomatis oleh Gemini)
              </label>
              <span className="text-[11px] text-[#64748B]">
                Wacana, tabel, atau grafik seri
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                id="gen-stimulus-kind"
                aria-label="Format stimulus Gemini"
                value={preferredStimulusKind}
                onChange={(e) =>
                  setPreferredStimulusKind(e.target.value as StimulusFormatPreference)
                }
                className="rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                <option value="auto">Auto (Rekomendasi Gemini)</option>
                <option value="passage">Wacana / Narasi Kasus</option>
                <option value="data-table">Tabel Data Eksperimen</option>
                <option value="chart-series">Grafik Seri Data</option>
              </select>

              <button
                id="btn-auto-stimulus"
                type="button"
                disabled={isGeneratingStimulus || isGenerating}
                onClick={handleGenerateStimulus}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded border border-[#2563EB] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#2563EB] whitespace-nowrap transition-colors hover:bg-[#EFF6FF] disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {isGeneratingStimulus
                    ? 'Membuat Stimulus...'
                    : generatedStimulus
                      ? 'Regenerate Stimulus (Gemini)'
                      : 'Generate Stimulus (Gemini)'}
                </span>
              </button>
            </div>

            {stimulusError && (
              <div
                role="alert"
                className="rounded border border-[#BA1A1A]/30 bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#93000A]"
              >
                {stimulusError}
              </div>
            )}

            {generatedStimulus ? (
              <div className="rounded border border-[#CBD5E1] bg-white p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[#2563EB]">
                      {generatedStimulus.stimulusKind} · {generatedStimulus.stimulusSource}
                    </span>
                    <h3 className="font-display text-[14px] font-semibold text-[#0F172A]">
                      {generatedStimulus.stimulusTitle}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedStimulus(null);
                      setForm((prev) => ({ ...prev, sourceMaterial: '' }));
                    }}
                    className="inline-flex items-center gap-1 rounded border border-[#E2E8F0] px-2 py-1 text-[11px] font-medium text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#BA1A1A]"
                    aria-label="Hapus stimulus"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Hapus</span>
                  </button>
                </div>
                <p className="whitespace-pre-line text-[13px] leading-[20px] text-[#334155]">
                  {generatedStimulus.stimulusText}
                </p>
                {generatedStimulus.stimulusTable && (
                  <StimulusTableBlock table={generatedStimulus.stimulusTable} />
                )}
                {generatedStimulus.stimulusChart && (
                  <StimulusChartSvg chart={generatedStimulus.stimulusChart} />
                )}
              </div>
            ) : (
              <textarea
                id="gen-source"
                rows={3}
                value={form.sourceMaterial}
                onChange={(e) => setForm({ ...form, sourceMaterial: e.target.value })}
                placeholder="Klik 'Generate Stimulus (Gemini)' agar Gemini menyusun stimulus otomatis, atau tempel teks/data sendiri. Jika dibiarkan kosong, Gemini otomatis membuat stimulus saat soal digenerate."
                className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[13px] leading-[20px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/12"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded bg-[#2563EB] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isGenerating ? 'Synthesizing Assessment Items...' : 'Generate Assessment Items'}</span>
          </button>
        </form>

        {/* RIGHT 7 COLS: Staged Output Deck */}
        <section
          aria-label="Generated Items Staging Deck"
          className="lg:col-span-7 space-y-4"
        >
          {apiError && (
            <div
              role="alert"
              className="rounded border border-[#BA1A1A]/30 bg-[#FEF2F2] p-4 text-[13px] text-[#93000A]"
            >
              <p className="font-semibold">AI Generation Unavailable</p>
              <p className="mt-1">{apiError}</p>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-4" aria-busy="true" aria-label="Generating items">
              {[0, 1].map((skeleton) => (
                <div
                  key={skeleton}
                  className="animate-pulse rounded border border-[#E2E8F0] bg-white p-5 space-y-3"
                >
                  <div className="h-4 w-40 rounded bg-[#E2E8F0]" />
                  <div className="h-16 w-full rounded bg-[#F1F5F9]" />
                  <div className="h-4 w-3/4 rounded bg-[#E2E8F0]" />
                  <div className="h-10 w-full rounded bg-[#F1F5F9]" />
                </div>
              ))}
            </div>
          )}

          {!isGenerating && stagedItems.length === 0 && (
            <div className="rounded border border-[#E2E8F0] bg-white p-10 text-center">
              <h2 className="font-display text-[17px] font-semibold text-[#0F172A]">
                Ready to Synthesize Stimulus Items
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[14px] leading-[22px] text-[#64748B]">
                Specify your curriculum standard, topic, and target Bloom Taxonomy tier on the left. Generated items appear here for calibration before entering your Item Bank.
              </p>
            </div>
          )}

          {!isGenerating &&
            stagedItems.map((item) => {
              const isSaved = Boolean(savedIds[item.id]);
              return (
                <article
                  key={item.id}
                  className="rounded border border-[#E2E8F0] bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[12px] font-semibold text-[#0F172A] tabular-nums">
                        {item.code}
                      </span>
                      <BloomBadge level={item.bloomLevel} showVerb />
                      <span className="text-[12px] text-[#64748B] tabular-nums">
                        p={item.difficultyIndex.toFixed(2)} · {item.points} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSaved}
                        onClick={() => handleSave(item, false)}
                        className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                          isSaved
                            ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                            : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Saved to Bank</span>
                          </>
                        ) : (
                          <span>Save to Bank</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(item, true)}
                        className="inline-flex items-center gap-1.5 rounded bg-[#0F172A] px-3 py-1.5 text-[12px] font-semibold text-white whitespace-nowrap hover:bg-[#1E293B]"
                      >
                        <span>Open in Studio</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {(item.stimulusText || item.stimulusTable || item.stimulusChart) && (
                    <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                          Stimulus · {item.stimulusTitle || 'Context Passage'}
                        </p>
                        {item.stimulusSource && (
                          <span className="text-[11px] text-[#64748B]">
                            {item.stimulusSource}
                          </span>
                        )}
                      </div>
                      {item.stimulusText && (
                        <p className="mt-1 whitespace-pre-line text-[14px] leading-[22px] text-[#334155]">
                          {item.stimulusText}
                        </p>
                      )}
                      {item.stimulusTable && (
                        <StimulusTableBlock table={item.stimulusTable} />
                      )}
                      {item.stimulusChart && (
                        <StimulusChartSvg chart={item.stimulusChart} />
                      )}
                    </div>
                  )}

                  <div className="px-5 py-4">
                    <p className="text-[15px] font-medium leading-[24px] text-[#0F172A]">
                      {item.stem}
                    </p>

                    {item.options.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {item.options.map((opt) => {
                          const isKey = opt.id === item.correctOptionId;
                          return (
                            <div
                              key={opt.id}
                              className={`rounded border px-3 py-2 text-[13px] ${
                                isKey
                                  ? 'border-[#059669] bg-[#ECFDF5]'
                                  : 'border-[#E2E8F0] bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>
                                  <strong className="mr-2 font-mono">{opt.label}.</strong>
                                  {opt.text}
                                </span>
                                {isKey && (
                                  <span className="text-[11px] font-semibold uppercase text-[#059669]">
                                    Correct Key
                                  </span>
                                )}
                              </div>
                              {opt.distractorNote && (
                                <p className="mt-1 text-[12px] text-[#475569]">
                                  {opt.distractorNote}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-3 rounded border border-[#E2E8F0] bg-[#ECFDF5]/60 p-3 text-[13px] text-[#0F172A]">
                        <span className="block text-[11px] font-semibold uppercase text-[#059669]">
                          Model Answer
                        </span>
                        <p className="mt-1">{item.modelAnswer}</p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
        </section>
      </div>
    </div>
  );
}
