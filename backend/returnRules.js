// Backend business rules for the Product Return Request transaction
// Field names match the ids/names in transaction-form.html.

// Business rule limits
var RETURN_WINDOW_DAYS = 30;
var SUPERVISOR_APPROVAL_LIMIT = 200;

// Dates are strings like "2026-10-18"
function daysSincePurchase(purchaseDate, today) {
  var start = new Date(purchaseDate);
  var end = new Date(today);
  var millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / millisecondsPerDay);
}

// Rule 1: Return must be requested within 30 days of the purchase date.
// Returns true if the request is inside the window, false if not.
function isWithinReturnWindow(purchaseDate, today) {
  // TODO: use daysSincePurchase() and RETURN_WINDOW_DAYS
  return false;
}

// Rule 2: Quantity to return must be at least 1 and cannot be
// more than the original quantity purchased.
// Returns true if the quantity is allowed, false if not.
function isQuantityValid(quantity, originalQuantity) {
  // TODO: check quantity >= 1 and quantity <= originalQuantity
  return false;
}

// Rule 3: Defective items worth more than $200 must be sent to a supervisor.
// Returns true if a supervisor must approve, false if not.
// Note: exactly $200 does NOT need approval (only over $200).
function needsSupervisorApproval(reasonCode, itemTotal) {
  // TODO: check reasonCode is "Defective" and itemTotal > SUPERVISOR_APPROVAL_LIMIT
  return false;
}

// Main function: puts the rules together and returns one result object.
// request = { purchaseDate, quantity, originalQuantity, reasonCode, itemTotal }
// result  = { approved: true/false, needsSupervisor: true/false, message }
function processReturnRequest(request, today) {
  // TODO: check Rule 1, then Rule 2, then Rule 3
  // - If Rule 1 or Rule 2 fails, approved is false and message says why
  // - If Rule 3 applies, approved is true and needsSupervisor is true
  return {
    approved: false,
    needsSupervisor: false,
    message: "Not implemented yet"
  };
}

// Lets the test file use these functions
module.exports = {
  isWithinReturnWindow: isWithinReturnWindow,
  isQuantityValid: isQuantityValid,
  needsSupervisorApproval: needsSupervisorApproval,
  processReturnRequest: processReturnRequest
};
