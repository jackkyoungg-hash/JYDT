<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bf04d704-39f6-4fd3-9d22-e61894ed434b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Automated tests

Use Node.js 24 (the version used to verify this setup), or a supported Node.js
version satisfying the development dependencies' engines. Install the locked
dependencies with `npm ci`.

| Command | Purpose |
| --- | --- |
| `npm test` | Run the service unit tests once |
| `npm run test:watch` | Rerun unit tests while editing |
| `npm run test:e2e:install` | Download Playwright's Chromium browser once per machine/version |
| `npm run test:e2e` | Build the app and run browser smoke tests against the production preview |
| `npm run build` | Build production assets independently |

For a fresh checkout, run `npm ci`, `npm run test:e2e:install`, `npm test`, then
`npm run test:e2e`. Linux CI runners may need
`npx playwright install --with-deps chromium` instead of the browser install command.
No Gemini API key or physical MIDI kit is required for these tests.

Vitest runs only `tests/unit/**/*.test.ts` in Node. A small in-memory storage
adapter isolates each test; MIDI import fixtures are real bytes serialized by
the existing `@tonejs/midi` dependency. Coverage includes keyboard persistence and
reset, storage failures, built-in groove timing, saved songs, MIDI note mapping,
tempo and difficulty thresholds, and MIDI input filtering/unsubscription.

Playwright runs only `tests/e2e` in Chromium. It builds and starts its own preview
on `127.0.0.1:4173`; keep that port free. Each test gets a fresh browser context.
The smoke tests cover practice navigation, library search and stage entry,
keyboard settings persistence/reset, and MIDI import persistence. They disable
Web MIDI to exercise the keyboard fallback and block external fonts, the CDN
stylesheet and remote logo. These are functional checks; they do not verify
external assets, visual appearance, physical MIDI hardware, audio playback,
scoring during playback or other browsers. Failure screenshots and traces go to
the ignored `test-results/` directory.

### Baseline findings

- The unit suite has 23 passing tests and one **expected failure** (`it.fails`):
  a MIDI with no tracks currently imports with duration `-Infinity` rather than
  the intended 60-second fallback. A MIDI with an empty track uses the fallback
  correctly. The expected-failure test will require updating when that bug is fixed.
- The production build passes. The separate `npx tsc --noEmit` check already
  reports nine errors in `components/PracticeRoom.tsx` around the uploaded file
  types. This testing change leaves those production issues untouched.
- At setup time, `npm audit` reports the same nine affected packages as the
  baseline (one low, two moderate, six high). No existing dependency version was
  changed. Vitest 4.1.12 and Playwright 1.64.1 are pinned development dependencies.
- Measured on Windows, the test dependencies add approximately **22 MB** to
  `node_modules` (120 MB to 142 MB). The first Chromium install adds approximately
  **753 MB** in the shared Playwright cache, including Chromium, its headless
  shell and helper binaries. Allow roughly **0.8 GB**, plus npm's download cache
  and any failure artifacts. These binaries are not committed or bundled into
  the production app.
