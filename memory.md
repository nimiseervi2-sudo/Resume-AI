# Project memory

Notes for picking this project up again, for a person or an AI assistant.
Setup and usage are in [README.md](README.md). Update this file after each change.

## Current state (2026-11-27)

- All 8 development phases are complete and pushed to `main`.
- The app works locally with free AI through Ollama (`qwen3.5:9b`).
- It is **not deployed** yet.

## Still to do

1. Deploy on Render using `render.yaml` and a Groq API key (steps in the README).
2. Test hosted AI. Groq and Gemini have never been called with a real key.
3. Check on Safari, a real phone and Node 24 (Render's setting).
4. Try more real resumes, such as ones made with Microsoft Word or Canva, and
   multi-column layouts.

## Working rules

- Keep the code beginner friendly, with few files and no unnecessary tools.
- HTML, CSS and vanilla JavaScript. No React unless there is a clear reason,
  explained first.
- No database, accounts, payments, Docker or microservices.
- Work in small stages: build, test, commit, push, then confirm the push worked.
- Never force push or rewrite history.
- Never commit `.env`, API keys or resumes.
- Never show fake AI results.

## How it fits together

| File | Job |
| --- | --- |
| `js/app.js` | Menu, file choice, form checks, starts the analysis |
| `js/resumeParser.js` | PDF.js and Mammoth.js text extraction |
| `js/analyzer.js` | Rule-based analysis and the skill list; the server uses it too |
| `js/dashboard.js` | Draws the results |
| `js/report.js` | Text report download |
| `backend/server.js` | Serves the page, `css/` and `js/` only |
| `backend/routes/analyze.js` | `/api/status` and `/api/analyze` |

Flow: the browser reads the file, then sends the text to `/api/analyze`. The
server asks the AI for JSON and checks it. If anything fails, the browser runs
the basic analysis and says why.

## Decisions and reasons

| Decision | Reason |
| --- | --- |
| Resume files are read in the browser | The file never needs uploading |
| Library versions are pinned | An update cannot silently change behaviour |
| One OpenAI-compatible API format | Switching AI provider only needs `.env` changes |
| Ollama for local use | Free, private, no key |
| AI skills are checked against the resume | Stops invented matches |
| No chart library | CSS draws the score ring and bar well enough |
| Report is plain text, PDF uses browser printing | No extra library |

## Things that catch you out

- A new skill goes in the lists at the top of `js/analyzer.js`. Short or everyday
  names (C, R, Go, React, Excel) need special patterns; add a test.
- `analyzer.js` and `report.js` end with a `module.exports` line so Node can load
  them. Browsers skip it.
- A new public folder must be added in `backend/server.js`, or it returns 404.
- The server allows 10 AI requests per minute per address. Repeated testing can
  hit that limit.
- With Ollama, the first request is slow while the model loads, and a small
  context length can silently cut off long resumes.
- Opening `index.html` directly gives only the basic analysis.

## Testing

`npm test` runs the analyzer, report and server tests (32 at version 1.0.0). The
server tests use a stand-in AI service.

Browser checks during development used temporary scripts that are **not** in this
repository. Repeat the user journey by hand after interface changes: upload,
analyze with and without AI, cancel, download, print, remove.

## History

| Commit | Phase | What changed |
| --- | --- | --- |
| `be7ddc4` | 1 | Project setup and landing page |
| `5aa7e64` | 2 | Upload form, job description, mobile menu |
| `27dd327` | 3 | PDF and DOCX parsing |
| `efb76dc` | 4 | Basic keyword analysis |
| `c813321` | 5 | Express backend and AI analysis |
| `f3641e4` | 6 | Results dashboard |
| `5958a91` | 7 | Report download, progress, cancel and retry |
| `bec6e40` | 8 | Bug fixes, documentation, screenshots, Render settings |
