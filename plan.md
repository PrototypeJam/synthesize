# Plan for UI/UX Skins — Synthi Presentation Modes

## Overview
Create diverse **UI/UX presentation skins** that offer fundamentally different ways of viewing and interacting with synthesized content. Each skin should present the same data through a unique interaction paradigm tailored to different use cases.

---

## Core Principles

1. **Each skin is a React component** implementing the `SkinContract` interface
2. **Functional differences**, not just cosmetic color changes
3. **Data remains the same** —  only presentation/interaction changes
4. **Optimized for different use cases** (reading, listening, scanning, comparing, etc.)
5. **Can be switched via URL param or selector** (`?skin=CarouselSynthesis`)

---

## Restored Skins (From Git History)

### 1. **Default** (Already exists)
- Standard card-based layout
- Side-by-side summaries, full synthesis below
- Current production UI

### 2. **Carousel** (MUST RESTORE)
- Swipeable/paginated view
- One section at a time (Summary 1 → Summary 2 → Synthesis)
- Great for mobile, focused reading
- Navigation dots/arrows

### 3. **CarouselSynthesis** (MUST RESTORE)
- Enhanced carousel
- Better synthesis formatting
- Topic navigation

### 4. **Magazine** (Already exists)
- Magazine/newspaper style layout
- Multi-column text
- Pull quotes, section breaks
- Print-inspired aesthetics

---

## NEW Skin Ideas (To Create)

### 5. **Timeline**
**Use Case**: Understanding chronological flow or progression of ideas

**Features**:
- Vertical timeline visualization
- Summaries as timeline events
- Synthesis points mapped along timeline
- Visual connections between related points

**Best For**:
- Historical content
- Process explanations
- Cause-and-effect analysis

---

### 6. **Compare**
**Use Case**: Side-by-side detailed comparison

**Features**:
- Split-screen with synchronized scrolling
- Summary 1 and Summary 2 always visible next to each other
- Synthesis highlights differences/agreements
- Toggle to show only differences or only agreements
- Visual markers for conflicting vs. aligned points

**Best For**:
- Debate/discussion threads
- Comparing two articles on same topic
- Finding consensus vs. disagreement

---

### 7. **Mind Map**
**Use Case**: Visual concept relationships

**Features**:
- Interactive node graph
- Central synthesis topic
- Branches to key points from each source
- Click to expand/collapse details
- Visual clustering of related concepts

**Best For**:
- Complex technical content
- Understanding relationships
- Exploring topic connections

---

### 8. **Audio** (TTS-Optimized)
**Use Case**: Listen while doing other things

**Features**:
- Minimal visual UI — large play/pause button
- Auto-read summaries → synthesis
- Adjustable speed
- Chapter markers (can skip to sections)
- Text highlights as it reads (karaoke-style)
- Progress bar

**Best For**:
- Commuting
- Multitasking
- Accessibility

---

### 9. **Digest** (Email-Style)
**Use Case**: Quick scanning for busy people

**Features**:
- Newsletter/email layout
- Executive summary at top (3-bullet version)
- Expandable sections (collapsed by default)
- Table of contents with jump links
- "Read time" estimates per section
- Print/email export optimized

**Best For**:
- Professional consumption
- Quick review
- Sharing with colleagues

---

### 10. **Flash Cards**
**Use Case**: Learning and retention

**Features**:
- Key points as individual cards
- Click to flip for details
- "Swipe right" to mark as understood
- Shuffle mode
- Quiz yourself on synthesis conclusions
- Progress tracking

**Best For**:
- Educational content
- Memorization
- Study sessions

---

### 11. **Thread** (Conversation Style)
**Use Case**: Understanding discussion dynamics

**Features**:
- Chat bubble interface
- Summaries presented as "messages" from different sources
- Synthesis as moderator/synthesizer responses
- Timestamp-style metadata
- Shows "reactions" (if HN thread: points, replies)
- Threaded replies for nested points

**Best For**:
- HN discussions
- Forum threads
- Debate analysis

---

### 12. **Focus** (Distraction-Free)
**Use Case**: Deep reading

**Features**:
- Full-screen, minimal UI
- Large, readable typography
- Single column, centered
- Dark mode optimized
- Hide all buttons/chrome (show on hover)
- Reading progress indicator
- Optional ambient background

**Best For**:
- Long-form synthesis
- Late-night reading
- Immersive consumption

---

### 13. **Outline** (Hierarchical)
**Use Case**: Structured navigation

**Features**:
- Traditional outline view (I, A, 1, a,  etc.)
- Collapsible sections
- Sticky table of contents sidebar
- Section numbers for reference
- Copy section link
- Export to org-mode/markdown outline

**Best For**:
- Technical documentation
- Academic content
- Reference material

---

### 14. **Kanban** (Status Board)
**Use Case**: Tracking synthesis progress/topics

**Features**:
- Columns: "Source 1 Points" | "Source 2 Points" | "Synthesis Conclusions"
- Drag cards between columns (for personal highlighting)
- Filter by topic/tag
- Mark cards as "Action Item" vs. "Reference"
- Export to Trello/Notion

**Best For**:
- Project planning from research
- Organizing action items
- Team collaboration

---

### 15. **Annotate** (Markup Mode)
**Use Case**: Active reading/note-taking

**Features**:
- Inline highlighting
- Add personal notes/comments
- Tag sections
- Link related points
- Export with annotations
- Save annotation state to localStorage

**Best For**:
- Research
- Note-taking
- Building on content

---

## Implementation Priority

### Phase 1: RESTORE (Immediate)
1. ✅ Default (already working)
2. 🔴 **Carousel** (MUST RESTORE — user explicitly requested)
3. 🔴 **CarouselSynthesis** (MUST RESTORE)
4. ✅ Magazine (already exists)

### Phase 2: HIGH VALUE (Next 3)
5. **Compare** — High utility for dual-source synthesis
6. **Audio** — Aligns with user's TTS use case
7. **Digest** — Professional/sharing use case

### Phase 3: SPECIALIZED (Next 4)
8. **Focus** — Simple to implement, high value
9. **Thread** — Great for HN content
10. **Timeline** — Unique value prop
11. **Outline** — Classic, always useful

### Phase 4: ADVANCED (Future)
12. **Mind Map** — Complex but powerful
13. **Flash Cards** — Educational niche
14. **Kanban** — Collaboration/workflow
15. **Annotate** — Advanced feature

---

## Technical Requirements

### SkinContract Interface
Each skin must implement:

```typescript
interface SkinProps {
  data: {
    summary1: string;
    summary2?: string;
    synthesis?: string;
    url1?: string;
    url2?: string;
    hnTitle?: string | null;
  };
  isBusy: boolean;
  statusText: string;
  canShare: boolean;
  actions: {
    onDownloadFull: () => void;
    onShare: (title: string, text: string) => void;
  };
}

export type SkinComponent = React.FC<SkinProps>;
```

### File Structure
```
src/components/skins/
├── SkinContract.ts          # Interface definition
├── Default.tsx              # Standard layout
├── Carousel.tsx             # Basic carousel
├── CarouselSynthesis.tsx    # Enhanced carousel
├── Magazine.tsx             # Magazine layout
├── Compare.tsx              # NEW
├── Audio.tsx                # NEW
├── Digest.tsx               # NEW
├── Focus.tsx                # NEW
├── Thread.tsx               # NEW
└── ... (future skins)
```

### Skin Loading
App.tsx uses dynamic imports:
```typescript
const skins = import.meta.glob('./components/skins/*.tsx');
const key = `./components/skins/${name}.tsx`;
const module = await skins[key]();
setSkin(() => module.default as SkinComponent);
```

### URL-Based Selection
```
?skin=Carousel           → Carousel.tsx
?skin=CarouselSynthesis  → CarouselSynthesis.tsx
?skin=Compare            → Compare.tsx
```

---

## Success Criteria

A skin is considered successful if it:

1. ✅ Implements the SkinContract interface
2. ✅ Renders all provided data faithfully
3. ✅ Offers a **genuinely different** interaction paradigm
4. ✅ Optimizes for a specific use case
5. ✅ Works responsively (mobile + desktop)
6. ✅ Maintains accessibility standards
7. ✅ Loads dynamically without errors

---

## Next Steps

1. **IMMEDIATE**: Restore Carousel & CarouselSynthesis from git history
2. **VERIFY**: All 4 original skins work correctly
3. **IMPLEMENT**: Compare skin (high value, relatively simple)
4. **ITERATE**: Get feedback, implement next priority skins
5. **DOCUMENT**: Update README with skin showcase

---

## Notes

- **Do NOT modify core App.tsx logic** beyond skin loading
- **Do NOT change data processing** — skins are presentation only
- **Keep each skin focused** — one clear use case per skin
- **Test with real content** — use actual HN threads and articles
- **Mobile-first** — many skins excel on mobile (Carousel, Audio, etc.)

---

This plan preserves the elegant architecture while dramatically expanding the ways users can consume synthesized content.
