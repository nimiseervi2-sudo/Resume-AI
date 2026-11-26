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

function showResults(result) {
  document.getElementById("result-score").textContent = result.atsScore;
  document.getElementById("result-score-bar").value = result.atsScore;
  document.getElementById("result-summary").textContent = result.summary;

  fillList("result-matched-skills", result.matchedSkills, "None found");
  fillList("result-missing-skills", result.missingSkills, "None found");
  fillList("result-matched-keywords", result.matchedKeywords, "None found");
  fillList("result-missing-keywords", result.missingKeywords, "None found");
  fillList("result-recommended", result.recommendedKeywords, "No extra keywords to suggest");
  fillList("result-strengths", result.strengths, "No clear strengths detected by these checks");
  fillList("result-weaknesses", result.weaknesses, "No weaknesses detected by these checks");
  fillList("result-suggestions", result.suggestions, "No suggestions from these checks");

  resultsSection.hidden = false;
  resultsSection.scrollIntoView();
  document.getElementById("results-title").focus({ preventScroll: true });
}

function hideResults() {
  resultsSection.hidden = true;
}
