// Shows analysis results on the page.

const resultsSection = document.getElementById("results");

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
}

// "source" is a sentence saying how the result was made.
// "notice" explains a fallback, and is empty otherwise.
function showResults(result, source, notice = "") {
  document.getElementById("result-source").textContent = source;
  document.getElementById("result-notice").textContent = notice;
  document.getElementById("result-notice").hidden = !notice;

  // Only the basic analysis produces these two keyword lists
  for (const card of document.querySelectorAll(".keyword-card")) {
    card.hidden = !result.matchedKeywords;
  }

  document.getElementById("result-score").textContent = result.atsScore;
  document.getElementById("result-score-bar").value = result.atsScore;
  document.getElementById("result-summary").textContent = result.summary;

  fillList("result-matched-skills", result.matchedSkills, "None found");
  fillList("result-missing-skills", result.missingSkills, "None found");
  fillList("result-matched-keywords", result.matchedKeywords || [], "None found");
  fillList("result-missing-keywords", result.missingKeywords || [], "None found");
  fillList("result-recommended", result.recommendedKeywords, "No extra keywords to suggest");
  fillList("result-strengths", result.strengths, "No clear strengths found");
  fillList("result-weaknesses", result.weaknesses, "No weaknesses found");
  fillList("result-suggestions", result.suggestions, "No suggestions");

  resultsSection.hidden = false;
  resultsSection.scrollIntoView();
  document.getElementById("results-title").focus({ preventScroll: true });
}

function hideResults() {
  resultsSection.hidden = true;
}
