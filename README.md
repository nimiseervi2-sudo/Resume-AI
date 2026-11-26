# ResumeAI

An AI Resume Analyzer that compares your resume with a job description.

**Status:** Phase 3 of 8 (resume parsing). You can add a PDF or DOCX resume,
which is read inside your browser, and paste a job description. Analysis is not
built yet.

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
```

## Roadmap

- [x] Phase 1: Project setup
- [x] Phase 2: Frontend (upload area and job description)
- [x] Phase 3: PDF and DOCX parsing
- [ ] Phase 4: Basic keyword analysis
- [ ] Phase 5: AI integration
- [ ] Phase 6: Results dashboard
- [ ] Phase 7: Report download and polish
- [ ] Phase 8: Documentation and deployment

## Note

Any ATS score shown by this app is an estimate. It does not come from a real
applicant tracking system.
