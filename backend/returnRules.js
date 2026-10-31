// Backend business rules + input validation for the Product Return Request transaction
// Field names match the ids/names in transaction-form.html.
//
// Order of checks in processReturnRequest:
//   1. Input validation (required fields, types, valid date, allowed values)
//   2. BR-1 30-day return window
//   3. BR-2 final-sale / clearance items are not returnable
//   4. BR-3 quantity cannot exceed the original quantity purchased
//   5. BR-4 defective items over $200 need supervisor approval

// Business rule limits
var RETURN_WINDOW_DAYS = 30;
var SUPERVISOR_APPROVAL_LIMIT = 200;

// Allowed dropdown values (must match transaction-form.html)
var REASON_CODES = ["Defective", "Wrong Item", "No Longer Needed", "Other"];
var RESOLUTIONS = ["Refund", "Replacement"];
var RETURN_METHODS = ["Mail", "In-Store Drop-off"];

// BR-2: SKUs flagged as final-sale or clearance (stand-in for a product catalog lookup).
var NON_RETURNABLE_SKUS = {
  "FS-1001": "final-sale",
  "FS-1002": "final-sale",
  "CLR-2001": "clearance",
  "CLR-2002": "clearance"
};

// Dates are strings like "2026-10-18"
function daysSincePurchase(purchaseDate, today) {
  var start = new Date(purchaseDate);
  var end = new Date(today);
  var millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / millisecondsPerDay);
}

// True only for real calendar dates written as YYYY-MM-DD (rejects "abc" and "2026-02-31").
function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  var parsed = new Date(value + "T00:00:00Z");
  return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isWholeNumberAtLeastOne(value) {
  return typeof value === "number" && isFinite(value) && Math.floor(value) === value && value >= 1;
}

// Input validation. Returns an error message string, or "" if the request is valid.
function validateReturnRequest(request, today) {
  if (request === null || typeof request !== "object" || Array.isArray(request)) {
    return "Request must be a JSON object.";
  }
  if (!isNonEmptyString(request.customerId)) {
    return "Customer ID is required.";
  }
  if (!isNonEmptyString(request.orderNumber)) {
    return "Order Number is required.";
  }
  if (!isNonEmptyString(request.sku)) {
    return "Product SKU is required.";
  }
  if (request.purchaseDate === undefined || request.purchaseDate === null || request.purchaseDate === "") {
    return "Purchase date is required.";
  }
  if (!isValidDateString(request.purchaseDate)) {
    return "Purchase date must be a valid date (YYYY-MM-DD).";
  }
  if (request.purchaseDate > today) {
    return "Purchase date cannot be in the future.";
  }
  if (!isWholeNumberAtLeastOne(request.originalQuantity)) {
    return "Original quantity must be a whole number of at least 1.";
  }
  if (!isWholeNumberAtLeastOne(request.quantity)) {
    return "Quantity to return must be a whole number of at least 1.";
  }
  if (typeof request.itemTotal !== "number" || !isFinite(request.itemTotal) || request.itemTotal < 0) {
    return "Item value must be a number of 0 or more.";
  }
  if (REASON_CODES.indexOf(request.reasonCode) === -1) {
    return "Reason for return must be one of: " + REASON_CODES.join(", ") + ".";
  }
  if (RESOLUTIONS.indexOf(request.preferredResolution) === -1) {
    return "Preferred resolution must be Refund or Replacement.";
  }
  if (RETURN_METHODS.indexOf(request.returnMethod) === -1) {
    return "Return method must be Mail or In-Store Drop-off.";
  }
  if (request.preferredResolution === "Replacement" && !isNonEmptyString(request.replacementSku)) {
    return "Replacement SKU is required when requesting a replacement.";
  }
  return "";
}

// BR-1: Return must be requested within 30 days of the purchase date.
// Returns true if the request is inside the window, false if not.
function isWithinReturnWindow(purchaseDate, today) {
  return daysSincePurchase(purchaseDate, today) <= RETURN_WINDOW_DAYS;
}

// BR-2: Final-sale and clearance items are not eligible for return.
// Returns "final-sale", "clearance", or "" if the SKU can be returned.
function getNonReturnableType(sku) {
  var key = String(sku).trim().toUpperCase();
  return NON_RETURNABLE_SKUS[key] || "";
}

// BR-3: Quantity to return must be at least 1 and cannot be
// more than the original quantity purchased.
// Returns true if the quantity is allowed, false if not.
function isQuantityValid(quantity, originalQuantity) {
  return quantity >= 1 && quantity <= originalQuantity;
}

// BR-4: Defective items worth more than $200 must be sent to a supervisor.
// Returns true if a supervisor must approve, false if not.
// Note: exactly $200 does NOT need approval (only over $200).
function needsSupervisorApproval(reasonCode, itemTotal) {
  return reasonCode === "Defective" && itemTotal > SUPERVISOR_APPROVAL_LIMIT;
}

function rejected(message) {
  return { approved: false, needsSupervisor: false, message: message };
}

// Main function: validates the input, applies the rules, and returns one result object.
// request = { customerId, orderNumber, sku, purchaseDate, originalQuantity, quantity,
//             itemTotal, reasonCode, preferredResolution, returnMethod, replacementSku }
// result  = { approved: true/false, needsSupervisor: true/false, message }
function processReturnRequest(request, today) {
  var validationError = validateReturnRequest(request, today);
  if (validationError) {
    return rejected(validationError);
  }

  if (!isWithinReturnWindow(request.purchaseDate, today)) {
    return rejected("Return request is outside the 30-day return window.");
  }

  var nonReturnableType = getNonReturnableType(request.sku);
  if (nonReturnableType) {
    return rejected("Item " + request.sku.trim().toUpperCase() + " is " + nonReturnableType +
      " and is not eligible for return.");
  }

  if (!isQuantityValid(request.quantity, request.originalQuantity)) {
    return rejected("Return quantity exceeds the original quantity purchased.");
  }

  var needsSupervisor = needsSupervisorApproval(request.reasonCode, request.itemTotal);

  return {
    approved: true,
    needsSupervisor: needsSupervisor,
    message: needsSupervisor
      ? "Approved, pending supervisor review (defective item over $200)."
      : "Approved."
  };
}

// Lets the test file use these functions
module.exports = {
  validateReturnRequest: validateReturnRequest,
  isWithinReturnWindow: isWithinReturnWindow,
  getNonReturnableType: getNonReturnableType,
  isQuantityValid: isQuantityValid,
  needsSupervisorApproval: needsSupervisorApproval,
  processReturnRequest: processReturnRequest
};
