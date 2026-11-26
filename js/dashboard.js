// Shows analysis results on the dashboard.

const resultsSection = document.getElementById("results");

// A word and a color for each score range, highest first
const SCORE_LEVELS = [
  { from: 75, label: "Strong match", style: "level-high" },
  { from: 50, label: "Moderate match", style: "level-medium" },
  { from: 0, label: "Low match", style: "level-low" },
];

// Fills a list with items, or shows a short note when there are none
function fillList(id, items, emptyText) {
  const list = document.getElementById(id);
  const entries = items.length ? items : [emptyText];

  list.replaceChildren(...entries.map((text) => {
    const item = document.createElement("li");
    item.textContent = text; // textContent never runs HTML
    if (!items.length) item.className = "empty";
    return item;
  }));

  document.getElementById(`${id}-count`).textContent = items.length;
}

function showScore(score) {
  const level = SCORE_LEVELS.find((entry) => score >= entry.from);

  document.getElementById("result-score").textContent = score;
  document.getElementById("result-verdict").textContent = level.label;
  // The CSS uses --score to decide how much of the ring to fill
  document.getElementById("result-ring").style.setProperty("--score", score);
  resultsSection.querySelector(".overview").className = `card overview ${level.style}`;
}

// A bar showing how many of the listed skills the resume covers
function showCoverage(matched, missing) {
  const total = matched + missing;
  document.getElementById("result-coverage").hidden = total === 0;
  if (total === 0) return;

  const bar = document.getElementById("result-coverage-bar");
  bar.max = total;
  bar.value = matched;
  document.getElementById("result-coverage-text").textContent =
    `Skill coverage: ${matched} of ${total} listed skills found in your resume`;
}

// "source" is a sentence saying how the result was made.
// "notice" explains a fallback, and is empty otherwise.
function showResults(result, { source, notice = "", jobTitle = "" }) {
  document.getElementById("result-source").textContent = source;
  document.getElementById("result-notice").textContent = notice;
  document.getElementById("result-notice").hidden = !notice;
  document.getElementById("result-job").textContent = jobTitle ? ` for ${jobTitle}` : "";
  document.getElementById("result-summary").textContent = result.summary;

  showScore(result.atsScore);
  showCoverage(result.matchedSkills.length, result.missingSkills.length);

  // Only the basic analysis produces these two keyword lists
  for (const card of document.querySelectorAll(".keyword-card")) {
    card.hidden = !result.matchedKeywords;
  }

  fillList("result-matched-skills", result.matchedSkills, "None found");
  fillList("result-missing-skills", result.missingSkills, "None found");
  fillList("result-matched-keywords", result.matchedKeywords || [], "None found");
  fillList("result-missing-keywords", result.missingKeywords || [], "None found");
  fillList("result-strengths", result.strengths, "No clear strengths found");
  fillList("result-weaknesses", result.weaknesses, "No weaknesses found");
  fillList("result-suggestions", result.suggestions, "No suggestions");
  fillList("result-recommended", result.recommendedKeywords, "No extra keywords to suggest");

  resultsSection.hidden = false;
  resultsSection.scrollIntoView();
  document.getElementById("results-title").focus({ preventScroll: true });
}

function hideResults() {
  resultsSection.hidden = true;
}
