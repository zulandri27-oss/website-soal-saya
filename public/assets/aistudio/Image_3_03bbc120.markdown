---
name: EduSoal AI
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
  code-inline:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  gutter-mobile: 1rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes an authoritative, high-precision academic suite built specifically for institutional educators, curriculum specialists, and assessment designers. The interface balances high-density pedagogical workflows with an editorial finish, evoking rigor, institutional trust, and modern analytical clarity.

Drawing from modern technical minimalism and structural editorial design, the system rejects superfluous ornamentation in favor of sharp micro-geometry, deliberate contrast, and structured metadata panes. Cognitive taxonomies, question stimulus blocks, and evaluation rubrics receive unambiguous visual framing, ensuring prolonged multi-hour focus without visual fatigue.

## Colors

The palette is anchored by deep institutional slate (`#0F172A`), providing structural authority and grounded visual hierarchy. Primary actions and focused system states utilize vibrant academic blue (`#2563EB`). Assessment verification, item validation, and answer keys are signaled through precise emerald tones (`#10B981`).

Functional accents handle taxonomic and pedagogical weight:
- **Bloom Taxonomy (C1–C2 Recall/Comprehension):** Cool slate tint (`#475569`) with subtle cool-neutral fills.
- **Bloom Taxonomy (C3–C4 Application/Analysis):** Crisp amber (`#F59E0B`) to indicate intermediate analytical friction.
- **Bloom Taxonomy (C5–C6 Evaluation/Creation):** High-order vermilion/orange (`#EA580C`) for complex item generation.
- **Canvas & Containers:** Base backgrounds remain pure (`#FFFFFF`) or slightly offset (`#F8FAFC`), while structural cards use crisp surfaces framed by 1px borders in slate-200 (`#E2E8F0`).

## Typography

The type system pairs the geometric precision of Manrope for section titles, stimulus indices, and metrics with the functional clarity of Hanken Grotesk for stem narratives, multi-choice options, and pedagogical metadata.

All letterforms are optimized for dense technical assessment data. Headlines use tight negative tracking to emphasize institutional command. Labels and taxonomic indicators leverage slightly tracked uppercase styling for instant scannability across item banks and test matrices.

## Layout & Spacing

The layout is built on an asymmetric 12-column grid designed for data-intensive split screens. 

- **Desktop (1280px+):** Three-tier layout comprising an item bank navigation pane (3 columns), a central interactive item generator/stimulus canvas (6 columns), and an anchoring pedagogical metadata inspector (3 columns). Margins default to `2rem` with `1.5rem` gutters.
- **Tablet (768px - 1279px):** Content folds into a primary 8-column workspace with a collapsible drawer for taxonomy attributes and metadata.
- **Mobile (<768px):** Single-column stacked stream with fixed bottom utility triggers for taxonomic switching and review status.

Spacing rhythm strictly enforces modular vertical intervals (`0.5rem`, `1rem`, `1.5rem`), keeping input forms, rubric grids, and preview cards synchronized across all breakpoints.

## Elevation & Depth

Visual depth is achieved through structural tonal layering and hairline delineation rather than heavy atmospheric blurring.

1. **Base Tier (Level 0):** Canvas backdrop `#F8FAFC`.
2. **Structural Tier (Level 1):** White surfaces (`#FFFFFF`) encased in razor-thin border outlines (`1px solid #E2E8F0`). Subtle ambient drop: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04)`.
3. **Inspector & Card Focus (Level 2):** Elevated stimulus panes and active question previews utilize a composite shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)` with a slate-300 border accent.
4. **Modal Overlays & Popovers (Level 3):** Highest-order items float on sharp layered shadows (`0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`) over a semi-translucent slate scrim (`rgba(15, 23, 42, 0.3)`).

## Shapes

The interface adheres to a tight `0.25rem` (4px) structural corner radius (`roundedness: 1`). Containers, buttons, stimulus cards, and input fields maintain this soft micro-geometry to project high precision without severe harshness.

Larger structural surfaces (such as assessment inspection drawers and modal containers) step up to `0.5rem` (8px). Badges and taxonomic chips use compact 4px radii instead of circular pills to maintain an architectural, curriculum-grade visual texture.

## Components

### Buttons
- **Primary:** Filled in `#0F172A` with white typography, crisp 4px corners, and `0.5rem 1rem` padding. Subtle brightness shift on hover; active state scales down by 0.5% with an inset border.
- **Secondary / Action:** Solid `#2563EB` with white text for active generation and testing actions.
- **Outline / Ghost:** 1px `#E2E8F0` border on transparent background, transitioning to `#F1F5F9` on hover.

### Form Inputs & Selectors
- Background `#FFFFFF` with 1px `#CBD5E1` border. 
- Focus states invoke a 1px border highlight in `#2563EB` alongside a subtle 2px ring in `rgba(37, 99, 235, 0.12)`.
- Label typography sits at `label-md` (`12px`, semibold, uppercase) positioned `0.25rem` above fields.

### Taxon & Bloom Badges (C1–C5)
- **C1–C2 (Knowledge & Comprehension):** Slate-100 background (`#F1F5F9`), slate-700 text (`#334155`), 1px slate-200 border.
- **C3–C4 (Application & Analysis):** Amber-50 background (`#FFFBEB`), amber-800 text (`#92400E`), 1px amber-200 border.
- **C5–C6 (Evaluation & Creation):** Orange-50 background (`#FFF7ED`), orange-800 text (`#9A3412`), 1px orange-200 border.
- Applied padding: `2px 6px` with `label-sm` font attributes.

### Question Stimulus & Preview Panes
- Enclosed white cards bordered in `#E2E8F0`. 
- Divided horizontally: the upper quadrant hosts context stimuli (reading passage, data diagram, source material) with a subtle slate-50 sidebar; the lower quadrant contains item options with interactive key selectors.
- Correct answers highlight in `#ECFDF5` with `#059669` borders and emerald radio fill.

### Pedagogical Metadata Panels
- High-density side rails displaying curriculum alignment, estimated completion times, item discrimination indexes, and difficulty curves.
- Data presented in key-value tables featuring light borders (`#F1F5F9`), muted labels (`#64748B`), and high-contrast slate values (`#0F172A`).