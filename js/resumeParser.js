// Reads the text out of a resume file, entirely inside the browser.
// Used by app.js through extractResumeText(file).

const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438";

// Fewer words than this is not enough to analyze
const MIN_RESUME_WORDS = 30;

// An error whose message is safe and helpful to show to the user
class ResumeError extends Error {}

// ===== PDF =====
async function loadPdfJs() {
  try {
    // PDF.js is loaded only when the first PDF is chosen
    const pdfjs = await import(`${PDFJS_URL}/legacy/build/pdf.min.mjs`);
    pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS_URL}/legacy/build/pdf.worker.min.mjs`;
    return pdfjs;
  } catch {
    throw new ResumeError("The PDF reader could not be loaded. Check your internet connection and reload the page.");
  }
}

async function readPdf(data) {
  const pdfjs = await loadPdfJs();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
    // Extra files PDF.js needs for some fonts and languages
    cMapUrl: `${PDFJS_URL}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${PDFJS_URL}/standard_fonts/`,
  });

  try {
    const pdf = await loadingTask.promise;
    const pages = [];

    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      // Each item is a piece of text; hasEOL marks the end of a line
      pages.push(content.items.map((item) => item.str + (item.hasEOL ? "\n" : "")).join(""));
    }

    return pages.join("\n");
  } catch (error) {
    if (error.name === "PasswordException") {
      throw new ResumeError("This PDF is password protected. Please upload a copy without a password.");
    }
    throw new ResumeError("This PDF could not be read. It may be damaged or not really a PDF.");
  } finally {
    await loadingTask.destroy(); // free the memory used by the PDF
  }
}

// ===== DOCX =====
async function readDocx(data) {
  // "mammoth" is created by the script tag in index.html
  if (!window.mammoth) {
    throw new ResumeError("The DOCX reader could not be loaded. Check your internet connection and reload the page.");
  }

  try {
    const result = await window.mammoth.extractRawText({ arrayBuffer: data });
    return result.value;
  } catch {
    throw new ResumeError("This DOCX file could not be read. It may be damaged, password protected, or not really a DOCX file.");
  }
}

// ===== Shared =====

// Removes extra spaces and blank lines
function cleanText(text) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[^\S\n]+/g, " ") // runs of spaces and tabs become one space
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Counts words that contain at least one letter, in any language
function countWords(text) {
  return text.split(/\s+/).filter((word) => /\p{L}/u.test(word)).length;
}

// Returns { text, wordCount }, or throws a ResumeError
async function extractResumeText(file) {
  let data;
  try {
    data = await file.arrayBuffer();
  } catch {
    throw new ResumeError("This file could not be opened. Please choose it again.");
  }

  const isPdf = file.name.toLowerCase().endsWith(".pdf");
  const text = cleanText(isPdf ? await readPdf(data) : await readDocx(data));
  const wordCount = countWords(text);

  if (wordCount === 0) {
    throw new ResumeError("No text was found in this file. If it is a scanned image, please upload a version with selectable text.");
  }
  if (wordCount < MIN_RESUME_WORDS) {
    throw new ResumeError(`Only ${wordCount} ${wordCount === 1 ? "word was" : "words were"} found. A resume needs at least ${MIN_RESUME_WORDS} words to be analyzed.`);
  }

  return { text, wordCount };
}
