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

// The chosen resume. Phase 3 will read the text from this file.
let selectedFile = null;

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

// Updates the upload box to match selectedFile
function showSelectedFile() {
  dropPrompt.hidden = selectedFile !== null;
  fileInfo.hidden = selectedFile === null;
  // With a file chosen, keyboard users go straight to Replace and Remove
  fileInput.tabIndex = selectedFile ? -1 : 0;

  if (selectedFile) {
    document.getElementById("file-name").textContent = selectedFile.name;
    document.getElementById("file-size").textContent = formatFileSize(selectedFile.size);
  }
}

function chooseFiles(files) {
  if (files.length === 0) return;

  formStatus.textContent = "";

  const problem = files.length > 1
    ? "Please add only one file."
    : getFileProblem(files[0]);

  if (problem) {
    // A rejected file does not replace a good one that is already chosen
    const kept = selectedFile ? ` Still using ${selectedFile.name}.` : "";
    showFileError(problem + kept);
    return;
  }

  selectedFile = files[0];
  showFileError("");
  showSelectedFile();
}

fileInput.addEventListener("change", () => {
  chooseFiles(fileInput.files);
  fileInput.value = ""; // so choosing the same file again still triggers "change"
});

document.getElementById("replace-file").addEventListener("click", () => {
  fileInput.click();
});

document.getElementById("remove-file").addEventListener("click", () => {
  selectedFile = null;
  formStatus.textContent = "";
  showFileError("");
  showSelectedFile();
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

  // Clear an error as soon as the text becomes valid
  if (descriptionError.textContent && !getDescriptionProblem(descriptionInput.value)) {
    showDescriptionError("");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault(); // stay on the page
  formStatus.textContent = "";

  const fileProblem = selectedFile ? "" : "Please add your resume.";
  const descriptionProblem = getDescriptionProblem(descriptionInput.value);

  showFileError(fileProblem);
  showDescriptionError(descriptionProblem);

  // Move to the first field that needs attention
  if (fileProblem) {
    fileInput.focus();
  } else if (descriptionProblem) {
    descriptionInput.focus();
  } else {
    formStatus.textContent =
      "Your details look good. Resume reading and analysis are not built yet, so there are no results to show.";
  }
});

// Some browsers restore typed text after a reload
updateCharacterCount();
