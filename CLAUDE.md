# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

持ち家の給付金診断サイト (Home Ownership Benefit Eligibility Diagnostic) — a Japanese lead-generation SPA that guides homeowners through a 9-question diagnostic to assess benefit eligibility, then directs them to LINE signup based on their score.

## Development

This is a **pure vanilla HTML/CSS/JS static site** with no build tools, no package manager, and no dependencies. To develop:

- Open `index.html` directly in a browser, or serve via any HTTP server (e.g., `python3 -m http.server`)
- No build step, no tests, no linting configured

## Architecture

**Single-page app with three files:**
- `index.html` — all markup (~600 lines)
- `js/main.js` — all logic (~460 lines), wrapped in an IIFE
- `css/style.css` — all styles (~1,340 lines), BEM naming, mobile-first with 769px breakpoint

**State management** is via module-scoped variables in the IIFE: `currentStep`, `answers`, `isTransitioning`, `isPopstateHandling`.

**Routing** uses URL hash fragments (`#step1`–`#step9`, `#step0a` for results). The `popstate` handler enables browser back/forward navigation.

**UI modes:** The page toggles between landing page and diagnostic mode via the CSS class `is-diagnostic-mode` on `<body>`, which hides hero/trust/service/footer sections.

**Quiz flow:**
- Q1–Q2: Single-select (radio-style), auto-advance on selection
- Q3–Q9: Multi-select checkboxes with images; "特にない" (nothing) option deselects all others
- Ineligible users (not homeowners or no insurance) see a modal and get reset

**Scoring:** Q3–Q9 each contribute 1 point if any damage item is selected (max 7). Score ≥2 = high, 1 = mid, 0 = low. Each level maps to a different LINE URL.

## Key External Integrations

- **GTM:** Container `GTM-PBZQ6P4B` in head
- **LINE:** Three friend-add URLs with different `uLand` params based on eligibility level
- **Google Fonts:** Noto Sans JP

## Design System

- Primary orange: `#E8721C`, dark orange hover: `#D4600F`, light orange bg: `#FFF5ED`
- Text: `#412807` (dark brown), `#666666` (gray)
- Accent: `#FFD700` (yellow)
- Font: Noto Sans JP (400, 500, 700, 900)
- Rounded pill buttons (border-radius: 50px), card shadows, 300ms ease transitions

## Specification

`仕様書.md` contains the full Japanese specification with page structure, question wording, component styling details, scoring logic, and animation specs. Consult this when making changes.
