# Theme Improvement Plan

## 1. Goal

Enhance distinction between UI elements while maintaining the Glassmorphic aesthetic. This is achieved by creating more varied background levels and stronger, high-contrast borders.

## 2. Color Palette Audit

- **Primary:** `#ca1d49` (K-Collect Red)
- **Background:** `#000` (Pure Black) -> _Suggesting a shift to `#050506` for deep depth._
- **Glass Panel:** `rgba(255, 255, 255, 0.03)` -> _Suggesting `rgba(255, 255, 255, 0.04)`_
- **Glass Card:** `rgba(255, 255, 255, 0.05)` -> _Suggesting `rgba(255, 255, 255, 0.07)`_
- **Borders:** `rgba(255, 255, 255, 0.05)` to `0.1` -> _Suggesting `rgba(255, 255, 255, 0.1)` to `0.2` for better visibility._

## 3. Proposed Palette Changes

| Level           | Current                  | Proposed                 | Usage                          |
| --------------- | ------------------------ | ------------------------ | ------------------------------ |
| Background      | `#000000`                | `#050506`                | Main app background            |
| Surface (Low)   | `rgba(255,255,255,0.03)` | `rgba(255,255,255,0.04)` | Large panels, sidebars         |
| Surface (Mid)   | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.07)` | Standard cards, widgets        |
| Surface (High)  | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` | Modals, active states, hover   |
| Border (Soft)   | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.12)` | Subtle section separators      |
| Border (Strong) | `rgba(255,255,255,0.1)`  | `rgba(255,255,255,0.22)` | Primary card borders           |
| Primary Accent  | `#ca1d49`                | `#e31b4d`                | Brighter red for accessibility |

## 4. Implementation Steps

1. Update `src/App.tsx` theme configuration for primary and background.
2. Update `src/styles/App.css` global glass classes.
3. Update `WidgetContainer.tsx` to use the new surface levels.
4. Update `NavBar.tsx` (if applicable) for deeper glass effect.
