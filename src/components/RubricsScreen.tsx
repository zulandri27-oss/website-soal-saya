import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type {
  AssessmentItem,
  RubricCriterion,
  RubricTierKey,
} from '../types/assessment';
import { calculateRubricScore } from '../utils/assessment';
import { BloomBadge } from './BloomBadge';

interface RubricsScreenProps {
  items: AssessmentItem[];
  selectedItemId: string;
  onSelectItem: (id: string) => void;
  onUpdateItem: (updated: AssessmentItem) => void;
}

const TIER_COLUMNS: { key: RubricTierKey; label: string; multiplier: string }[] = [
  { key: 'exemplary', label: 'Exemplary', multiplier: '100%' },
  { key: 'proficient', label: 'Proficient', multiplier: '75%' },
  { key: 'developing', label: 'Developing', multiplier: '50%' },
  { key: 'emerging', label: 'Emerging', multiplier: '25%' },
];

export function RubricsScreen({
  items,
  selectedItemId,
  onSelectItem,
  onUpdateItem,
}: RubricsScreenProps) {
  const activeItem = items.find((i) => i.id === selectedItemId) ?? items[0];
  const [selectedRatings, setSelectedRatings] = useState<Record<string, RubricTierKey>>({});

  if (!activeItem) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-12 text-center">
        <p className="text-[15px] text-[#475569]">No items available for rubric calibration.</p>
      </div>
    );
  }

  const scoreSummary = calculateRubricScore(activeItem.rubric, selectedRatings);

  function handleUpdateCriterion(
    criterionId: string,
    updater: (prev: RubricCriterion) => RubricCriterion,
  ) {
    const nextRubric = activeItem.rubric.map((c) =>
      c.id === criterionId ? updater(c) : c,
    );
    onUpdateItem({ ...activeItem, rubric: nextRubric });
  }

  function handleAddCriterion() {
    const nextCriterion: RubricCriterion = {
      id: `rub-${Date.now()}`,
      criterion: 'Analytical Evidence & Reasoning',
      maxPoints: 4,
      levels: {
        exemplary: 'Synthesizes stimulus evidence with rigorous causal logic and zero errors.',
        proficient: 'Cites relevant stimulus details with sound logical support.',
        developing: 'Mentions general concepts with partial or incomplete evidence.',
        emerging: 'Minimal linkage to prompt stimulus or unsupported claims.',
      },
    };
    onUpdateItem({
      ...activeItem,
      rubric: [...activeItem.rubric, nextCriterion],
    });
  }

  function handleDeleteCriterion(criterionId: string) {
    onUpdateItem({
      ...activeItem,
      rubric: activeItem.rubric.filter((c) => c.id !== criterionId),
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header & Item Selector */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-[-0.015em] text-[#0F172A]">
            Rubrics & Scoring Calibration
          </h1>
          <p className="mt-0.5 text-[14px] text-[#475569]">
            Define performance descriptors and simulate student response grading in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="rubric-item-select" className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
            Active Item
          </label>
          <select
            id="rubric-item-select"
            value={activeItem.id}
            onChange={(e) => {
              onSelectItem(e.target.value);
              setSelectedRatings({});
            }}
            className="w-full sm:w-auto max-w-md rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[13px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} — {item.topic}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddCriterion}
            className="inline-flex items-center gap-1.5 rounded bg-[#0F172A] px-3.5 py-2 text-[13px] font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#1E293B]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Criterion</span>
          </button>
        </div>
      </div>

      {/* Item Context Banner */}
      <div className="mb-6 rounded border border-[#E2E8F0] bg-white px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[12px] font-semibold text-[#0F172A]">
            {activeItem.code}
          </span>
          <BloomBadge level={activeItem.bloomLevel} showVerb />
          <span className="text-[12px] text-[#64748B]">
            {activeItem.subject} · {activeItem.curriculumCode}
          </span>
        </div>
        <p className="mt-2 text-[15px] font-medium text-[#0F172A]">{activeItem.stem}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Rubric Criteria Matrix (8 cols) */}
        <section
          aria-label="Rubric Criteria Matrix"
          className="lg:col-span-8 space-y-4"
        >
          {activeItem.rubric.length === 0 ? (
            <div className="rounded border border-[#E2E8F0] bg-white p-8 text-center">
              <p className="text-[14px] font-medium text-[#0F172A]">
                No rubric criteria defined for this item yet.
              </p>
              <button
                type="button"
                onClick={handleAddCriterion}
                className="mt-3 rounded bg-[#0F172A] px-4 py-2 text-[13px] font-semibold text-white"
              >
                Add First Criterion
              </button>
            </div>
          ) : (
            activeItem.rubric.map((criterion) => {
              const currentSelection = selectedRatings[criterion.id] ?? 'proficient';
              return (
                <div
                  key={criterion.id}
                  className="rounded border border-[#E2E8F0] bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                    <input
                      type="text"
                      aria-label="Criterion title"
                      value={criterion.criterion}
                      onChange={(e) =>
                        handleUpdateCriterion(criterion.id, (prev) => ({
                          ...prev,
                          criterion: e.target.value,
                        }))
                      }
                      className="flex-1 min-w-[200px] rounded border border-[#CBD5E1] bg-white px-2.5 py-1 text-[14px] font-semibold text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                    />
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 text-[12px] text-[#475569]">
                        <span>Max Pts</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={criterion.maxPoints}
                          onChange={(e) =>
                            handleUpdateCriterion(criterion.id, (prev) => ({
                              ...prev,
                              maxPoints: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                          className="w-14 rounded border border-[#CBD5E1] bg-white px-2 py-1 text-right font-mono text-[13px] font-semibold text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteCriterion(criterion.id)}
                        aria-label={`Remove ${criterion.criterion}`}
                        className="rounded border border-[#E2E8F0] bg-white p-1.5 text-[#BA1A1A] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F1F5F9]">
                    {TIER_COLUMNS.map((tier) => {
                      const isSelected = currentSelection === tier.key;
                      return (
                        <div
                          key={tier.key}
                          className={`p-3 transition-colors ${
                            isSelected ? 'bg-[#EFF6FF]/60' : 'bg-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRatings((prev) => ({
                                ...prev,
                                [criterion.id]: tier.key,
                              }))
                            }
                            aria-pressed={isSelected}
                            className={`mb-2 flex w-full items-center justify-between rounded border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] ${
                              isSelected
                                ? 'border-[#2563EB] bg-[#2563EB] text-white'
                                : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A]'
                            }`}
                          >
                            <span>{tier.label}</span>
                            <span className="font-mono tabular-nums">{tier.multiplier}</span>
                          </button>

                          <textarea
                            rows={3}
                            aria-label={`${criterion.criterion} ${tier.label} descriptor`}
                            value={criterion.levels[tier.key]}
                            onChange={(e) =>
                              handleUpdateCriterion(criterion.id, (prev) => ({
                                ...prev,
                                levels: {
                                  ...prev.levels,
                                  [tier.key]: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded border border-[#E2E8F0] bg-white p-2 text-[12px] leading-[18px] text-[#334155] focus:border-[#2563EB] focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Right 4 cols: Live Scoring Simulator */}
        <aside
          aria-label="Live Rubric Scoring Simulator"
          className="lg:col-span-4 rounded border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"
        >
          <h2 className="font-display text-[15px] font-semibold text-[#0F172A]">
            Live Grading Calibration
          </h2>
          <p className="mt-1 text-[12px] text-[#64748B]">
            Select performance tiers in the rubric matrix to test point aggregation and mastery classification.
          </p>

          <div className="mt-4 rounded border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                Simulated Score
              </span>
              <span className="font-mono text-[12px] font-semibold text-[#2563EB] tabular-nums">
                {scoreSummary.percentage}%
              </span>
            </div>
            <p className="mt-1 font-display text-[28px] font-bold text-[#0F172A] tabular-nums">
              {scoreSummary.earnedPoints} / {scoreSummary.maxPoints} pts
            </p>
            <p className="mt-1 text-[13px] font-semibold text-[#059669]">
              Mastery Band: {scoreSummary.masteryBand}
            </p>
          </div>

          <div className="mt-4 divide-y divide-[#F1F5F9] text-[13px]">
            {activeItem.rubric.map((criterion) => {
              const tier = selectedRatings[criterion.id] ?? 'proficient';
              return (
                <div key={criterion.id} className="flex items-center justify-between py-2.5">
                  <span className="text-[#334155] truncate pr-3">{criterion.criterion}</span>
                  <span className="font-mono text-[12px] font-semibold capitalize text-[#0F172A] shrink-0">
                    {tier}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
