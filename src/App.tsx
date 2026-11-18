import { useEffect, useState } from 'react';
import { SEED_ITEMS } from './data/seedItems';
import { getSubjectShortCode } from './data/subjects';
import type {
  AssessmentItem,
  GeneratorFormInput,
  WorkspaceScreen,
} from './types/assessment';
import { TopBar } from './components/TopBar';
import { ItemStudioScreen } from './components/ItemStudioScreen';
import { GeneratorScreen } from './components/GeneratorScreen';
import { TestMatrixScreen } from './components/TestMatrixScreen';
import { RubricsScreen } from './components/RubricsScreen';

const STORAGE_KEY = 'edusoal_items_v3';

function loadInitialItems(): AssessmentItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to deterministic seed data
  }
  return SEED_ITEMS;
}

export default function App() {
  const [items, setItems] = useState<AssessmentItem[]>(loadInitialItems);
  const [activeScreen, setActiveScreen] = useState<WorkspaceScreen>('studio');
  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    const initial = loadInitialItems();
    return initial[0]?.id ?? '';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [items]);

  function handleUpdateItem(updated: AssessmentItem) {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  function handleCreateBlankItem(seed?: Partial<GeneratorFormInput>) {
    const id = `item-custom-${Date.now()}`;
    const subject = seed?.subject?.trim() || 'Biologi';
    const shortCode = getSubjectShortCode(subject);
    const newItem: AssessmentItem = {
      id,
      code: `ITEM-${shortCode}-${Math.floor(100 + Math.random() * 899)}`,
      subject,
      gradeLevel: seed?.gradeLevel?.trim() || 'Kelas 11 SMA · Fase F',
      curriculumCode: seed?.curriculumStandard?.trim() || 'CUSTOM-STD-01',
      topic: seed?.topic?.trim() || 'Untitled Assessment Topic',
      learningObjective:
        'Analyze domain evidence to justify a precise scientific or analytical conclusion.',
      bloomLevel: seed?.bloomLevel || 'C4',
      itemType: seed?.itemType || 'multiple-choice',
      status: 'draft',
      stimulusKind: 'passage',
      stimulusTitle: 'Stimulus Passage',
      stimulusText:
        seed?.sourceMaterial?.trim() ||
        'Provide reading context, experimental parameters, or source data for this assessment item.',
      stimulusSource: 'Instructor Authored',
      stem: 'Enter the primary question stem here...',
      options:
        seed?.itemType === 'short-essay'
          ? []
          : [
              {
                id: 'opt-a',
                label: 'A',
                text: 'Primary correct option',
                distractorNote: 'Correct key explanation.',
              },
              {
                id: 'opt-b',
                label: 'B',
                text: 'Plausible conceptual distractor',
                distractorNote: 'Addresses common student misconception.',
              },
              {
                id: 'opt-c',
                label: 'C',
                text: 'Procedural error distractor',
                distractorNote: 'Reflects partial reasoning.',
              },
              {
                id: 'opt-d',
                label: 'D',
                text: 'Boundary condition distractor',
                distractorNote: 'Confuses independent and dependent variables.',
              },
            ],
      correctOptionId: seed?.itemType === 'short-essay' ? '' : 'opt-a',
      modelAnswer: 'Provide full scoring rationale and answer justification.',
      pedagogicalExplanation:
        'Authored in EduSoal AI Item Studio.',
      difficultyIndex: 0.5,
      discriminationIndex: 0.35,
      estimatedMinutes: 3,
      points: 4,
      rubric: [
        {
          id: `rub-${Date.now()}`,
          criterion: 'Conceptual Accuracy & Evidence',
          maxPoints: 4,
          levels: {
            exemplary: 'Complete, accurate justification anchored in stimulus evidence.',
            proficient: 'Accurate reasoning with minor omissions.',
            developing: 'Partial concept mastery with incomplete evidence.',
            emerging: 'Minimal or inaccurate reasoning.',
          },
        },
      ],
      inExamPaper: false,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedItemId(id);
    setActiveScreen('studio');
  }

  function handleDeleteItem(id: string) {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (selectedItemId === id) {
        setSelectedItemId(next[0]?.id ?? '');
      }
      return next;
    });
  }

  function handleResetBank() {
    setItems(SEED_ITEMS);
    setSelectedItemId(SEED_ITEMS[0]?.id ?? '');
  }

  function handleSaveGeneratedItem(item: AssessmentItem, openInStudio: boolean) {
    setItems((prev) => {
      if (prev.some((existing) => existing.id === item.id)) {
        return prev;
      }
      return [item, ...prev];
    });
    if (openInStudio) {
      setSelectedItemId(item.id);
      setActiveScreen('studio');
    }
  }

  function handleToggleExamPaper(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, inExamPaper: !item.inExamPaper } : item,
      ),
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <TopBar
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onNewQuestion={() => setActiveScreen('generator')}
      />

      {activeScreen === 'studio' && (
        <ItemStudioScreen
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onUpdateItem={handleUpdateItem}
          onCreateBlankItem={() => handleCreateBlankItem()}
          onDeleteItem={handleDeleteItem}
          onResetBank={handleResetBank}
          onOpenRubrics={() => setActiveScreen('rubrics')}
        />
      )}

      {activeScreen === 'generator' && (
        <GeneratorScreen
          onSaveGeneratedItem={handleSaveGeneratedItem}
          onCreateBlankAndOpenStudio={handleCreateBlankItem}
        />
      )}

      {activeScreen === 'matrix' && (
        <TestMatrixScreen
          items={items}
          onToggleExamPaper={handleToggleExamPaper}
          onInspectInStudio={(id) => {
            setSelectedItemId(id);
            setActiveScreen('studio');
          }}
        />
      )}

      {activeScreen === 'rubrics' && (
        <RubricsScreen
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onUpdateItem={handleUpdateItem}
        />
      )}
    </div>
  );
}
