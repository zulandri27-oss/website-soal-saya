import { useState } from 'react';
import { Eye, Printer, X } from 'lucide-react';
import type { AssessmentItem } from '../types/assessment';
import {
  calculatePaperMetrics,
  computeBloomDistribution,
  getBloomMeta,
} from '../utils/assessment';
import { CURRICULUM_SUBJECTS } from '../data/subjects';
import { BloomBadge } from './BloomBadge';

interface TestMatrixScreenProps {
  items: AssessmentItem[];
  onToggleExamPaper: (id: string) => void;
  onInspectInStudio: (id: string) => void;
}

export function TestMatrixScreen({
  items,
  onToggleExamPaper,
  onInspectInStudio,
}: TestMatrixScreenProps) {
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [showExamPreview, setShowExamPreview] = useState(false);
  const [includeKeysInPreview, setIncludeKeysInPreview] = useState(true);

  const subjects = ['all', ...CURRICULUM_SUBJECTS.map((s) => s.label)];
  const examItems = items.filter((i) => i.inExamPaper);
  const visibleBankRows = items.filter((i) => {
    if (subjectFilter === 'all') return true;
    return (
      i.subject === subjectFilter ||
      i.subject.startsWith(`${subjectFilter} (`) ||
      i.subject.startsWith(`${subjectFilter} —`)
    );
  });

  const metrics = calculatePaperMetrics(examItems);
  const distribution = computeBloomDistribution(examItems);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-[-0.015em] text-[#0F172A]">
            Test Matrix & Exam Blueprint
          </h1>
          <p className="mt-0.5 text-[14px] text-[#475569]">
            Calibrate cognitive balance across Bloom C1–C6 and assemble printable institutional assessments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExamPreview(true)}
          disabled={examItems.length === 0}
          className="inline-flex items-center gap-2 rounded bg-[#0F172A] px-4 py-2 text-[13px] font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#1E293B] disabled:opacity-50 transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span>Preview Exam Paper ({examItems.length})</span>
        </button>
      </div>

      {/* Top 4-Column KPI Strip */}
      <div className="no-print mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
            Selected Exam Items
          </span>
          <p className="mt-1 font-display text-[26px] font-bold text-[#0F172A] tabular-nums">
            {metrics.itemCount}
          </p>
          <p className="mt-0.5 text-[12px] text-[#475569] tabular-nums">
            {metrics.verifiedCount} verified · {metrics.itemCount - metrics.verifiedCount} draft
          </p>
        </div>

        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
            Total Weight & Time
          </span>
          <p className="mt-1 font-display text-[26px] font-bold text-[#0F172A] tabular-nums">
            {metrics.totalPoints} pts
          </p>
          <p className="mt-0.5 text-[12px] text-[#475569] tabular-nums">
            Est. {metrics.totalMinutes} minutes
          </p>
        </div>

        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
            HOTS Share (C4–C6)
          </span>
          <p className="mt-1 font-display text-[26px] font-bold text-[#0F172A] tabular-nums">
            {metrics.hotsSharePercent}%
          </p>
          <p className="mt-0.5 text-[12px] text-[#475569] tabular-nums">
            {distribution.hotsCount} analytical/evaluative items
          </p>
        </div>

        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
            Mean Difficulty / Disc.
          </span>
          <p className="mt-1 font-display text-[26px] font-bold text-[#0F172A] tabular-nums">
            p={metrics.avgDifficulty.toFixed(2)}
          </p>
          <p className="mt-0.5 text-[12px] text-[#475569] tabular-nums">
            Mean D={metrics.avgDiscrimination.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Bloom Taxonomy Distribution Matrix (4 cols) */}
        <section
          aria-label="Bloom Taxonomy Matrix"
          className="lg:col-span-4 rounded border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"
        >
          <h2 className="font-display text-[15px] font-semibold text-[#0F172A]">
            Cognitive Balance (C1–C6)
          </h2>
          <p className="mt-1 text-[12px] text-[#64748B]">
            Distribution of items currently included in the active exam blueprint.
          </p>

          <div className="mt-4 space-y-3.5">
            {distribution.rows.map((row) => {
              const meta = getBloomMeta(row.level);
              return (
                <div key={row.level}>
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <BloomBadge level={row.level} />
                      <span className="font-medium text-[#0F172A]">{row.verb}</span>
                    </div>
                    <span className="font-mono text-[12px] text-[#475569] tabular-nums">
                      {row.count} ({row.percentage}%) · {row.points}p
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-[2px] bg-[#F1F5F9]">
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${row.percentage}%`,
                        backgroundColor: meta.barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Blueprint Selection Table (8 cols) */}
        <section
          aria-label="Exam Blueprint Item Table"
          className="lg:col-span-8 rounded border border-[#E2E8F0] bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-3.5">
            <h2 className="font-display text-[15px] font-semibold text-[#0F172A]">
              Item Bank Allocation ({visibleBankRows.length})
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="matrix-subject-filter" className="text-[12px] text-[#64748B]">
                Subject
              </label>
              <select
                id="matrix-subject-filter"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded border border-[#CBD5E1] bg-white px-2.5 py-1 text-[13px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              >
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj === 'all' ? 'Semua Mata Pelajaran' : subj}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                  <th className="px-4 py-2.5">Include</th>
                  <th className="px-4 py-2.5">Item Code</th>
                  <th className="px-4 py-2.5">Topic & Standard</th>
                  <th className="px-4 py-2.5">Bloom</th>
                  <th className="px-4 py-2.5 text-right">p-Val</th>
                  <th className="px-4 py-2.5 text-right">Pts</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {visibleBankRows.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Include ${item.code} in exam paper`}
                        checked={item.inExamPaper}
                        onChange={() => onToggleExamPaper(item.id)}
                        className="h-4 w-4 rounded border-[#CBD5E1] accent-[#2563EB]"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-[#0F172A] whitespace-nowrap tabular-nums">
                      {item.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0F172A]">{item.topic}</p>
                      <p className="text-[12px] text-[#64748B]">
                        {item.subject} · {item.curriculumCode}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <BloomBadge level={item.bloomLevel} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#334155] tabular-nums">
                      {item.difficultyIndex.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#0F172A] tabular-nums">
                      {item.points}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onInspectInStudio(item.id)}
                        className="text-[12px] font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Printable Exam Sheet Overlay */}
      {showExamPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4 print:static print:bg-white print:p-0">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white shadow-2xl print:max-h-none print:border-none print:shadow-none">
            <div className="no-print sticky top-0 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white px-6 py-4">
              <div className="flex items-center gap-4">
                <h2 className="font-display text-[16px] font-bold text-[#0F172A]">
                  Institutional Exam Paper Preview
                </h2>
                <label className="inline-flex items-center gap-2 text-[13px] text-[#475569]">
                  <input
                    type="checkbox"
                    checked={includeKeysInPreview}
                    onChange={(e) => setIncludeKeysInPreview(e.target.checked)}
                    className="h-4 w-4 accent-[#2563EB]"
                  />
                  <span>Include Educator Answer Key</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded bg-[#0F172A] px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-[#1E293B]"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExamPreview(false)}
                  aria-label="Close exam preview"
                  className="rounded border border-[#E2E8F0] p-1.5 text-[#475569] hover:bg-[#F1F5F9]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="border-b-2 border-[#0F172A] pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                  EduSoal AI · Institutional Assessment Blueprint
                </p>
                <h3 className="mt-1 font-display text-[22px] font-bold text-[#0F172A]">
                  Summative Academic Examination
                </h3>
                <div className="mt-2 flex flex-wrap gap-6 text-[13px] text-[#334155] tabular-nums">
                  <span>Items: {metrics.itemCount}</span>
                  <span>Total Weight: {metrics.totalPoints} points</span>
                  <span>Duration: {metrics.totalMinutes} minutes</span>
                  <span>HOTS Rigor: {metrics.hotsSharePercent}%</span>
                </div>
              </div>

              {examItems.map((item, idx) => (
                <div key={item.id} className="border-b border-[#E2E8F0] pb-6 last:border-b-0">
                  <div className="flex items-center justify-between gap-2 text-[12px] text-[#64748B]">
                    <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                      Question {idx + 1} · {item.code}
                    </span>
                    <span className="tabular-nums">
                      {item.bloomLevel} · {item.points} pts
                    </span>
                  </div>

                  {item.stimulusText && (
                    <div className="mt-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-[13px] leading-[21px] text-[#334155]">
                      {item.stimulusTitle && (
                        <p className="mb-1 font-semibold text-[#0F172A]">{item.stimulusTitle}</p>
                      )}
                      <p className="whitespace-pre-line">{item.stimulusText}</p>
                    </div>
                  )}

                  <p className="mt-3 text-[15px] font-medium leading-[23px] text-[#0F172A]">
                    {item.stem}
                  </p>

                  {item.options.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-[14px] text-[#1E293B]">
                      {item.options.map((opt) => {
                        const isKey = opt.id === item.correctOptionId;
                        return (
                          <li
                            key={opt.id}
                            className={`rounded px-2.5 py-1.5 ${
                              includeKeysInPreview && isKey
                                ? 'bg-[#ECFDF5] font-semibold text-[#059669]'
                                : ''
                            }`}
                          >
                            <span className="mr-2 font-mono font-semibold">{opt.label}.</span>
                            {opt.text}
                            {includeKeysInPreview && isKey && ' (Answer Key)'}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {includeKeysInPreview && (
                    <div className="mt-3 rounded bg-[#F8FAFC] px-3 py-2 text-[12px] text-[#475569]">
                      <strong>Scoring Rationale:</strong> {item.modelAnswer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
