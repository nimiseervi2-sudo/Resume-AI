// Tests the backend against a stand-in AI service, so no real AI is needed.
const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

// ===== Stand-in AI service =====
let reply; // what the stand-in will answer with
let lastCall; // what the backend sent to it

const fakeAi = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    lastCall = { url: req.url, headers: req.headers, body: JSON.parse(body) };
    if (reply.hang) return;
    res.writeHead(reply.status || 200, { "Content-Type": "application/json" });
    res.end(reply.raw ?? JSON.stringify({ choices: [{ message: { content: reply.content } }] }));
  });
});

const answer = {
  atsScore: 72,
  summary: "Your resume covers the basics.",
  matchedSkills: ["JavaScript", "Node.js"],
  missingSkills: ["React"],
  strengths: ["Relevant experience"],
  weaknesses: ["Few numbers"],
  suggestions: ["Add results"],
  recommendedKeywords: ["REST API"],
};

const request = {
  resumeText: "SECRET-RESUME-TEXT Developer skilled in JavaScript and NodeJS.",
  jobDescription: "We need a developer with JavaScript, Node.js and React experience for our product.",
  jobTitle: "Developer",
};

let server;
let base;
let address = 0;
const logged = [];

test.before(async () => {
  await new Promise((resolve) => fakeAi.listen(0, "127.0.0.1", resolve));
  Object.assign(process.env, {
    LLM_BASE_URL: `http://127.0.0.1:${fakeAi.address().port}/v1/`,
    LLM_MODEL: "test-model",
    LLM_API_KEY: "test-key-123",
    LLM_REASONING_EFFORT: "",
    LLM_TIMEOUT_MS: "500",
    TRUST_PROXY: "1",
  });
  console.error = (...parts) => logged.push(parts.join(" "));
  const app = require("../backend/server.js");
  await new Promise((resolve) => (server = app.listen(0, "127.0.0.1", resolve)));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  server.close();
  fakeAi.close();
  fakeAi.closeAllConnections();
});

// Each call pretends to come from a new visitor unless one is given
async function analyze(body = request, { visitor = `10.0.0.${++address}`, type = "application/json" } = {}) {
  const response = await fetch(`${base}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": type, "X-Forwarded-For": visitor },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}

test("returns the checked AI result", async () => {
  reply = { content: JSON.stringify(answer) };
  const { status, data } = await analyze();
  assert.strictEqual(status, 200);
  assert.deepStrictEqual(data, { ...answer, model: "test-model" });
});

test("sends the key, model and expected format to the AI service", () => {
  assert.strictEqual(lastCall.url, "/v1/chat/completions");
  assert.strictEqual(lastCall.headers.authorization, "Bearer test-key-123");
  assert.strictEqual(lastCall.body.model, "test-model");
  assert.strictEqual(lastCall.body.response_format.type, "json_schema");
  assert.ok(!("reasoning_effort" in lastCall.body));
  assert.deepStrictEqual(JSON.parse(lastCall.body.messages[1].content), request);
});

test("accepts JSON wrapped in a code block and rounds the score", async () => {
  reply = { content: "```json\n" + JSON.stringify({ ...answer, atsScore: 71.6 }) + "\n```" };
  const { data } = await analyze();
  assert.strictEqual(data.atsScore, 72);
});

test("removes skills the AI invented or wrongly reported missing", async () => {
  reply = { content: JSON.stringify({ ...answer, matchedSkills: ["JavaScript", "Python", "Java", "Node.js", ""], missingSkills: ["React", "JavaScript", "react"] }) };
  const { data } = await analyze();
  assert.deepStrictEqual(data.matchedSkills, ["JavaScript", "Node.js"]);
  assert.deepStrictEqual(data.missingSkills, ["react"]);
});

test("rejects answers in the wrong format", async () => {
  const bad = [
    "not json",
    "null",
    "",
    JSON.stringify({ ...answer, atsScore: 150 }),
    JSON.stringify({ ...answer, atsScore: "72" }),
    JSON.stringify({ ...answer, summary: " " }),
    JSON.stringify({ ...answer, strengths: "good" }),
    JSON.stringify({ ...answer, suggestions: [1, 2] }),
    JSON.stringify({ ...answer, weaknesses: undefined }),
  ];
  for (const content of bad) {
    reply = { content };
    const { status, data } = await analyze();
    assert.strictEqual(status, 502, content);
    assert.match(data.error, /wrong format/);
  }
});

test("explains AI service errors without leaking details", async () => {
  const cases = [[401, /API key/], [404, /not found/], [413, /too large/], [429, /limit/], [500, /returned an error/]];
  for (const [code, message] of cases) {
    reply = { status: code, raw: '{"error":"internal-detail test-key-123"}' };
    const { status, data } = await analyze();
    assert.strictEqual(status, 502);
    assert.match(data.error, message);
    assert.ok(!JSON.stringify(data).includes("internal-detail"));
  }
});

test("handles unreadable, slow and unreachable AI services", async () => {
  reply = { raw: "<html>oops</html>" };
  assert.match((await analyze()).data.error, /unreadable/);

  reply = { hang: true };
  assert.strictEqual((await analyze()).status, 504);

  const good = process.env.LLM_BASE_URL;
  process.env.LLM_BASE_URL = "http://127.0.0.1:1/v1";
  assert.match((await analyze()).data.error, /could not be reached/);
  process.env.LLM_BASE_URL = good;
});

test("rejects invalid requests", async () => {
  const invalid = [
    {},
    { ...request, resumeText: "" },
    { ...request, resumeText: 5 },
    { ...request, resumeText: "a".repeat(30001) },
    { ...request, jobDescription: "too short" },
    { ...request, jobDescription: "a".repeat(10001) },
    { ...request, jobTitle: "a".repeat(101) },
  ];
  for (const body of invalid) assert.strictEqual((await analyze(body)).status, 400);
  assert.strictEqual((await analyze("{broken")).status, 400);
  assert.strictEqual((await analyze(request, { type: "text/plain" })).status, 400);
  assert.strictEqual((await analyze({ ...request, resumeText: "a".repeat(300000) })).status, 413);
});

test("limits repeated requests from one visitor", async () => {
  reply = { content: JSON.stringify(answer) };
  for (let i = 0; i < 10; i++) assert.strictEqual((await analyze(request, { visitor: "10.9.9.9" })).status, 200);
  assert.strictEqual((await analyze(request, { visitor: "10.9.9.9" })).status, 429);
  assert.strictEqual((await analyze()).status, 200);
});

test("reports status without revealing the key", async () => {
  const data = await (await fetch(`${base}/api/status`)).json();
  assert.deepStrictEqual(data, { aiAvailable: true, model: "test-model", isLocal: true, service: "127.0.0.1" });
});

test("says AI is unavailable when not configured", async () => {
  const model = process.env.LLM_MODEL;
  process.env.LLM_MODEL = "";
  assert.deepStrictEqual(await (await fetch(`${base}/api/status`)).json(), { aiAvailable: false });
  assert.strictEqual((await analyze()).status, 503);
  process.env.LLM_MODEL = model;
});

test("serves the website but never private files", async () => {
  for (const path of ["/", "/css/style.css", "/js/app.js"]) {
    assert.strictEqual((await fetch(base + path)).status, 200, path);
  }
  const privatePaths = ["/.env", "/.env.example", "/package.json", "/backend/server.js", "/.git/config", "/js/..%2f.env", "/css/%2e%2e/.env", "/js/%2e%2e%2fbackend/server.js"];
  for (const path of privatePaths) {
    const response = await fetch(base + path);
    assert.ok([403, 404].includes(response.status), `${path} returned ${response.status}`);
  }
});

test("never logs resume text or keys", () => {
  const output = logged.join("\n");
  assert.ok(!output.includes("SECRET-RESUME-TEXT"));
  assert.ok(!output.includes("test-key-123"));
});
