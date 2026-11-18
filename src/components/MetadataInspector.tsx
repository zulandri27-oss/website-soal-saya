import type { AssessmentItem, BloomLevel } from '../types/assessment';
import {
  ALL_BLOOM_LEVELS,
  getBloomMeta,
  getDifficultyLabel,
  getDiscriminationLabel,
} from '../utils/assessment';
import {
  CURRICULUM_SUBJECTS,
  GRADE_LEVELS,
  RELIGION_OPTIONS,
  SENI_PRAKARYA_OPTIONS,
  formatSubjectLabel,
} from '../data/subjects';
import { BloomBadge } from './BloomBadge';

interface MetadataInspectorProps {
  item: AssessmentItem;
  onUpdateItem: (updated: AssessmentItem) => void;
  onOpenRubrics: () => void;
}

export function MetadataInspector({
  item,
  onUpdateItem,
  onOpenRubrics,
}: MetadataInspectorProps) {
  const bloomMeta = getBloomMeta(item.bloomLevel);

  // Compute miniature Item Characteristic Curve (ICC) SVG path based on difficulty (p) & discrimination (D)
  const p = Math.min(Math.max(item.difficultyIndex, 0.05), 0.95);
  const d = Math.min(Math.max(item.discriminationIndex, 0.1), 0.8);
  const slope = 2 + d * 8;
  const threshold = (0.5 - p) * 2.5;

  const iccPoints = Array.from({ length: 21 }, (_, idx) => {
    const theta = -2.5 + (idx / 20) * 5; // -2.5 to +2.5
    const prob = 1 / (1 + Math.exp(-slope * (theta - threshold)));
    const x = 10 + (idx / 20) * 220;
    const y = 78 - prob * 64;
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <aside
      aria-label="Pedagogical Metadata Inspector"
      className="rounded border border-[#E2E8F0] bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
        <h2 className="font-display text-[14px] font-semibold text-[#0F172A]">
          Pedagogical Inspector
        </h2>
        <BloomBadge level={item.bloomLevel} showVerb />
      </div>

      {/* Bloom Taxonomy Switcher */}
      <div className="border-b border-[#F1F5F9] px-4 py-3">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
          Bloom Cognitive Tier
        </span>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {ALL_BLOOM_LEVELS.map((lvl) => {
            const active = item.bloomLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onUpdateItem({ ...item, bloomLevel: lvl })}
                aria-pressed={active}
                title={`${lvl} · ${getBloomMeta(lvl).verb}`}
                className={`rounded border py-1 text-[12px] font-semibold tabular-nums transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                  active
                    ? 'border-[#0F172A] bg-[#0F172A] text-white'
                    : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[12px] text-[#475569]">
          Target Process: <strong className="text-[#0F172A]">{bloomMeta.verb}</strong> ({bloomMeta.category})
        </p>
      </div>

      {/* High-density Key-Value Table */}
      <div className="divide-y divide-[#F1F5F9] px-4 text-[13px]">
        <div className="flex items-start justify-between gap-3 py-2">
          <span className="text-[#64748B] shrink-0">Curriculum</span>
          <span className="text-right font-mono text-[12px] font-medium text-[#0F172A] tabular-nums">
            {item.curriculumCode}
          </span>
        </div>
        <div className="py-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="inspector-subject" className="text-[#64748B] shrink-0">
              Mata Pelajaran
            </label>
            <select
              id="inspector-subject"
              value={
                CURRICULUM_SUBJECTS.find((s) => item.subject.startsWith(s.label))
                  ?.label ?? item.subject
              }
              onChange={(e) => {
                const nextBase = e.target.value;
                const nextSubject =
                  nextBase === 'Pendidikan Agama dan Budi Pekerti'
                    ? formatSubjectLabel(nextBase, RELIGION_OPTIONS[0])
                    : nextBase === 'Seni dan Prakarya'
                      ? formatSubjectLabel(nextBase, undefined, [SENI_PRAKARYA_OPTIONS[0]])
                      : nextBase;
                onUpdateItem({ ...item, subject: nextSubject });
              }}
              className="max-w-[175px] truncate rounded border border-[#CBD5E1] bg-white px-2 py-0.5 text-right text-[12px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            >
              {CURRICULUM_SUBJECTS.map((subj) => (
                <option key={subj.id} value={subj.label}>
                  {subj.label}
                </option>
              ))}
            </select>
          </div>
          {item.subject.startsWith('Pendidikan Agama dan Budi Pekerti') && (
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <label htmlFor="inspector-religion" className="text-[11px] text-[#64748B]">
                Agama
              </label>
              <select
                id="inspector-religion"
                value={
                  RELIGION_OPTIONS.find((r) => item.subject.includes(`(${r})`)) ??
                  RELIGION_OPTIONS[0]
                }
                onChange={(e) =>
                  onUpdateItem({
                    ...item,
                    subject: formatSubjectLabel(
                      'Pendidikan Agama dan Budi Pekerti',
                      e.target.value,
                    ),
                  })
                }
                className="rounded border border-[#CBD5E1] bg-white px-2 py-0.5 text-[12px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                {RELIGION_OPTIONS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>
          )}
          {item.subject.startsWith('Seni dan Prakarya') && (
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <label htmlFor="inspector-seni" className="text-[11px] text-[#64748B]">
                Bidang
              </label>
              <select
                id="inspector-seni"
                value={
                  SENI_PRAKARYA_OPTIONS.find((opt) => item.subject.includes(opt)) ??
                  SENI_PRAKARYA_OPTIONS[0]
                }
                onChange={(e) =>
                  onUpdateItem({
                    ...item,
                    subject: formatSubjectLabel('Seni dan Prakarya', undefined, [
                      e.target.value,
                    ]),
                  })
                }
                className="max-w-[175px] truncate rounded border border-[#CBD5E1] bg-white px-2 py-0.5 text-[12px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                {SENI_PRAKARYA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 py-2">
          <label htmlFor="inspector-grade" className="text-[#64748B] shrink-0">
            Kelas / Fase
          </label>
          <select
            id="inspector-grade"
            value={item.gradeLevel}
            onChange={(e) => onUpdateItem({ ...item, gradeLevel: e.target.value })}
            className="max-w-[175px] truncate rounded border border-[#CBD5E1] bg-white px-2 py-0.5 text-right text-[12px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
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
        </div>
        <div className="flex items-center justify-between gap-3 py-2">
          <span className="text-[#64748B] shrink-0">Difficulty (p)</span>
          <span className="text-right font-medium text-[#0F172A] tabular-nums">
            {item.difficultyIndex.toFixed(2)} · {getDifficultyLabel(item.difficultyIndex)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-2">
          <span className="text-[#64748B] shrink-0">Discrimination (D)</span>
          <span className="text-right font-medium text-[#0F172A] tabular-nums">
            {item.discriminationIndex.toFixed(2)} · {getDiscriminationLabel(item.discriminationIndex)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-2">
          <label htmlFor="inspector-minutes" className="text-[#64748B] shrink-0">
            Est. Time (min)
          </label>
          <input
            id="inspector-minutes"
            type="number"
            min={1}
            max={45}
            value={item.estimatedMinutes}
            onChange={(e) =>
              onUpdateItem({
                ...item,
                estimatedMinutes: Math.max(1, Number(e.target.value) || 1),
              })
            }
            className="w-16 rounded border border-[#CBD5E1] bg-white px-2 py-0.5 text-right text-[13px] font-medium text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-3 py-2">
          <label htmlFor="inspector-points" className="text-[#64748B] shrink-0">
            Item Weight (pts)
          </label>
          <input
            id="inspector-points"
            type="number"
            min={1}
            max={30}
            value={item.points}
            onChange={(e) =>
              onUpdateItem({
                ...item,
                points: Math.max(1, Number(e.target.value) || 1),
              })
            }
            className="w-16 rounded border border-[#CBD5E1] bg-white px-2 py-0.5 text-right text-[13px] font-medium text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none"
          />
        </div>
      </div>

      {/* Psychometric ICC Curve */}
      <div className="border-t border-[#F1F5F9] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
            Item Characteristic Curve
          </span>
          <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
            p={item.difficultyIndex.toFixed(2)}
          </span>
        </div>
        <svg
          viewBox="0 0 240 88"
          className="mt-1.5 w-full h-[72px] rounded border border-[#F1F5F9] bg-[#F8FAFC]"
          role="img"
          aria-label="Item Characteristic Curve"
        >
          <line x1="10" y1="46" x2="230" y2="46" stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1="120" y1="10" x2="120" y2="78" stroke="#E2E8F0" strokeDasharray="3 3" />
          <path d={iccPoints} fill="none" stroke="#2563EB" strokeWidth="2" />
          <text x="14" y="20" className="fill-[#64748B] text-[9px] font-mono">
            P(θ)
          </text>
          <text x="206" y="84" className="fill-[#64748B] text-[9px] font-mono">
            Ability θ
          </text>
        </svg>
      </div>

      {/* Learning Objective */}
      <div className="border-t border-[#F1F5F9] px-4 py-2.5">
        <label
          htmlFor="inspector-objective"
          className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]"
        >
          Learning Objective
        </label>
        <textarea
          id="inspector-objective"
          rows={3}
          value={item.learningObjective}
          onChange={(e) => onUpdateItem({ ...item, learningObjective: e.target.value })}
          className="mt-1.5 w-full resize-none rounded border border-[#CBD5E1] bg-white px-2.5 py-2 text-[13px] leading-[19px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/12"
        />
      </div>

      {/* Rubric Shortcut */}
      <div className="flex items-center justify-between border-t border-[#F1F5F9] px-4 py-2.5">
        <span className="text-[12px] text-[#475569] tabular-nums">
          {item.rubric.length} Rubric {item.rubric.length === 1 ? 'Criterion' : 'Criteria'}
        </span>
        <button
          type="button"
          onClick={onOpenRubrics}
          className="rounded border border-[#E2E8F0] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#0F172A] whitespace-nowrap shrink-0 hover:bg-[#F1F5F9] transition-colors"
        >
          Open Rubric
        </button>
      </div>
    </aside>
  );
}
