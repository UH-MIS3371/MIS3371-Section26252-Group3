"use strict";

// Week 10: HTTP adapter for AWS Lambda + API Gateway (HTTP API, payload format 2.0).
// Translates the HTTP event into a call to the existing backend. All business
// rules stay in backend/returnRules.js — this file only parses and responds.
const { processReturnRequest } = require("./backend/returnRules");

function reply(statusCode, result) {
  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result)
  };
}

exports.handler = async (event = {}) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method !== "POST") {
    return reply(405, { approved: false, message: "Use POST /api/returns." });
  }

  let request;
  try {
    if (typeof event.body !== "string" || !event.body.trim()) {
      return reply(400, { approved: false, message: "A JSON request body is required." });
    }
    request = JSON.parse(event.body);
  } catch (err) {
    return reply(400, { approved: false, message: "Request body must be valid JSON." });
  }

  const today = new Date().toISOString().slice(0, 10);
  const result = processReturnRequest(request, today);

  return reply(result.approved ? 200 : 400, result);
};
