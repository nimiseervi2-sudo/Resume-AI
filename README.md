# ResumeAI

An AI Resume Analyzer that compares your resume with a job description.

**Status:** Phase 7 of 8 (final features). Add a PDF or DOCX resume and a job
description to get an AI analysis. If AI is not set up or unavailable, a basic
keyword analysis runs in your browser instead.

The dashboard shows an estimated score (strong match from 75, moderate from 50,
low below that), skill coverage, matching and missing skills, strengths,
weaknesses, suggestions and keywords to consider. You can download the results
as a text report, or print them and choose "Save as PDF".

## How the basic score works

1. The analyzer looks for known skills (listed at the top of `js/analyzer.js`)
   in the job description, then checks which of them your resume mentions.
2. It also picks up to 10 other words or phrases that the job description repeats.
3. Skills make up 75% of the score and other keywords 25%. Soft skills count half
   as much as technical skills. If only one of the two groups is found, it makes
   up the whole score.

It matches words, not meaning. It does not understand phrases such as "no PHP
needed", it only knows the skills in its list, and it works best in English. The
score is an estimate, not the result of a real applicant tracking system.

## Run it locally

You need Node.js 20.12 or newer. From the project folder:

```bash
npm install
cp .env.example .env   # skip if you already have a .env file
npm start
```

Then open <http://127.0.0.1:5500>. Opening `index.html` directly also works, but
only with the basic analysis.

An internet connection is needed because the file readers are loaded from the
jsDelivr CDN:

| Library | Version | Reads |
| --- | --- | --- |
| [PDF.js](https://mozilla.github.io/pdf.js/) | 6.5.438 | PDF |
| [Mammoth.js](https://github.com/mwilliamson/mammoth.js) | 1.13.0 | DOCX |

Known limits: scanned (image only) resumes cannot be read, and text in DOCX page
headers and footers is not extracted.

## Set up free AI analysis

Edit `.env`, then restart the server. It works with any OpenAI-compatible service.

### Option 1: Ollama (free, private, on your computer)

1. Install [Ollama](https://ollama.com).
2. Download a model: `ollama pull qwen3.5:9b` (about 6.6 GB).
3. Keep the Ollama settings from `.env.example`.

The first request is slow while the model loads. Long resumes need a context
length of about 16,000 tokens (`OLLAMA_CONTEXT_LENGTH=16384`); with a smaller
one, Ollama may silently cut off text.

### Option 2: A hosted service (needed when you deploy the website)

Ollama on your computer cannot be reached by a hosted website. Create an API key
at [Groq](https://console.groq.com/keys) or
[Google AI Studio](https://aistudio.google.com), then use the matching block in
`.env.example`. Free tiers have usage limits that change, and may store or learn
from what you send, so check the provider's terms.

### Settings

| Variable | Meaning |
| --- | --- |
| `PORT` | Web server port (default 5500) |
| `HOST` | `127.0.0.1` locally, `0.0.0.0` on a hosting service |
| `TRUST_PROXY` | Set to `1` behind a hosting service's proxy |
| `LLM_BASE_URL` | Address of the AI service |
| `LLM_MODEL` | Model name |
| `LLM_API_KEY` | Secret key (not needed for local Ollama) |
| `LLM_REASONING_EFFORT` | Optional; `none` speeds up Ollama reasoning models |
| `LLM_TIMEOUT_MS` | Longest wait for a reply (default 120000) |

## Privacy and safety

- The resume file never leaves your browser. With AI on, its text and the job
  details are sent to the server and on to the AI service. The page says where.
- The API key stays on the server. `.env` is not committed or served.
- The server does not save or log resume content.
- AI answers are checked: wrong formats are rejected, and a skill is only shown
  as matched if the resume text mentions it. Other AI text is not verified, so
  read it critically.
- Each visitor can make 10 AI requests per minute.

## Run the tests

```bash
npm test
```

## Project structure

```
index.html      Page content
css/style.css   Styling
js/app.js       Menu, file selection and form validation
js/resumeParser.js  Reads text from PDF and DOCX files
js/analyzer.js      Basic keyword analysis and scoring
js/dashboard.js     Shows the results
js/report.js        Builds the downloadable report
backend/server.js   Web server
backend/routes/     AI analysis API
tests/              Automated tests for the analyzer and server
```

## Roadmap

- [x] Phase 1: Project setup
- [x] Phase 2: Frontend (upload area and job description)
- [x] Phase 3: PDF and DOCX parsing
- [x] Phase 4: Basic keyword analysis
- [x] Phase 5: AI integration
- [x] Phase 6: Results dashboard
- [x] Phase 7: Report download and polish
- [ ] Phase 8: Documentation and deployment

## Note

Any ATS score shown by this app is an estimate. It does not come from a real
applicant tracking system.
