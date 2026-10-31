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

// BR-1: Return must be requested within 30 days of the purchase date.
// Returns true if the request is inside the window, false if not.
function isWithinReturnWindow(purchaseDate, today) {
  return daysSincePurchase(purchaseDate, today) <= RETURN_WINDOW_DAYS;
}

// BR-2: Items flagged as "final-sale" or "clearance" are not eligible for return.
// Returns true if the item can be returned, false if it's final-sale.
function isFinalSaleReturnable(finalSale) {
  return finalSale !== "Yes";
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

// Main function: puts the rules together and returns one result object.
// request = { purchaseDate, quantity, originalQuantity, reasonCode, itemTotal, finalSale }
// result  = { approved: true/false, needsSupervisor: true/false, message }
function processReturnRequest(request, today) {
  if (!isWithinReturnWindow(request.purchaseDate, today)) {
    return {
      approved: false,
      needsSupervisor: false,
      message: "Return request is outside the 30-day return window."
    };
  }

  if (!isFinalSaleReturnable(request.finalSale)) {
    return {
      approved: false,
      needsSupervisor: false,
      message: "Final-sale and clearance items are not eligible for return."
    };
  }

  if (!isQuantityValid(request.quantity, request.originalQuantity)) {
    return {
      approved: false,
      needsSupervisor: false,
      message: "Return quantity exceeds the original quantity purchased."
    };
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
  isWithinReturnWindow: isWithinReturnWindow,
  isFinalSaleReturnable: isFinalSaleReturnable,
  isQuantityValid: isQuantityValid,
  needsSupervisorApproval: needsSupervisorApproval,
  processReturnRequest: processReturnRequest
};
