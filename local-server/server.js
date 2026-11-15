"use strict";

// Milestone 3: local Express server connecting the existing frontend to the
// existing backend over HTTP/JSON. No AWS or database required for this
// milestone, so returns are kept in memory here instead of DynamoDB - same
// shape and behavior, just not persisted between restarts.
const express = require("express");
const path = require("path");
const { processReturnRequest } = require("../backend/returnRules");

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_ROOT = path.join(__dirname, "..");

app.use(express.json());
app.use(express.static(SITE_ROOT));

const returns = new Map();

function generateReturnId() {
  const year = new Date().getUTCFullYear();
  const digits = String(Math.floor(Math.random() * 90000) + 10000);
  return "RTN-" + year + "-" + digits;
}

function statusFor(result) {
  if (!result.approved) return "Rejected";
  if (result.needsSupervisor) return "Pending Supervisor Review";
  return "Approved";
}

app.get("/", (req, res) => {
  res.sendFile(path.join(SITE_ROOT, "transaction-form.html"));
});

app.post("/api/returns", (req, res) => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
  const result = processReturnRequest(req.body, today);
  const returnId = generateReturnId();
  const now = new Date().toISOString();
  const safeRequest = req.body && typeof req.body === "object" ? req.body : {};

  returns.set(returnId, Object.assign({}, safeRequest, {
    returnId: returnId,
    status: statusFor(result),
    message: result.message,
    submittedAt: now,
    statusUpdatedAt: now
  }));

  res.status(result.approved ? 200 : 400).json({
    approved: result.approved,
    needsSupervisor: result.needsSupervisor,
    message: result.message,
    returnId: returnId
  });
});

app.get("/api/returns/:returnId", (req, res) => {
  const record = returns.get(req.params.returnId);
  if (!record) {
    return res.status(404).json({ found: false, message: "No return found for that confirmation number." });
  }
  res.json(Object.assign({ found: true }, record));
});

app.listen(PORT, () => {
  console.log("Local server running at http://localhost:" + PORT);
});
