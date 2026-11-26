// Main script for ResumeAI.

// Show the current year in the footer so it never goes out of date.
document.getElementById("current-year").textContent = new Date().getFullYear();

// ===== Mobile menu =====
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

function setMenuOpen(isOpen) {
  navLinks.classList.toggle("open", isOpen);
  menuToggle.setAttribute("aria-expanded", isOpen);
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(!navLinks.classList.contains("open"));
});

// Close the menu after a link is chosen, or when Escape is pressed
navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navLinks.classList.contains("open")) {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

// ===== Resume file selection =====
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("resume-file");
const dropPrompt = document.getElementById("drop-prompt");
const fileInfo = document.getElementById("file-info");
const fileError = document.getElementById("file-error");
const formStatus = document.getElementById("form-status");
const fileStatus = document.getElementById("file-status");
const textPreview = document.getElementById("text-preview");

// The chosen resume as { file, text, wordCount }, or null
let resume = null;

// Goes up each time a new read starts or is cancelled
let readId = 0;
let isReading = false;

// Returns an error message, or an empty string if the file is acceptable
function getFileProblem(file) {
  const name = file.name.toLowerCase();

  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "Please choose a PDF or DOCX file.";
  }
  if (file.size === 0) {
    return "This file is empty. Please choose another one.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "This file is larger than 5 MB. Please choose a smaller one.";
  }
  return "";
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showFileError(message) {
  fileError.textContent = message;
  dropZone.classList.toggle("invalid", message !== "");
}

// Updates the upload box to match "resume"
function showResume() {
  dropPrompt.hidden = resume !== null;
  fileInfo.hidden = resume === null;
  textPreview.hidden = resume === null;
  textPreview.open = false;
  // With a file chosen, keyboard users go straight to Replace and Remove
  fileInput.tabIndex = resume ? -1 : 0;

  if (resume) {
    document.getElementById("file-name").textContent = resume.file.name;
    document.getElementById("file-size").textContent =
      `${formatFileSize(resume.file.size)} · ${resume.wordCount.toLocaleString("en-US")} words read`;
  }
  // textContent shows the resume as plain text, never as HTML
  document.getElementById("preview-text").textContent = resume ? resume.text : "";
}

function setReading(message) {
  isReading = message !== "";
  fileStatus.textContent = message;
}

// A rejected file does not replace a good one that is already chosen
function rejectFile(message) {
  const kept = resume ? ` Still using ${resume.file.name}.` : "";
  showFileError(message + kept);
}

async function chooseFiles(files) {
  if (files.length === 0) return;

  const file = files[0];
  const thisRead = ++readId; // cancels any read already in progress
  formStatus.textContent = "";
  setReading("");

  const problem = files.length > 1
    ? "Please add only one file."
    : getFileProblem(file);

  if (problem) {
    rejectFile(problem);
    return;
  }

  showFileError("");
  setReading(`Reading ${file.name}…`);

  try {
    const result = await extractResumeText(file);
    if (thisRead !== readId) return; // the user has moved on to something else

    resume = { file, ...result };
    clearAnalysis(); // old results belong to the old resume
    formStatus.textContent = "";
    setReading("");
    showResume();
  } catch (error) {
    if (thisRead !== readId) return;

    setReading("");
    rejectFile(error instanceof ResumeError
      ? error.message
      : "Something went wrong while reading this file. Please try another one.");
  }
}

fileInput.addEventListener("change", () => {
  chooseFiles(Array.from(fileInput.files));
  fileInput.value = ""; // so choosing the same file again still triggers "change"
});

document.getElementById("replace-file").addEventListener("click", () => {
  fileInput.click();
});

document.getElementById("remove-file").addEventListener("click", () => {
  resume = null;
  clearAnalysis();
  readId++; // cancels any read in progress
  setReading("");
  formStatus.textContent = "";
  showFileError("");
  showResume();
  fileInput.focus();
});

// ===== Drag and drop =====
function isFileDrag(event) {
  return event.dataTransfer.types.includes("Files");
}

dropZone.addEventListener("dragover", (event) => {
  if (!isFileDrag(event)) return;
  event.preventDefault(); // required to allow dropping
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", (event) => {
  // Ignore moves between elements inside the drop zone
  if (!dropZone.contains(event.relatedTarget)) {
    dropZone.classList.remove("dragging");
  }
});

dropZone.addEventListener("drop", (event) => {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  dropZone.classList.remove("dragging");
  chooseFiles(event.dataTransfer.files);
});

// Stop the browser from opening a file that is dropped outside the drop zone
for (const type of ["dragover", "drop"]) {
  window.addEventListener(type, (event) => {
    if (isFileDrag(event)) event.preventDefault();
  });
}

// ===== Job description and form =====
const MIN_DESCRIPTION_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 10000;

const form = document.getElementById("analyze-form");
const titleInput = document.getElementById("job-title");
const descriptionInput = document.getElementById("job-description");
const descriptionCount = document.getElementById("description-count");
const descriptionError = document.getElementById("description-error");

function getDescriptionProblem(text) {
  const length = text.trim().length;

  if (length === 0) {
    return "Please paste the job description.";
  }
  if (length < MIN_DESCRIPTION_LENGTH) {
    return `The job description is too short. Please enter at least ${MIN_DESCRIPTION_LENGTH} characters.`;
  }
  if (length > MAX_DESCRIPTION_LENGTH) {
    return "The job description is too long. Please keep it under 10,000 characters.";
  }
  return "";
}

function showDescriptionError(message) {
  descriptionError.textContent = message;
  descriptionInput.setAttribute("aria-invalid", message !== "");
}

function updateCharacterCount() {
  const length = descriptionInput.value.trim().length;
  descriptionCount.textContent = `${length.toLocaleString("en-US")} / 10,000 characters`;
  descriptionCount.classList.toggle("over-limit", length > MAX_DESCRIPTION_LENGTH);
}

descriptionInput.addEventListener("input", () => {
  updateCharacterCount();
  formStatus.textContent = "";
  clearAnalysis();

  // Clear an error as soon as the text becomes valid
  if (descriptionError.textContent && !getDescriptionProblem(descriptionInput.value)) {
    showDescriptionError("");
  }
});

titleInput.addEventListener("input", () => {
  formStatus.textContent = "";
  clearAnalysis();
});

// ===== Analysis =====
const useAiInput = document.getElementById("use-ai");
const aiNote = document.getElementById("ai-note");
const analyzeButton = document.getElementById("analyze-button");

// Lets us cancel an AI request when the user changes something
let aiRequest = null;

// Removes old results and stops any analysis in progress
function clearAnalysis() {
  if (aiRequest) {
    aiRequest.abort();
    aiRequest = null;
    setAnalyzing(false);
  }
  hideResults();
}

function setAnalyzing(isAnalyzing) {
  analyzeButton.disabled = isAnalyzing;
  analyzeButton.textContent = isAnalyzing ? "Analyzing…" : "Analyze Resume";
}

// Asks the server whether AI is set up, and tells the user where text will go
async function checkAiStatus() {
  let status = { aiAvailable: false };
  try {
    const response = await fetch("/api/status");
    if (response.ok) status = await response.json();
  } catch {
    // No server (for example, index.html opened directly): use basic analysis
  }

  useAiInput.disabled = !status.aiAvailable;
  useAiInput.checked = status.aiAvailable;

  if (!status.aiAvailable) {
    aiNote.textContent = "AI analysis is not set up, so you will get the basic keyword analysis.";
  } else if (status.isLocal) {
    aiNote.textContent = `Your resume text is analyzed by ${status.model}, running on the same machine as this website.`;
  } else {
    aiNote.textContent = `Your resume text and the job details will be sent to ${status.service}. Free AI services may store or learn from what you send. Untick to keep everything in your browser.`;
  }
}

async function requestAiAnalysis(details, signal) {
  let response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
      signal,
    });
  } catch {
    throw new Error("The server could not be reached.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    throw new Error(data?.error || "The server sent an unexpected answer.");
  }
  return data;
}

function runBasicAnalysis(details, notice = "") {
  try {
    const result = analyzeResume(details.resumeText, details.jobDescription, details.jobTitle);
    showResults(result, "Basic keyword analysis, without AI. The score is an estimate.", notice);
  } catch (error) {
    formStatus.textContent = notice ? `${notice.replace(" Showing the basic analysis instead.", "")} ${error.message}` : error.message;
  }
}

async function runAnalysis() {
  const details = {
    resumeText: resume.text,
    jobDescription: descriptionInput.value.trim(),
    jobTitle: titleInput.value.trim(),
  };

  if (!useAiInput.checked) {
    runBasicAnalysis(details);
    return;
  }

  const request = new AbortController();
  aiRequest = request;
  setAnalyzing(true);
  formStatus.textContent = "The AI is reading your resume. This can take up to two minutes.";

  try {
    const result = await requestAiAnalysis(details, request.signal);
    if (request !== aiRequest) return; // cancelled
    formStatus.textContent = "";
    showResults(result, `AI analysis by ${result.model}. The score is an estimate, and AI can make mistakes.`);
  } catch (error) {
    if (request !== aiRequest) return;
    formStatus.textContent = "";
    runBasicAnalysis(details, `AI analysis was not available: ${error.message} Showing the basic analysis instead.`);
  }

  aiRequest = null;
  setAnalyzing(false);
}

useAiInput.addEventListener("change", () => {
  formStatus.textContent = "";
  clearAnalysis();
});

form.addEventListener("submit", (event) => {
  event.preventDefault(); // stay on the page
  if (aiRequest) return; // already analyzing
  formStatus.textContent = "";
  clearAnalysis();

  if (isReading) {
    formStatus.textContent = "Your resume is still being read. Please try again in a moment.";
    return;
  }

  const fileProblem = resume ? "" : "Please add your resume.";
  const descriptionProblem = getDescriptionProblem(descriptionInput.value);

  // Keep an explanation of why the last file failed, if there is one
  if (!resume) showFileError(fileError.textContent || fileProblem);
  else showFileError("");
  showDescriptionError(descriptionProblem);

  // Move to the first field that needs attention
  if (fileProblem) {
    fileInput.focus();
  } else if (descriptionProblem) {
    descriptionInput.focus();
  } else {
    runAnalysis();
  }
});

// Some browsers restore typed text after a reload
updateCharacterCount();
checkAiStatus();
