// Turns an analysis result into a plain text report and downloads it.
// The report is made in the browser; nothing is sent anywhere.

// "Matching skills" followed by one "- item" line per entry
function reportList(title, items) {
  const lines = items.length ? items.map((item) => `- ${item}`) : ["- None"];
  return [title, "-".repeat(title.length), ...lines, ""];
}

// Today's date in the visitor's own time zone, as 2026-01-31
function formatDate(date) {
  const two = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

// "report" holds: result, verdict, source, notice, jobTitle, fileName and date
function buildReport({ result, verdict, source, notice, jobTitle, fileName, date }) {
  // Only the basic analysis has keyword lists
  const keywordLists = result.matchedKeywords
    ? [
      ...reportList("Matching keywords", result.matchedKeywords),
      ...reportList("Missing keywords", result.missingKeywords),
    ]
    : [];

  return [
    "ResumeAI Analysis Report",
    "========================",
    "",
    `Date: ${formatDate(date)}`,
    ...(fileName ? [`Resume file: ${fileName}`] : []),
    ...(jobTitle ? [`Job title: ${jobTitle}`] : []),
    `Method: ${source}`,
    ...(notice ? [`Note: ${notice}`] : []),
    "",
    `Estimated ATS score: ${result.atsScore} / 100 (${verdict})`,
    "",
    "Summary",
    "-------",
    result.summary,
    "",
    ...reportList("Matching skills", result.matchedSkills),
    ...reportList("Missing skills", result.missingSkills),
    ...keywordLists,
    ...reportList("Strengths", result.strengths),
    ...reportList("Weaknesses", result.weaknesses),
    ...reportList("Suggestions to improve", result.suggestions),
    ...reportList("Keywords to consider (only if they truthfully describe you)", result.recommendedKeywords),
    "This score is an estimate. It does not come from any real applicant tracking system.",
    "",
  ].join("\n");
}

function reportFileName(date) {
  return `resumeai-report-${formatDate(date)}.txt`;
}

// Saves text as a file on the visitor's computer
function downloadTextFile(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser time to start the download before freeing the memory
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Lets the tests load this file with Node.js; browsers skip this
if (typeof module !== "undefined") {
  module.exports = { buildReport, reportFileName };
}
