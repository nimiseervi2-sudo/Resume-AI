// Web server: serves the website and the AI analysis API.
const path = require("path");
const express = require("express");

const ROOT = path.join(__dirname, "..");

// Read settings from .env if the file exists (hosting services set them directly)
try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const analyzeRouter = require("./routes/analyze");

const app = express();
app.disable("x-powered-by");
// Behind a hosting service's proxy, this gives the real visitor address
if (process.env.TRUST_PROXY) app.set("trust proxy", 1);

// Only these folders are public, so .env and the backend can never be downloaded
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.use("/css", express.static(path.join(ROOT, "css")));
app.use("/js", express.static(path.join(ROOT, "js")));

app.use("/api", express.json({ limit: "200kb" }), analyzeRouter);

// Errors such as invalid or oversized JSON. Request contents are never logged.
app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status >= 500) console.error("Server error:", error.name);
  const message = status === 413 ? "The request is too large." : status < 500 ? "The request could not be read." : "Something went wrong on the server.";
  res.status(status).json({ error: message });
});

// Start listening only when run directly (tests import the app instead)
if (require.main === module) {
  const port = process.env.PORT || 5500;
  // 127.0.0.1 means only this computer can connect. Hosting services need 0.0.0.0.
  const host = process.env.HOST || "127.0.0.1";
  app.listen(port, host, (error) => {
    if (error) {
      console.error(`Could not start the server: ${error.message}`);
      process.exit(1);
    }
    console.log(`ResumeAI is running at http://${host}:${port}`);
  });
}

module.exports = app;
