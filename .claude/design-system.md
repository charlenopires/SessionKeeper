# Design System

> Extracted from: https://cdn.dribbble.com/userupload/36967500/file/original-74eabc81f0b0a4ef535aa8c4e527ff8e.png?resize=1504x1128&vertical=center
> Generated: 2026-01-25 00:46:14

All UI implementation MUST follow the design tokens defined below.

## CSS Custom Properties

```css
:root {

  /* Primary Colors */
  --color-primary-500: #5B6BC0;
  --color-primary-600: #3F51B5;

  /* Secondary Colors */
  --color-secondary-500: #42A5F5;
  --color-secondary-600: #1E88E5;

  /* Neutral Colors */
  --color-neutral-900: #1A1A1A;
  --color-neutral-800: #2D2D2D;
  --color-neutral-700: #404040;
  --color-neutral-600: #525252;
  --color-neutral-400: #A3A3A3;
  --color-neutral-100: #F5F5F5;

  /* Semantic Colors */
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #F44336;
  --color-info: #2196F3;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Breakpoints */
  --breakpoint-mobile: 320px;
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
}
```

## Color Palette

### Primary Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-primary-500` | `#5B6BC0` | 91, 107, 192 | Play/pause button, active states |
| `--color-primary-600` | `#3F51B5` | 63, 81, 181 | Darker primary variant |

### Secondary Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-secondary-500` | `#42A5F5` | 66, 165, 245 | Accent elements |
| `--color-secondary-600` | `#1E88E5` | 30, 136, 229 | Darker secondary variant |

### Neutral Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-neutral-900` | `#1A1A1A` | 26, 26, 26 | Main background |
| `--color-neutral-800` | `#2D2D2D` | 45, 45, 45 | Card backgrounds |
| `--color-neutral-700` | `#404040` | 64, 64, 64 | Secondary backgrounds |
| `--color-neutral-600` | `#525252` | 82, 82, 82 | Border colors |
| `--color-neutral-400` | `#A3A3A3` | 163, 163, 163 | Secondary text |
| `--color-neutral-100` | `#F5F5F5` | 245, 245, 245 | Primary text |

### Semantic Colors

| Role | Hex |
|------|-----|
| success | `#4CAF50` |
| warning | `#FF9800` |
| error | `#F44336` |
| info | `#2196F3` |

## Typography

### Font Families

| Family | Category | Weights | Usage |
|--------|----------|---------|-------|
| System Font | sans-serif | 400, 500, 600 | All UI text |

### Type Scale

| Token | Size | Weight | Line Height |
|-------|------|--------|-------------|
| `display-lg` | 48px | 400 | 1.2 |
| `heading-md` | 18px | 500 | 1.3 |
| `body-md` | 16px | 400 | 1.4 |
| `body-sm` | 14px | 400 | 1.4 |
| `caption` | 12px | 400 | 1.3 |

## Spacing Scale

| Token | Value |
|-------|-------|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |

## Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-full` | 9999px |

## Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.1)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` |

## Breakpoints

| Name | Min Width |
|------|-----------|
| mobile | 320px |
| tablet | 768px |
| desktop | 1024px |

## Components

### Timer Display

Large time display with play/pause controls

**Variants:** active, paused

**States:** running, stopped, paused

### Task List Item

Time tracking entry with task name and duration

**Variants:** active, completed

**States:** default, hover, active

### Icon Button

Circular button with icon

**Variants:** primary, secondary

**States:** default, hover, pressed, disabled

### Dropdown

Project selector dropdown

**Variants:** default

**States:** closed, open, disabled

### Time Badge

Duration display badge

**Variants:** default, total

**States:** default

