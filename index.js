"use strict";

// Week 10: HTTP adapter for AWS Lambda + API Gateway (HTTP API, payload format 2.0).
// Translates the HTTP event into a call to the existing backend, then saves and looks
// up return records in DynamoDB (FR-4/FR-5). All business rules stay in
// backend/returnRules.js — this file only parses, persists, and responds.
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { processReturnRequest } = require("./backend/returnRules");

const TABLE_NAME = process.env.RETURNS_TABLE || "MIS3371-Returns";
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function reply(statusCode, result) {
  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result)
  };
}

// FR-4: every submission gets a unique return ID, in the format from the
// data dictionary's example (RTN-<year>-<5 digits>).
function generateReturnId() {
  const year = new Date().getUTCFullYear();
  const digits = String(Math.floor(Math.random() * 90000) + 10000);
  return "RTN-" + year + "-" + digits;
}

// Maps the backend's approve/reject result onto the documented state model
// (docs/03-system-design/state-model-v1.pptx): every submission that reaches
// the rules engine lands in Approved, Pending Supervisor Review, or Rejected.
function statusFor(result) {
  if (!result.approved) return "Rejected";
  if (result.needsSupervisor) return "Pending Supervisor Review";
  return "Approved";
}

async function handleSubmit(request, today) {
  const result = processReturnRequest(request, today);
  const returnId = generateReturnId();
  const now = new Date().toISOString();
  const safeRequest = request && typeof request === "object" ? request : {};

  const record = {
    returnId: returnId,
    status: statusFor(result),
    message: result.message,
    customerId: safeRequest.customerId,
    orderNumber: safeRequest.orderNumber,
    sku: safeRequest.sku,
    purchaseDate: safeRequest.purchaseDate,
    originalQuantity: safeRequest.originalQuantity,
    quantity: safeRequest.quantity,
    itemTotal: safeRequest.itemTotal,
    reasonCode: safeRequest.reasonCode,
    preferredResolution: safeRequest.preferredResolution,
    returnMethod: safeRequest.returnMethod,
    finalSale: safeRequest.finalSale,
    replacementSku: safeRequest.replacementSku,
    submittedAt: now,
    statusUpdatedAt: now
  };

  // DynamoDB rejects undefined attribute values, so drop any field that
  // wasn't present on the incoming request (e.g. a malformed submission).
  Object.keys(record).forEach(function (key) {
    if (record[key] === undefined) {
      delete record[key];
    }
  });

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));

  return reply(result.approved ? 200 : 400, {
    approved: result.approved,
    needsSupervisor: result.needsSupervisor,
    message: result.message,
    returnId: returnId
  });
}

async function handleLookup(returnId) {
  const data = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { returnId: returnId } }));
  if (!data.Item) {
    return reply(404, { found: false, message: "No return found for that confirmation number." });
  }
  return reply(200, Object.assign({ found: true }, data.Item));
}

exports.handler = async (event = {}) => {
  const method = event.requestContext?.http?.method || event.httpMethod;

  if (method === "GET") {
    const returnId = event.pathParameters && event.pathParameters.returnId;
    if (!returnId) {
      return reply(400, { found: false, message: "Confirmation number is required." });
    }
    return handleLookup(returnId);
  }

  if (method !== "POST") {
    return reply(405, { approved: false, message: "Use POST /api/returns or GET /api/returns/{returnId}." });
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

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
  return handleSubmit(request, today);
};
