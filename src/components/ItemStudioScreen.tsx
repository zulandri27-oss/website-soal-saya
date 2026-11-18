import { useState } from 'react';
import {
  Check,
  Edit3,
  Eye,
  FilePlus2,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  AssessmentItem,
  BloomGroup,
  ItemStatus,
  StimulusFormatPreference,
} from '../types/assessment';
import { filterAssessmentItems } from '../utils/assessment';
import { normalizeGeneratedStimulus } from '../utils/stimulus';
import { CURRICULUM_SUBJECTS, GRADE_LEVELS } from '../data/subjects';
import { BloomBadge } from './BloomBadge';
import { MetadataInspector } from './MetadataInspector';
import { StimulusChartSvg } from './StimulusChartSvg';
import { StimulusTableBlock } from './StimulusTableBlock';

interface ItemStudioScreenProps {
  items: AssessmentItem[];
  selectedItemId: string;
  onSelectItem: (id: string) => void;
  onUpdateItem: (updated: AssessmentItem) => void;
  onCreateBlankItem: () => void;
  onDeleteItem: (id: string) => void;
  onResetBank: () => void;
  onOpenRubrics: () => void;
}

const BLOOM_FILTER_TABS: { id: BloomGroup; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'C1-C2', label: 'C1–C2' },
  { id: 'C3-C4', label: 'C3–C4' },
  { id: 'C5-C6', label: 'C5–C6' },
];

export function ItemStudioScreen({
  items,
  selectedItemId,
  onSelectItem,
  onUpdateItem,
  onCreateBlankItem,
  onDeleteItem,
  onResetBank,
  onOpenRubrics,
}: ItemStudioScreenProps) {
  const [query, setQuery] = useState('');
  const [bloomGroup, setBloomGroup] = useState<BloomGroup>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ItemStatus>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [practiceChoiceId, setPracticeChoiceId] = useState<string | null>(null);
  const [tabletInspectorOpen, setTabletInspectorOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'bank' | 'canvas' | 'inspector'>('canvas');

  // AI Refinement state
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState(
    'Elevate cognitive rigor by strengthening distractor plausibility',
  );
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Automatic Gemini Stimulus state
  const [studioStimulusKind, setStudioStimulusKind] =
    useState<StimulusFormatPreference>('auto');
  const [isGeneratingStimulus, setIsGeneratingStimulus] = useState(false);
  const [studioStimulusError, setStudioStimulusError] = useState<string | null>(null);

  const filteredItems = filterAssessmentItems(items, {
    query,
    bloomGroup,
    status: statusFilter,
    subject: subjectFilter,
    gradeLevel: gradeFilter,
  });

  const activeItem =
    items.find((i) => i.id === selectedItemId) ?? filteredItems[0] ?? items[0];

  async function handleGenerateStimulusForItem() {
    if (!activeItem) return;
    setIsGeneratingStimulus(true);
    setStudioStimulusError(null);
    try {
      const response = await fetch('/api/stimulus/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeItem.subject,
          gradeLevel: activeItem.gradeLevel,
          curriculumStandard: activeItem.curriculumCode,
          topic: activeItem.topic,
          bloomLevel: activeItem.bloomLevel,
          preferredKind: studioStimulusKind,
          stem: activeItem.stem,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat stimulus dengan Gemini.');
      }

      const normalized = normalizeGeneratedStimulus(
        (data.stimulus ?? {}) as Record<string, unknown>,
        activeItem.topic,
      );
      onUpdateItem({
        ...activeItem,
        stimulusKind: normalized.stimulusKind,
        stimulusTitle: normalized.stimulusTitle,
        stimulusText: normalized.stimulusText,
        stimulusSource: normalized.stimulusSource,
        stimulusTable: normalized.stimulusTable,
        stimulusChart: normalized.stimulusChart,
      });
    } catch (err) {
      setStudioStimulusError(
        err instanceof Error
          ? err.message
          : 'Gagal menghubungi Gemini untuk membuat stimulus.',
      );
    } finally {
      setIsGeneratingStimulus(false);
    }
  }

  async function handleRefineWithAi() {
    if (!activeItem || !refineInstruction.trim()) return;
    setIsRefining(true);
    setRefineError(null);
    try {
      const response = await fetch('/api/questions/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: activeItem,
          instruction: refineInstruction.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Refinement request failed.');
      }
      if (data.item) {
        const refinedStimulus =
          data.item.stimulusText || data.item.stimulusTable || data.item.stimulusChart
            ? normalizeGeneratedStimulus(data.item, activeItem.topic)
            : null;
        onUpdateItem({
          ...activeItem,
          ...data.item,
          ...(refinedStimulus ?? {}),
          id: activeItem.id,
          updatedAt: new Date().toISOString().slice(0, 10),
        });
        setRefineOpen(false);
      }
    } catch (err) {
      setRefineError(
        err instanceof Error ? err.message : 'Unable to refine item with AI.',
      );
    } finally {
      setIsRefining(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 pb-20 md:pb-8">
      {/* Compact Workspace Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-[-0.015em] text-[#0F172A]">
            Item Studio
          </h1>
          <p className="mt-0.5 text-[14px] text-[#475569]">
            Author, calibrate, and validate curriculum-aligned stimulus items across Bloom C1–C6.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tablet collapsible inspector toggle (768px - 1279px) */}
          <button
            type="button"
            onClick={() => setTabletInspectorOpen((v) => !v)}
            className="hidden md:inline-flex xl:hidden items-center gap-1.5 rounded border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] font-medium text-[#0F172A] whitespace-nowrap shrink-0 hover:bg-[#F1F5F9]"
          >
            {tabletInspectorOpen ? (
              <PanelRightClose className="h-4 w-4 text-[#475569]" />
            ) : (
              <PanelRightOpen className="h-4 w-4 text-[#475569]" />
            )}
            <span>{tabletInspectorOpen ? 'Hide Inspector' : 'Inspector'}</span>
          </button>

          <button
            type="button"
            onClick={onResetBank}
            className="inline-flex items-center gap-1.5 rounded border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] font-medium text-[#475569] whitespace-nowrap shrink-0 hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
            title="Restore default seed item bank"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Bank</span>
          </button>
        </div>
      </div>

      {/* 12-Column Asymmetric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Item Bank Navigation (3 cols on xl, 4 cols on md) */}
        <section
          aria-label="Item Bank Navigation"
          className={`md:col-span-4 xl:col-span-3 rounded border border-[#E2E8F0] bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] ${
            mobilePane === 'bank' ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="border-b border-[#E2E8F0] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[14px] font-semibold text-[#0F172A]">
                Item Bank ({filteredItems.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  onCreateBlankItem();
                  setIsEditing(true);
                  setMobilePane('canvas');
                }}
                className="inline-flex items-center gap-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[12px] font-semibold text-[#0F172A] whitespace-nowrap shrink-0 hover:bg-[#F1F5F9] transition-colors"
              >
                <FilePlus2 className="h-3.5 w-3.5 text-[#2563EB]" />
                <span>Blank Item</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#64748B]" />
              <input
                type="search"
                aria-label="Search item bank"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code, subject, or topic..."
                className="w-full rounded border border-[#CBD5E1] bg-white py-1.5 pl-8 pr-3 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/12"
              />
            </div>

            {/* Bloom Group Segmented Filter */}
            <div
              role="group"
              aria-label="Filter by Bloom Taxonomy tier"
              className="mt-2.5 grid grid-cols-4 gap-1 rounded bg-[#F1F5F9] p-1"
            >
              {BLOOM_FILTER_TABS.map((tab) => {
                const active = bloomGroup === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBloomGroup(tab.id)}
                    aria-pressed={active}
                    className={`rounded py-1 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-white text-[#0F172A] shadow-xs'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Subject & Status Filters */}
            <div className="mt-2 space-y-2 text-[12px]">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="bank-subject-filter" className="text-[#64748B] shrink-0">
                  Mata Pelajaran
                </label>
                <select
                  id="bank-subject-filter"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="max-w-[170px] truncate rounded border border-[#CBD5E1] bg-white px-2 py-1 text-[12px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="all">Semua Mapel</option>
                  {CURRICULUM_SUBJECTS.map((subj) => (
                    <option key={subj.id} value={subj.label}>
                      {subj.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="bank-grade-filter" className="text-[#64748B] shrink-0">
                  Kelas
                </label>
                <select
                  id="bank-grade-filter"
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="max-w-[170px] truncate rounded border border-[#CBD5E1] bg-white px-2 py-1 text-[12px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="all">Semua Kelas</option>
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
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="bank-status-filter" className="text-[#64748B]">
                  Review Status
                </label>
                <select
                  id="bank-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | ItemStatus)}
                  className="rounded border border-[#CBD5E1] bg-white px-2 py-1 text-[12px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="all">All Items</option>
                  <option value="verified">Verified Only</option>
                  <option value="draft">Drafts Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Item List */}
          <div className="max-h-[640px] divide-y divide-[#F1F5F9] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[#0F172A]">No matching items</p>
                <p className="mt-1 text-[12px] text-[#64748B]">
                  Adjust your Bloom filter or search query.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = activeItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectItem(item.id);
                      setPracticeChoiceId(null);
                      setMobilePane('canvas');
                    }}
                    className={`w-full text-left px-3.5 py-3 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563EB] ${
                      isSelected
                        ? 'bg-[#EFF6FF]'
                        : 'bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-[#475569] tabular-nums">
                        {item.code}
                      </span>
                      <BloomBadge level={item.bloomLevel} />
                    </div>
                    <p className="mt-1 line-clamp-1 text-[13px] font-semibold text-[#0F172A]">
                      {item.topic}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#64748B]">
                      <span>{item.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.points} pts</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.status === 'verified'
                            ? 'font-medium text-[#059669]'
                            : 'text-[#64748B]'
                        }
                      >
                        {item.status === 'verified' ? 'Verified' : 'Draft'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* CENTER PANE: Stimulus & Question Canvas (6 cols on xl, 8 cols on md) */}
        <main
          aria-label="Stimulus and Question Canvas"
          className={`md:col-span-8 xl:col-span-6 ${
            mobilePane === 'canvas' ? 'block' : 'hidden md:block'
          }`}
        >
          {!activeItem ? (
            <div className="rounded border border-[#E2E8F0] bg-white p-10 text-center">
              <p className="font-display text-[16px] font-semibold text-[#0F172A]">
                Item bank is empty
              </p>
              <p className="mt-1 text-[14px] text-[#64748B]">
                Create a blank assessment item or generate a new set from the Generator workspace.
              </p>
              <button
                type="button"
                onClick={onCreateBlankItem}
                className="mt-4 rounded bg-[#0F172A] px-4 py-2 text-[13px] font-semibold text-white"
              >
                Create Blank Item
              </button>
            </div>
          ) : (
            <div className="rounded border border-[#E2E8F0] bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05),0_2px_4px_-2px_rgba(15,23,42,0.03)]">
              {/* Canvas Action Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-[12px] font-semibold text-[#0F172A] tabular-nums">
                    {activeItem.code}
                  </span>
                  <BloomBadge level={activeItem.bloomLevel} showVerb />
                  <span className="text-[12px] text-[#64748B]">
                    {activeItem.itemType === 'multiple-choice'
                      ? 'Multiple Choice'
                      : activeItem.itemType === 'case-analysis'
                        ? 'Case Analysis'
                        : 'Constructed Essay'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRefineOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#0F172A] whitespace-nowrap shrink-0 hover:bg-[#F1F5F9] transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                    <span>Refine with AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing((v) => !v)}
                    className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      isEditing
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Done Editing</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Item</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateItem({
                        ...activeItem,
                        status: activeItem.status === 'verified' ? 'draft' : 'verified',
                      })
                    }
                    className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      activeItem.status === 'verified'
                        ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                        : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{activeItem.status === 'verified' ? 'Verified' : 'Verify Item'}</span>
                  </button>
                </div>
              </div>

              {/* AI Refinement Drawer Bar */}
              {refineOpen && (
                <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="ai-refine-input"
                        className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#475569]"
                      >
                        Pedagogical Refinement Instruction
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[
                          'Elevate to C5 Evaluation',
                          'Improve Distractors',
                          'Simplify Language',
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setRefineInstruction(preset)}
                            className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 text-[11px] font-medium text-[#475569] hover:text-[#0F172A]"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id="ai-refine-input"
                        type="text"
                        value={refineInstruction}
                        onChange={(e) => setRefineInstruction(e.target.value)}
                        className="flex-1 rounded border border-[#CBD5E1] bg-white px-3 py-1.5 text-[13px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isRefining}
                        onClick={handleRefineWithAi}
                        className="rounded bg-[#2563EB] px-4 py-1.5 text-[13px] font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#1D4ED8] disabled:opacity-60"
                      >
                        {isRefining ? 'Refining...' : 'Apply AI Refinement'}
                      </button>
                    </div>
                    {refineError && (
                      <p role="alert" className="text-[12px] font-medium text-[#BA1A1A]">
                        {refineError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* UPPER QUADRANT: Context Stimulus */}
              <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B] whitespace-nowrap shrink-0">
                      Context Stimulus
                    </span>
                    {activeItem.stimulusSource && !isEditing && (
                      <span className="text-[11px] text-[#64748B]">
                        · {activeItem.stimulusSource}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      id="studio-stimulus-kind"
                      aria-label="Format stimulus Gemini"
                      value={studioStimulusKind}
                      onChange={(e) =>
                        setStudioStimulusKind(e.target.value as StimulusFormatPreference)
                      }
                      className="rounded border border-[#CBD5E1] bg-white px-2 py-1 text-[11px] font-medium text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                    >
                      <option value="auto">Auto</option>
                      <option value="passage">Wacana</option>
                      <option value="data-table">Tabel</option>
                      <option value="chart-series">Grafik</option>
                    </select>
                    <button
                      id="btn-studio-auto-stimulus"
                      type="button"
                      disabled={isGeneratingStimulus}
                      onClick={handleGenerateStimulusForItem}
                      className="inline-flex items-center gap-1.5 rounded border border-[#2563EB] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] whitespace-nowrap hover:bg-[#EFF6FF] disabled:opacity-60"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>
                        {isGeneratingStimulus
                          ? 'Membuat Stimulus...'
                          : 'Generate Stimulus (Gemini)'}
                      </span>
                    </button>
                  </div>
                </div>

                {studioStimulusError && (
                  <p role="alert" className="mt-2 text-[12px] font-medium text-[#BA1A1A]">
                    {studioStimulusError}
                  </p>
                )}

                {isEditing ? (
                  <div className="mt-2.5 space-y-2.5">
                    <input
                      type="text"
                      aria-label="Stimulus title"
                      value={activeItem.stimulusTitle ?? ''}
                      onChange={(e) =>
                        onUpdateItem({
                          ...activeItem,
                          stimulusTitle: e.target.value,
                          stimulusKind: e.target.value ? 'passage' : activeItem.stimulusKind,
                        })
                      }
                      placeholder="Stimulus title or heading"
                      className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                    />
                    <textarea
                      aria-label="Stimulus narrative"
                      rows={4}
                      value={activeItem.stimulusText ?? ''}
                      onChange={(e) =>
                        onUpdateItem({
                          ...activeItem,
                          stimulusText: e.target.value,
                          stimulusKind: e.target.value ? 'passage' : 'none',
                        })
                      }
                      placeholder="Enter reading passage, experimental scenario, or click Generate Stimulus (Gemini) above..."
                      className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] leading-[22px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                ) : activeItem.stimulusKind === 'none' && !activeItem.stimulusText ? (
                  <p className="mt-2 text-[13px] text-[#64748B]">
                    Belum ada stimulus pada soal ini. Klik{' '}
                    <strong className="font-semibold text-[#0F172A]">
                      Generate Stimulus (Gemini)
                    </strong>{' '}
                    untuk membuat stimulus wacana, tabel data, atau grafik secara otomatis.
                  </p>
                ) : (
                  <>
                    {activeItem.stimulusTitle && (
                      <h3 className="mt-1.5 font-display text-[15px] font-semibold text-[#0F172A]">
                        {activeItem.stimulusTitle}
                      </h3>
                    )}
                    {activeItem.stimulusText && (
                      <p className="mt-1.5 whitespace-pre-line text-[14px] leading-[22px] text-[#334155]">
                        {activeItem.stimulusText}
                      </p>
                    )}

                    {activeItem.stimulusTable && (
                      <StimulusTableBlock table={activeItem.stimulusTable} />
                    )}

                    {activeItem.stimulusChart && (
                      <StimulusChartSvg chart={activeItem.stimulusChart} />
                    )}
                  </>
                )}
              </div>

              {/* LOWER QUADRANT: Question Stem & Interactive Options */}
              <div className="px-5 py-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                    Question Stem & Key Calibration
                  </span>
                  {activeItem.options.length > 0 && !isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowAnswerKey((v) => !v)}
                      className="text-[12px] font-semibold text-[#2563EB] hover:underline"
                    >
                      {showAnswerKey ? 'Hide Answer Key' : 'Reveal Answer Key'}
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <textarea
                    aria-label="Question stem"
                    rows={3}
                    value={activeItem.stem}
                    onChange={(e) => onUpdateItem({ ...activeItem, stem: e.target.value })}
                    className="mt-2 w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[15px] font-medium leading-[24px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  />
                ) : (
                  <p className="mt-2 text-[16px] font-medium leading-[26px] text-[#0F172A]">
                    {activeItem.stem}
                  </p>
                )}

                {/* Multiple-choice Options */}
                {activeItem.options.length > 0 ? (
                  <div className="mt-4 space-y-2.5">
                    {activeItem.options.map((opt) => {
                      const isCorrect = activeItem.correctOptionId === opt.id;
                      const isPracticed = practiceChoiceId === opt.id;
                      const highlightCorrect = showAnswerKey && isCorrect;

                      return (
                        <div
                          key={opt.id}
                          className={`rounded border p-3 transition-colors duration-150 ${
                            highlightCorrect
                              ? 'border-[#059669] bg-[#ECFDF5]'
                              : isPracticed && !isCorrect
                                ? 'border-[#BA1A1A] bg-[#FEF2F2]'
                                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name={`correct-key-${activeItem.id}`}
                                  aria-label={`Mark option ${opt.label} as correct key`}
                                  checked={isCorrect}
                                  onChange={() =>
                                    onUpdateItem({ ...activeItem, correctOptionId: opt.id })
                                  }
                                  className="h-4 w-4 accent-[#059669]"
                                />
                                <span className="font-mono text-[12px] font-bold text-[#0F172A]">
                                  {opt.label}
                                </span>
                                <input
                                  type="text"
                                  aria-label={`Option ${opt.label} text`}
                                  value={opt.text}
                                  onChange={(e) => {
                                    const nextOptions = activeItem.options.map((o) =>
                                      o.id === opt.id ? { ...o, text: e.target.value } : o,
                                    );
                                    onUpdateItem({ ...activeItem, options: nextOptions });
                                  }}
                                  className="flex-1 rounded border border-[#CBD5E1] bg-white px-2.5 py-1 text-[14px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                                />
                              </div>
                              <input
                                type="text"
                                aria-label={`Option ${opt.label} distractor note`}
                                value={opt.distractorNote}
                                onChange={(e) => {
                                  const nextOptions = activeItem.options.map((o) =>
                                    o.id === opt.id ? { ...o, distractorNote: e.target.value } : o,
                                  );
                                  onUpdateItem({ ...activeItem, options: nextOptions });
                                }}
                                placeholder="Distractor rationale..."
                                className="ml-6 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[12px] text-[#475569] focus:border-[#2563EB] focus:outline-none"
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPracticeChoiceId(opt.id)}
                              className="flex w-full items-start gap-3 text-left"
                            >
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] font-bold ${
                                  highlightCorrect
                                    ? 'border-[#059669] bg-[#059669] text-white'
                                    : isPracticed
                                      ? 'border-[#0F172A] bg-[#0F172A] text-white'
                                      : 'border-[#CBD5E1] bg-white text-[#475569]'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[14px] leading-[22px] text-[#0F172A]">
                                    {opt.text}
                                  </span>
                                  {highlightCorrect && (
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#059669]">
                                      Correct Key
                                    </span>
                                  )}
                                  {isPracticed && !isCorrect && (
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#BA1A1A]">
                                      Distractor Selected
                                    </span>
                                  )}
                                </div>
                                {(showAnswerKey || isPracticed) && opt.distractorNote && (
                                  <p className="mt-1 text-[12px] leading-[18px] text-[#475569]">
                                    {opt.distractorNote}
                                  </p>
                                )}
                              </div>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Constructed Essay / Short Response Model Answer */
                  <div className="mt-4 rounded border border-[#E2E8F0] bg-[#ECFDF5]/60 p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#059669]">
                      Model Scoring Reference
                    </span>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        aria-label="Model answer"
                        value={activeItem.modelAnswer}
                        onChange={(e) =>
                          onUpdateItem({ ...activeItem, modelAnswer: e.target.value })
                        }
                        className="mt-2 w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                      />
                    ) : (
                      <p className="mt-1.5 text-[14px] leading-[22px] text-[#0F172A]">
                        {activeItem.modelAnswer}
                      </p>
                    )}
                  </div>
                )}

                {/* Pedagogical Explanation */}
                <div className="mt-4 border-t border-[#F1F5F9] pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                    Pedagogical Rationale
                  </span>
                  <p className="mt-1 text-[13px] leading-[20px] text-[#475569]">
                    {activeItem.pedagogicalExplanation}
                  </p>
                </div>

                {/* Canvas Footer Actions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#0F172A]">
                    <input
                      type="checkbox"
                      checked={activeItem.inExamPaper}
                      onChange={(e) =>
                        onUpdateItem({ ...activeItem, inExamPaper: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-[#CBD5E1] accent-[#2563EB]"
                    />
                    <span>Include in Active Exam Blueprint</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(activeItem.id)}
                    className="inline-flex items-center gap-1.5 rounded border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#BA1A1A] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Item</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT PANE: Pedagogical Metadata Inspector (3 cols on xl, drawer on md/lg) */}
        {activeItem && (
          <div
            className={`xl:col-span-3 ${
              mobilePane === 'inspector' ? 'block' : 'hidden xl:block'
            }`}
          >
            <MetadataInspector
              item={activeItem}
              onUpdateItem={onUpdateItem}
              onOpenRubrics={onOpenRubrics}
            />
          </div>
        )}
      </div>

      {/* Tablet Collapsible Drawer for Inspector (768px - 1279px) */}
      {tabletInspectorOpen && activeItem && (
        <div className="fixed inset-0 z-40 hidden md:flex xl:hidden justify-end bg-[#0F172A]/30">
          <div className="h-full w-[360px] overflow-y-auto bg-[#F8FAFC] p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-[14px] font-semibold text-[#0F172A]">
                Metadata Inspector
              </span>
              <button
                type="button"
                onClick={() => setTabletInspectorOpen(false)}
                className="rounded border border-[#E2E8F0] bg-white px-2.5 py-1 text-[12px] font-medium text-[#0F172A]"
              >
                Close
              </button>
            </div>
            <MetadataInspector
              item={activeItem}
              onUpdateItem={onUpdateItem}
              onOpenRubrics={() => {
                setTabletInspectorOpen(false);
                onOpenRubrics();
              }}
            />
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Utility Bar (<768px, compact height ~48px well within 15% cap) */}
      <div
        role="tablist"
        aria-label="Mobile workspace panes"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-[#E2E8F0] bg-white md:hidden"
      >
        {(
          [
            { id: 'bank', label: 'Item Bank' },
            { id: 'canvas', label: 'Question Canvas' },
            { id: 'inspector', label: 'Inspector' },
          ] as const
        ).map((pane) => {
          const active = mobilePane === pane.id;
          return (
            <button
              key={pane.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMobilePane(pane.id)}
              className={`py-3 text-[12px] font-semibold whitespace-nowrap ${
                active
                  ? 'border-t-2 border-[#2563EB] text-[#2563EB]'
                  : 'text-[#64748B]'
              }`}
            >
              {pane.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
