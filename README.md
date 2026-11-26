# ResumeAI

An AI Resume Analyzer that compares your resume with a job description.

**Status:** Phase 4 of 8 (basic analysis). Add a PDF or DOCX resume and a job
description to get an estimated match score, skill and keyword gaps, and basic
suggestions. Everything runs in your browser. AI analysis is not built yet.

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

## Run the tests

```bash
npm test
```

## Run it locally

You need Python 3. From the project folder:

```bash
npm start
```

Then open <http://127.0.0.1:5500>. You can also open `index.html` directly in a
browser.

An internet connection is needed because the file readers are loaded from the
jsDelivr CDN:

| Library | Version | Reads |
| --- | --- | --- |
| [PDF.js](https://mozilla.github.io/pdf.js/) | 6.5.438 | PDF |
| [Mammoth.js](https://github.com/mwilliamson/mammoth.js) | 1.13.0 | DOCX |

Known limits: scanned (image only) resumes cannot be read, and text in DOCX page
headers and footers is not extracted.

## Project structure

```
index.html      Page content
css/style.css   Styling
js/app.js       Menu, file selection and form validation
js/resumeParser.js  Reads text from PDF and DOCX files
js/analyzer.js      Basic keyword analysis and scoring
js/dashboard.js     Shows the results
tests/              Automated tests for the analyzer
```

## Roadmap

- [x] Phase 1: Project setup
- [x] Phase 2: Frontend (upload area and job description)
- [x] Phase 3: PDF and DOCX parsing
- [x] Phase 4: Basic keyword analysis
- [ ] Phase 5: AI integration
- [ ] Phase 6: Results dashboard
- [ ] Phase 7: Report download and polish
- [ ] Phase 8: Documentation and deployment

## Note

Any ATS score shown by this app is an estimate. It does not come from a real
applicant tracking system.
