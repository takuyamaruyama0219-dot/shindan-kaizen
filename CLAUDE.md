# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

持ち家の受給診断サイト (Home Ownership Benefit Eligibility Diagnostic) — a Japanese lead-generation SPA that guides homeowners through a 9-question diagnostic to assess benefit eligibility, then directs them to LINE signup based on their score.

## Development

This is a **pure vanilla HTML/CSS/JS static site** with no build tools, no package manager, and no dependencies. To develop:

- Open `index.html` directly in a browser, or serve via any HTTP server (e.g., `python3 -m http.server`)
- No build step, no tests, no linting configured

## Architecture

**Single-page app with three files:**
- `index.html` — all markup (~745 lines), sections: header, hero, cases (実績スライダー), trust, service (contains shindan quiz), result modal, ineligible modal, FAQ, footer, floating CTA
- `js/main.js` — all logic (~825 lines), wrapped in a single IIFE; includes a separate IIFE for the cases slider (infinite-loop carousel with clone-based wrapping, touch/mouse drag, auto-advance)
- `css/style.css` — all styles (~1,830 lines), BEM naming, mobile-first with 769px breakpoint

**State management** is via module-scoped variables in the IIFE: `currentStep`, `answers` (object keyed by `q1`–`q9`), `isTransitioning`, `isPopstateHandling`, `hasStarted`.

**Routing** uses URL hash fragments (`#step1`–`#step9`, `#step0a` for results). The `popstate` handler enables browser back/forward navigation. On page load, stale hashes (no answer data) are cleared back to step 1.

**UI modes:** The page toggles between landing page and diagnostic mode via the CSS class `is-diagnostic-mode` on `<body>`, which hides hero/trust/service/footer/floating-CTA sections and makes the shindan section full-viewport.

**Quiz flow:**
- Q1–Q2: Single-select (radio-style buttons with `.shindan__option-radio`), auto-advance on selection after 300ms delay
- Q3–Q9: Multi-select checkboxes (`.shindan__option-check`) with per-question images; "特にない" (nothing, marked with `data-none`) deselects all others and vice versa; explicit "次へ" (next) button required
- Ineligible users (Q1: マンション/賃貸, Q2: いいえ) see a modal and get fully reset

**Scoring:** Q3–Q9 each contribute 1 point if any non-"特にない" item is selected (max 7). Score ≥2 = high, 1 = mid, 0 = low. Each level maps to a different LINE URL via `lineUrls` object.

**DOM element IDs** used in JS (prefixed `js-`): `js-shindan`, `js-cards`, `js-dots`, `js-step-current`, `js-back`, `js-result-overlay`, `js-ineligible-overlay`, `js-ineligible-close`, `js-floating-cta`, `js-floating-text`, `js-start-top`, `js-start-trust`, `js-start-floating`, `js-line-btn`, `js-result-modal`, `js-cases-track`, `js-cases-slider`, `js-cases-dots`, `js-cases-prev`, `js-cases-next`.

**CSS state classes:** `is-diagnostic-mode` (body), `is-active` (modals), `is-selected` (radio options), `is-checked` (checkbox options), `is-hidden` (floating CTA), `is-open` (FAQ answers), `is-visible` (scroll animations), `is-dragging` (slider track), `shindan__card--active`, `shindan__dot--done`, `shindan__dot--current`, `cases__dot--active`.

## Key External Integrations

- **GTM:** Container `GTM-PBZQ6P4B` in head and noscript body
- **LINE:** Three friend-add URLs with different `uLand` params based on eligibility level (high: `EBESpW`, mid: `xU7t6F`, low: `VdukkE`)
- **Google Fonts:** Noto Sans JP (400, 500, 700, 900)

## Design System

- Primary orange: `#E8721C`, dark orange hover: `#D4600F`, light orange bg: `#FFF5ED`
- Text: `#412807` (dark brown), `#666666` (gray)
- Accent: `#FFD700` (yellow), green next-button: `#4CAF50`, LINE green: `#06C755`
- Font: Noto Sans JP (400, 500, 700, 900)
- Rounded pill buttons (`border-radius: 50px`), card shadows, 300ms ease transitions
- Max content width: 480px mobile, 640px desktop

## Specification

`仕様書.md` contains the full Japanese specification with page structure, question wording, component styling details, scoring logic, and animation specs. Consult this when making changes.
