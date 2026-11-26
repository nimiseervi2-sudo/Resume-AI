// Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const { analyzeResume } = require("../js/analyzer.js");

const resume = `Asha Verma
asha@example.com | +91 98765 43210
Skills
JavaScript, HTML5, CSS3, Git, Node.js
Experience
Built a booking dashboard that reduced support calls by 30%.
Improved page load time by 60%.
Designed responsive layouts and created reusable components.
Education
B.Tech in Computer Science`;

const job = `We need a frontend developer with JavaScript, HTML, CSS, React and Git.
Strong communication is required. You will improve dashboards. Our dashboards serve schools.`;

// Which skills does the analyzer find in this text?
function skillsIn(text) {
  return analyzeResume("nothing relevant", text).missingSkills;
}

test("splits job skills into matched and missing", () => {
  const result = analyzeResume(resume, job);
  assert.deepStrictEqual(result.matchedSkills, ["JavaScript", "HTML", "CSS", "Git"]);
  assert.deepStrictEqual(result.missingSkills, ["React", "Communication"]);
});

test("calculates the weighted score", () => {
  // Skills: 4 of 5.5 weighted points. Keywords: "dashboard" is found (1 of 1).
  const result = analyzeResume(resume, job);
  assert.deepStrictEqual(result.matchedKeywords, ["dashboards"]);
  assert.strictEqual(result.atsScore, Math.round(((4 / 5.5) * 0.75 + 0.25) * 100));
});

test("scores a full match 100 and no match 0", () => {
  assert.strictEqual(analyzeResume("Python and Docker", "Python, Docker").atsScore, 100);
  assert.strictEqual(analyzeResume("Gardening and cooking", "Python, Docker").atsScore, 0);
});

test("returns every field in the expected format", () => {
  const result = analyzeResume(resume, job, "Frontend Developer");
  assert.ok(Number.isInteger(result.atsScore) && result.atsScore >= 0 && result.atsScore <= 100);
  assert.strictEqual(typeof result.summary, "string");
  for (const field of ["matchedSkills", "missingSkills", "strengths", "weaknesses", "suggestions", "recommendedKeywords", "matchedKeywords", "missingKeywords"]) {
    assert.ok(Array.isArray(result[field]), field);
    assert.ok(result[field].every((item) => typeof item === "string" && item), field);
  }
});

test("does not confuse similar names", () => {
  assert.deepStrictEqual(skillsIn("JavaScript"), ["JavaScript"]);
  assert.deepStrictEqual(skillsIn("Java"), ["Java"]);
  assert.deepStrictEqual(skillsIn("C++"), ["C++"]);
  assert.deepStrictEqual(skillsIn("C#"), ["C#"]);
  assert.deepStrictEqual(skillsIn("GitHub"), ["GitHub"]);
});

test("ignores everyday words that look like skills", () => {
  const text = "React quickly, excel at your tasks, express yourself, go further, rest well, be swift. R&D and C-level work.";
  assert.throws(() => analyzeResume("x", text), /No skills/);
});

test("finds ambiguous skills in lists", () => {
  const found = skillsIn("Skills: C, R, Go, Express, React, Excel, REST");
  for (const skill of ["C", "R", "Go", "Express", "React", "Excel", "REST API"]) {
    assert.ok(found.includes(skill), skill);
  }
});

test("accepts other spellings and line breaks", () => {
  const result = analyzeResume("nodejs, problem-solving, machine\nlearning, postgres", "Node.js, problem solving, machine learning, SQL");
  assert.deepStrictEqual(result.missingSkills, []);
});

test("never lists a missing skill as matched", () => {
  const result = analyzeResume(resume, job);
  assert.ok(!result.matchedSkills.some((skill) => result.missingSkills.includes(skill)));
});

test("works for jobs outside the skill list, using repeated keywords", () => {
  const nursing = "Nurse needed for patient care. Patient care includes medication rounds. Record medication safely.";
  const result = analyzeResume("Provided patient care in a busy ward.", nursing);
  assert.deepStrictEqual(result.matchedKeywords, ["patient care"]);
  assert.deepStrictEqual(result.missingKeywords, ["medication"]);
  assert.strictEqual(result.atsScore, 50);
  assert.match(result.summary, /extra caution/);
});

test("gives feedback based on what the resume contains", () => {
  const good = analyzeResume(resume, job);
  assert.ok(good.strengths.includes("Includes measurable results."));
  assert.ok(good.strengths.includes("Includes an email address and phone number."));
  assert.ok(good.strengths.some((text) => text.includes("sections")));

  const poor = analyzeResume("I like computers", job);
  assert.ok(poor.weaknesses.includes("Few measurable achievements were detected."));
  assert.ok(poor.weaknesses.includes("No email address or phone number was detected."));
  assert.ok(poor.suggestions.some((text) => text.includes("Do not add skills you do not have")));
});

test("rejects a job description with nothing to compare", () => {
  assert.throws(() => analyzeResume(resume, "Come and be with us because we are good to all of you."), /No skills/);
});
