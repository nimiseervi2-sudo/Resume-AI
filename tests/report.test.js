// Tests the downloadable report. Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const { buildReport, reportFileName } = require("../js/report.js");

const report = {
  result: {
    atsScore: 64,
    summary: "Your resume covers the basics.",
    matchedSkills: ["JavaScript", "CSS"],
    missingSkills: ["React"],
    strengths: ["Relevant experience"],
    weaknesses: [],
    suggestions: ["Add measurable results"],
    recommendedKeywords: ["REST API"],
  },
  verdict: "Moderate match",
  source: "AI analysis by test-model.",
  notice: "",
  jobTitle: "Frontend Developer",
  fileName: "resume.pdf",
  date: new Date(2026, 0, 5, 23, 30),
};

test("includes every part of the analysis", () => {
  const text = buildReport(report);
  for (const part of [
    "Date: 2026-01-05", "Resume file: resume.pdf", "Job title: Frontend Developer",
    "Method: AI analysis by test-model.", "Estimated ATS score: 64 / 100 (Moderate match)",
    "Your resume covers the basics.", "Matching skills\n---------------\n- JavaScript\n- CSS",
    "- React", "- Relevant experience", "Weaknesses\n----------\n- None", "- Add measurable results",
    "- REST API", "does not come from any real applicant tracking system",
  ]) {
    assert.ok(text.includes(part), part);
  }
});

test("leaves out empty details", () => {
  const text = buildReport({ ...report, jobTitle: "", fileName: "" });
  assert.ok(!text.includes("Job title:"));
  assert.ok(!text.includes("Resume file:"));
  assert.ok(!text.includes("Note:"));
  assert.ok(!text.includes("Matching keywords"));
  assert.ok(!text.includes("undefined"));
});

test("includes keyword lists and the fallback note from basic analysis", () => {
  const text = buildReport({
    ...report,
    notice: "AI analysis was not available.",
    result: { ...report.result, matchedKeywords: ["dashboard"], missingKeywords: [] },
  });
  assert.ok(text.includes("Note: AI analysis was not available."));
  assert.ok(text.includes("- dashboard"));
  assert.ok(text.includes("Missing keywords\n----------------\n- None"));
});

test("names the file after the date", () => {
  assert.strictEqual(reportFileName(report.date), "resumeai-report-2026-01-05.txt");
});
