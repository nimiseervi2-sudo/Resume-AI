// Basic, rule-based resume analysis. No AI and no internet needed.
// Used through analyzeResume(resumeText, jobDescription, jobTitle).

// ===== Skills the analyzer knows about =====
// Each entry is [name shown to the user, other ways of writing it].
// Add a line here to teach the analyzer a new skill.
const TECHNICAL_SKILLS = [
  ["JavaScript", ["javascript", "ES6"]],
  ["TypeScript", ["typescript"]],
  ["HTML", ["html", "html5"]],
  ["CSS", ["css", "css3"]],
  ["Sass", ["sass", "scss"]],
  ["Tailwind CSS", ["tailwind", "tailwind css"]],
  ["Bootstrap", ["bootstrap"]],
  ["React", ["react.js", "reactjs", "react native"]],
  ["Angular", ["angular", "angularjs"]],
  ["Vue.js", ["vue", "vue.js", "vuejs"]],
  ["Next.js", ["next.js", "nextjs"]],
  ["Node.js", ["node.js", "nodejs", "node js"]],
  ["Express", ["express.js", "expressjs"]],
  ["Python", ["python"]],
  ["Django", ["django"]],
  ["Flask", ["flask"]],
  ["Java", ["java"]],
  ["Spring Boot", ["spring boot", "spring framework"]],
  ["C", ["c programming", "c language"]],
  ["C++", ["c++"]],
  ["C#", ["c#"]],
  [".NET", [".net", "asp.net", "dotnet"]],
  ["PHP", ["php"]],
  ["Ruby", ["ruby", "ruby on rails"]],
  ["Go", ["golang"]],
  ["Rust", []],
  ["Kotlin", ["kotlin"]],
  ["Swift", []],
  ["Flutter", ["flutter"]],
  ["Android", ["android"]],
  ["iOS", ["ios"]],
  ["R", ["r programming", "rstudio"]],
  ["SQL", ["sql", "mysql", "postgresql", "postgres", "sqlite", "sql server"]],
  ["MySQL", ["mysql"]],
  ["PostgreSQL", ["postgresql", "postgres"]],
  ["MongoDB", ["mongodb", "mongo db"]],
  ["Redis", ["redis"]],
  ["Firebase", ["firebase"]],
  ["REST API", ["restful", "rest api", "rest apis"]],
  ["GraphQL", ["graphql"]],
  ["Git", ["git"]],
  ["GitHub", ["github"]],
  ["Docker", ["docker"]],
  ["Kubernetes", ["kubernetes", "k8s"]],
  ["AWS", ["aws", "amazon web services"]],
  ["Azure", ["azure"]],
  ["Google Cloud", ["google cloud", "gcp"]],
  ["Linux", ["linux"]],
  ["CI/CD", ["ci/cd", "continuous integration"]],
  ["Testing", ["unit testing", "unit tests", "jest", "selenium", "test automation", "software testing"]],
  ["Responsive Design", ["responsive design", "responsive web design", "responsive websites", "responsive web pages", "responsive layouts"]],
  ["Machine Learning", ["machine learning"]],
  ["Deep Learning", ["deep learning"]],
  ["Data Analysis", ["data analysis", "data analytics"]],
  ["Pandas", ["pandas"]],
  ["NumPy", ["numpy"]],
  ["TensorFlow", ["tensorflow"]],
  ["PyTorch", ["pytorch"]],
  ["Power BI", ["power bi", "powerbi"]],
  ["Tableau", ["tableau"]],
  ["Figma", ["figma"]],
  ["UI/UX Design", ["ui/ux", "ux design", "ui design", "user experience"]],
  ["Photoshop", ["photoshop"]],
  ["Agile", ["agile", "scrum"]],
  ["Jira", ["jira"]],
  ["Excel", ["microsoft excel", "ms excel"]],
  ["SEO", ["seo", "search engine optimization"]],
  ["Digital Marketing", ["digital marketing"]],
  ["Content Writing", ["content writing", "copywriting"]],
  ["Accounting", ["accounting", "bookkeeping"]],
  ["Sales", ["sales"]],
  ["Customer Service", ["customer service", "customer support"]],
  ["Project Management", ["project management"]],
];

const SOFT_SKILLS = [
  ["Communication", ["communication", "communicating"]],
  ["Teamwork", ["teamwork", "team player", "collaboration", "collaborative", "collaborate", "collaborated"]],
  ["Leadership", ["leadership"]],
  ["Problem Solving", ["problem solving", "problem solver"]],
  ["Time Management", ["time management"]],
  ["Adaptability", ["adaptability", "adaptable"]],
  ["Critical Thinking", ["critical thinking", "analytical thinking", "analytical skills"]],
  ["Attention to Detail", ["attention to detail", "detail oriented"]],
  ["Creativity", ["creativity", "creative thinking"]],
];

// Some skill names are also everyday words ("react quickly", "the rest").
// These patterns only match with the right capital letters or surroundings.
const LIST_BEFORE = "(?<=[,/(|•:] ?)"; // follows a list separator
const LIST_AFTER = "(?= ?[,/)|•])"; // comes before a list separator
const inList = (word) => `${LIST_BEFORE}${word}(?![\\w+#&'-])|(?<![\\w+#&.-])${word}${LIST_AFTER}`;

// "react" or "node" in lowercase counts only when it follows a list separator
const lowercaseInList = (word) => new RegExp(`${LIST_BEFORE}${word}(?![\\w-])(?! (?:to|quickly|well)\\b)`, "i");

const SPECIAL_PATTERNS = {
  "React": [/(?<![\w-])React(?![\w-])(?! (?:to|quickly|well)\b)/, lowercaseInList("react")],
  "Node.js": lowercaseInList("node"),
  "Express": new RegExp(inList("Express")),
  "C": new RegExp(inList("C")),
  "R": new RegExp(inList("R")),
  "Go": new RegExp(inList("Go")),
  "Rust": /(?<![\w-])Rust(?![\w-])/,
  "Swift": /(?<![\w-])Swift(?:UI)?(?![\w-])/,
  "REST API": /(?<![\w-])REST(?![\w-])/,
  "Excel": /(?<![\w-])Excel(?![\w-])(?! (?:at|in)\b)/,
};

// Common words that say nothing about a particular job
const STOP_WORDS = new Set(`a about above after all also am an and any are as at be because been
before being below between both but by can could did do does doing done down during each etc few
for from further get had has have having he her here hers him his how i if in into is it its
itself just may me might more most must my no nor not now of off on once only or other our ours
out over own per same she should so some such than that the their theirs them then there these
they this those through to too under until up upon us very via was we well were what when where
which while who whom why will with within without would you your yours
ability able across apply applicant based benefits best bonus candidate candidates career company
day degree description develop developer developers developing development duties environment
equivalent excellent expected experience experienced familiar familiarity field good great help
hiring ideal include includes including job join knowledge least level like location looking
love make minimum month months need needed needs new nice offer opportunity organization part
people plus position preferred proficiency proficient provide qualification qualifications
related required requirement requirements responsibilities responsibility responsible role salary
seeking skill skills strong support team teams time title tools understanding use used using want
work working world write writing year years build building ensure create creating maintain manage
one two three four five full high key large small other others various multiple`.split(/\s+/));

const ACTION_VERBS = /\b(achieved|analyzed|automated|built|created|delivered|designed|developed|implemented|improved|increased|launched|led|managed|optimized|organized|reduced|resolved|trained)\b/gi;

// ===== Helpers =====

// Puts all text on one line so phrases split across lines still match
function toSingleLine(text) {
  return text.replace(/\s+/g, " ").trim();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Builds the patterns that find one skill
function patternsFor([name, aliases]) {
  const patterns = aliases.map((alias) => {
    // A space in an alias also matches a hyphen: "problem-solving"
    const body = alias.split(" ").map(escapeRegex).join("[ -]+");
    // The skill must not be part of a longer word ("Java" in "JavaScript")
    return new RegExp(`(?<![\\p{L}\\p{N}_])${body}(?![\\p{L}\\p{N}_+#])`, "iu");
  });
  // A special entry can be one pattern or a list of them
  if (SPECIAL_PATTERNS[name]) patterns.push(...[SPECIAL_PATTERNS[name]].flat());
  return patterns;
}

function containsSkill(text, skill) {
  return patternsFor(skill).some((pattern) => pattern.test(text));
}

// "databases" and "database" should count as the same word
function toSingular(word) {
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 3 && word.endsWith("s") && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

function toWords(text) {
  return (text.toLowerCase().match(/\p{L}[\p{L}\p{N}]*/gu) || []).map(toSingular);
}

// Finds repeated, meaningful words and two-word phrases in the job description
function extractKeywords(jobDescription, skills) {
  // Skills are reported separately, so take them out first
  let text = toSingleLine(jobDescription);
  for (const skill of skills) {
    for (const pattern of patternsFor(skill)) {
      text = text.replace(new RegExp(pattern.source, pattern.flags + "g"), " . ");
    }
  }

  const counts = new Map(); // keyword -> { count, label }
  const add = (key, label) => {
    const entry = counts.get(key) || { count: 0, label };
    entry.count++;
    counts.set(key, entry);
  };

  // Phrases never cross punctuation
  for (const part of text.split(/[.,;:!?()|•\/]+/)) {
    let previous = null;
    for (const raw of part.match(/\p{L}[\p{L}\p{N}]*/gu) || []) {
      const lower = raw.toLowerCase();
      const isUseful = lower.length > 2 && !STOP_WORDS.has(lower) && !STOP_WORDS.has(toSingular(lower));
      if (!isUseful) {
        previous = null;
        continue;
      }
      const word = toSingular(lower);
      add(word, lower);
      if (previous) add(`${previous.word} ${word}`, `${previous.lower} ${lower}`);
      previous = { word, lower };
    }
  }

  const repeated = [...counts]
    .filter(([, entry]) => entry.count >= 2)
    // Most frequent first; phrases before single words when equal
    .sort(([a, x], [b, y]) => y.count - x.count || b.split(" ").length - a.split(" ").length);

  const chosen = [];
  for (const [key, entry] of repeated) {
    const words = key.split(" ");
    // Skip anything that overlaps a keyword already chosen
    if (chosen.some((other) => other.key.split(" ").some((word) => words.includes(word)))) continue;
    chosen.push({ key, label: entry.label });
    if (chosen.length === 10) break;
  }
  return chosen;
}

// Looks for a heading such as "Experience" on its own short line
function hasSection(resumeText, headings) {
  const pattern = new RegExp(`^\\W*(?:[\\p{L}&]+ )?(?:${headings})\\b`, "iu");
  return resumeText.split("\n").some((line) => line.trim().length <= 40 && pattern.test(line.trim()));
}

// Lines that show a measurable result, such as "reduced costs by 20%"
function countMeasuredResults(resumeText) {
  const pattern = /\d ?(%|percent\b|x\b)|[$₹€£] ?\d|\b(increased|reduced|improved|saved|grew|cut|decreased|boosted|served|managed|led)\b[^\n]{0,60}?\b\d/i;
  return resumeText.split("\n").filter((line) => pattern.test(line)).length;
}

// "A", "A and B", "A, B and C"
function joinList(items) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const SHORT_NAMES = ["C", "R", "Go"];

// True if the text really mentions this skill, under any spelling we know.
// Used to check the skills reported by the AI.
function mentionsSkill(text, skillName) {
  const simplify = (value) => ` ${value.toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, " ").trim()} `;
  const name = skillName.replace(/\(.*?\)/g, "").trim(); // "JavaScript (ES6)"
  if (!simplify(name).trim()) return false;
  const wanted = name.toLowerCase();
  const known = [...TECHNICAL_SKILLS, ...SOFT_SKILLS].find(
    ([title, aliases]) => title.toLowerCase() === wanted || aliases.some((alias) => alias.toLowerCase() === wanted),
  );
  // "C", "R" and "Go" also appear in "C-level" or "R&D", so use the strict check only
  if (known && SHORT_NAMES.includes(known[0])) return containsSkill(toSingleLine(text), known);

  if (simplify(text).includes(simplify(name))) return true;
  if (known) return containsSkill(toSingleLine(text), known);

  // "HTML/CSS" is present only if every part is
  const parts = name.split(/\/|,| and | & /).filter((part) => part.trim());
  return parts.length > 1 && parts.every((part) => mentionsSkill(text, part));
}

// ===== Main function =====
// Returns the same fields the AI analysis will return, plus keyword lists.
// Throws an Error if the job description has nothing to compare.
function analyzeResume(resumeText, jobDescription, jobTitle = "") {
  const resume = toSingleLine(resumeText);
  const job = toSingleLine(`${jobTitle}. ${jobDescription}`);

  // 1. Skills the job asks for, split by whether the resume mentions them
  const allSkills = [...TECHNICAL_SKILLS, ...SOFT_SKILLS];
  const jobSkills = allSkills.filter((skill) => containsSkill(job, skill));
  const isSoft = (skill) => SOFT_SKILLS.includes(skill);

  const matched = jobSkills.filter((skill) => containsSkill(resume, skill));
  const missing = jobSkills.filter((skill) => !matched.includes(skill));
  const matchedSkills = matched.map(([name]) => name);
  const missingSkills = missing.map(([name]) => name);

  // 2. Other repeated words from the job description
  const keywords = extractKeywords(jobDescription, allSkills);
  const resumeWords = ` ${toWords(resume).join(" ")} `;
  const matchedKeywords = keywords.filter((k) => resumeWords.includes(` ${k.key} `)).map((k) => k.label);
  const missingKeywords = keywords.map((k) => k.label).filter((label) => !matchedKeywords.includes(label));

  const termCount = jobSkills.length + keywords.length;
  if (termCount === 0) {
    throw new Error("No skills or repeated keywords were found in this job description. Please paste the full description, including its requirements.");
  }

  // 3. Score: technical skills count fully, soft skills half.
  //    Skills make up 75% of the score and other keywords 25%.
  const weight = (skills) => skills.reduce((total, skill) => total + (isSoft(skill) ? 0.5 : 1), 0);
  const skillRatio = jobSkills.length ? weight(matched) / weight(jobSkills) : null;
  const keywordRatio = keywords.length ? matchedKeywords.length / keywords.length : null;

  let ratio;
  if (skillRatio === null) ratio = keywordRatio;
  else if (keywordRatio === null) ratio = skillRatio;
  else ratio = skillRatio * 0.75 + keywordRatio * 0.25;
  const atsScore = Math.round(ratio * 100);

  // 4. Feedback based on simple checks
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (jobSkills.length) {
    const found = `Mentions ${matched.length} of the ${jobSkills.length} skills found in the job description.`;
    if (skillRatio >= 0.6) strengths.push(found);
    else weaknesses.push(found.replace("Mentions", "Mentions only"));
  }
  if (missingSkills.length) {
    suggestions.push(`If you really have experience with ${joinList(missingSkills.slice(0, 5))}, show it in your skills, experience or projects. Do not add skills you do not have.`);
  }
  if (missingKeywords.length) {
    suggestions.push(`Where they honestly describe your work, use the job's own wording, such as "${missingKeywords.slice(0, 3).join('", "')}".`);
  }

  const title = jobTitle.trim();
  if (title) {
    if (resume.toLowerCase().includes(title.toLowerCase())) {
      strengths.push(`Includes the job title "${title}".`);
    } else {
      suggestions.push(`Consider a short summary that connects your background to the "${title}" role.`);
    }
  }

  const results = countMeasuredResults(resumeText);
  if (results >= 2) {
    strengths.push("Includes measurable results.");
  } else {
    weaknesses.push("Few measurable achievements were detected.");
    suggestions.push("Add numbers that show your impact, such as time saved, users served or percentage improvements. Use only real figures.");
  }

  const verbs = new Set((resume.match(ACTION_VERBS) || []).map((verb) => verb.toLowerCase()));
  if (verbs.size >= 3) {
    strengths.push("Uses clear action verbs to describe work.");
  } else {
    suggestions.push('Start bullet points with action verbs such as "built", "led" or "improved".');
  }

  const sections = [
    ["Experience or Projects", "experience|employment|work history|projects?|internships?"],
    ["Education", "education|academics?|qualifications"],
    ["Skills", "skills|competencies|technologies"],
  ];
  const absent = sections.filter(([, headings]) => !hasSection(resumeText, headings)).map(([name]) => name);
  if (absent.length === 0) {
    strengths.push("Has clear Experience or Projects, Education and Skills sections.");
  } else {
    weaknesses.push(`No clear heading was detected for: ${absent.join(", ")}.`);
    suggestions.push("Use simple section headings so both people and software can find your information.");
  }

  const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(resume);
  const hasPhone = (resume.match(/\+?\d[\d ()-]{7,}\d/g) || []).some((number) => number.replace(/\D/g, "").length >= 10);
  const noContact = [!hasEmail && "email address", !hasPhone && "phone number"].filter(Boolean);
  if (noContact.length) {
    weaknesses.push(`No ${noContact.join(" or ")} was detected.`);
    suggestions.push("Put your contact details in the main body of the resume, near the top.");
  } else {
    strengths.push("Includes an email address and phone number.");
  }

  const wordCount = toWords(resume).length;
  if (wordCount < 150) {
    weaknesses.push("The resume is very short.");
    suggestions.push("Add detail about your projects, responsibilities and results.");
  } else if (wordCount > 1000) {
    weaknesses.push("The resume is long.");
    suggestions.push("Shorten it to the information most relevant to this job, ideally one or two pages.");
  }

  // 5. Summary
  let summary = `Your resume mentions ${matchedSkills.length} of ${jobSkills.length} detected skills and ${matchedKeywords.length} of ${keywords.length} other repeated keywords from this job description.`;
  if (termCount < 5) {
    summary += " Only a few terms could be compared, so treat this score with extra caution.";
  }

  return {
    atsScore,
    summary,
    matchedSkills,
    missingSkills,
    strengths,
    weaknesses,
    suggestions,
    recommendedKeywords: [...missingSkills, ...missingKeywords].slice(0, 10),
    matchedKeywords,
    missingKeywords,
  };
}

// Lets the server and tests load this file with Node.js; browsers skip this
if (typeof module !== "undefined") {
  module.exports = { analyzeResume, mentionsSkill };
}
