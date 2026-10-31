// Test file for the return request business rules and input validation.
// Run from the backend folder with:  node returnRules.test.js

var rules = require("./returnRules");

// "Today" is fixed so the tests give the same result every time
var TODAY = "2026-10-18";

// A request that passes every rule. Each test copies it and changes only the fields it is testing.
function makeRequest(changes) {
  var request = {
    customerId: "C-1001",
    orderNumber: "ORD-5001",
    sku: "SKU-1001",
    purchaseDate: "2026-10-08",   // 10 days before TODAY
    originalQuantity: 2,
    quantity: 1,
    itemTotal: 50,
    reasonCode: "No Longer Needed",
    preferredResolution: "Refund",
    returnMethod: "Mail",
    replacementSku: ""
  };
  for (var key in changes) {
    request[key] = changes[key];
  }
  return request;
}

// Each test has a name, a type, the input, and the expected result.
// expectedMessage is text the result message must contain.
var tests = [
  // ---- Valid ----
  {
    name: "Test 1 - Valid: return 10 days after purchase",
    type: "Valid",
    request: makeRequest({}),
    expectedApproved: true, expectedSupervisor: false, expectedMessage: "Approved."
  },
  {
    name: "Test 2 - Valid: defective item over $200 goes to supervisor",
    type: "Valid",
    request: makeRequest({ purchaseDate: "2026-10-01", originalQuantity: 1, reasonCode: "Defective", itemTotal: 250 }),
    expectedApproved: true, expectedSupervisor: true, expectedMessage: "pending supervisor review"
  },
  {
    name: "Test 3 - Valid: replacement requested with a replacement SKU",
    type: "Valid",
    request: makeRequest({ reasonCode: "Wrong Item", preferredResolution: "Replacement", replacementSku: "SKU-5500" }),
    expectedApproved: true, expectedSupervisor: false, expectedMessage: "Approved."
  },

  // ---- Invalid: business rules ----
  {
    name: "Test 4 - Invalid (BR-1): purchase was 45 days ago",
    type: "Invalid",
    request: makeRequest({ purchaseDate: "2026-09-03", originalQuantity: 1, reasonCode: "Wrong Item", itemTotal: 40 }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "outside the 30-day return window"
  },
  {
    name: "Test 5 - Invalid (BR-2): final-sale SKU",
    type: "Invalid",
    request: makeRequest({ sku: "FS-1001" }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "final-sale and is not eligible"
  },
  {
    name: "Test 6 - Invalid (BR-2): clearance SKU (lowercase input)",
    type: "Invalid",
    request: makeRequest({ sku: "clr-2002" }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "clearance and is not eligible"
  },
  {
    name: "Test 7 - Invalid (BR-3): returning more than was purchased",
    type: "Invalid",
    request: makeRequest({ purchaseDate: "2026-10-10", quantity: 3, reasonCode: "Other", itemTotal: 60 }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "exceeds the original quantity"
  },

  // ---- Invalid: input validation ----
  {
    name: "Test 8 - Invalid input: purchase date in the future",
    type: "Invalid",
    request: makeRequest({ purchaseDate: "2026-10-19" }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "cannot be in the future"
  },
  {
    name: "Test 9 - Invalid input: purchase date is not a real date",
    type: "Invalid",
    request: makeRequest({ purchaseDate: "2026-02-31" }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "must be a valid date"
  },
  {
    name: "Test 10 - Invalid input: quantity to return is 0",
    type: "Invalid",
    request: makeRequest({ quantity: 0 }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "Quantity to return must be a whole number"
  },
  {
    name: "Test 11 - Invalid input: replacement requested without a replacement SKU",
    type: "Invalid",
    request: makeRequest({ preferredResolution: "Replacement", replacementSku: "  " }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "Replacement SKU is required"
  },
  {
    name: "Test 12 - Invalid input: negative item value",
    type: "Invalid",
    request: makeRequest({ itemTotal: -5 }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "Item value must be a number"
  },
  {
    name: "Test 13 - Invalid input: unknown reason code",
    type: "Invalid",
    request: makeRequest({ reasonCode: "Changed my mind" }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "Reason for return must be one of"
  },
  {
    name: "Test 14 - Invalid input: missing Customer ID",
    type: "Invalid",
    request: makeRequest({ customerId: "" }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "Customer ID is required"
  },
  {
    name: "Test 15 - Invalid input: request body is not an object (null)",
    type: "Invalid",
    request: null,
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "must be a JSON object"
  },

  // ---- Boundary ----
  {
    name: "Test 16 - Boundary: exactly 30 days after purchase",
    type: "Boundary",
    request: makeRequest({ purchaseDate: "2026-09-18", originalQuantity: 1, itemTotal: 75 }),
    expectedApproved: true, expectedSupervisor: false, expectedMessage: "Approved."
  },
  {
    name: "Test 17 - Boundary: 31 days after purchase",
    type: "Boundary",
    request: makeRequest({ purchaseDate: "2026-09-17", originalQuantity: 1, itemTotal: 75 }),
    expectedApproved: false, expectedSupervisor: false, expectedMessage: "outside the 30-day return window"
  },
  {
    name: "Test 18 - Boundary: defective item at exactly $200",
    type: "Boundary",
    request: makeRequest({ purchaseDate: "2026-10-15", originalQuantity: 1, reasonCode: "Defective", itemTotal: 200 }),
    expectedApproved: true, expectedSupervisor: false, expectedMessage: "Approved."
  },
  {
    name: "Test 19 - Boundary: defective item at $200.01",
    type: "Boundary",
    request: makeRequest({ purchaseDate: "2026-10-15", originalQuantity: 1, reasonCode: "Defective", itemTotal: 200.01 }),
    expectedApproved: true, expectedSupervisor: true, expectedMessage: "pending supervisor review"
  },
  {
    name: "Test 20 - Boundary: quantity to return equals original quantity",
    type: "Boundary",
    request: makeRequest({ originalQuantity: 2, quantity: 2 }),
    expectedApproved: true, expectedSupervisor: false, expectedMessage: "Approved."
  }
];

// Run each test and print expected vs actual
var passed = 0;

for (var i = 0; i < tests.length; i++) {
  var t = tests[i];
  var result = rules.processReturnRequest(t.request, TODAY);

  var ok = (result.approved === t.expectedApproved &&
            result.needsSupervisor === t.expectedSupervisor &&
            result.message.indexOf(t.expectedMessage) !== -1);

  if (ok) {
    passed = passed + 1;
  }

  console.log(t.name + " [" + t.type + "]");
  console.log("  Expected: approved=" + t.expectedApproved +
              ", supervisor=" + t.expectedSupervisor +
              ", message contains \"" + t.expectedMessage + "\"");
  console.log("  Actual:   approved=" + result.approved +
              ", supervisor=" + result.needsSupervisor +
              " (" + result.message + ")");
  console.log("  Result:   " + (ok ? "PASS" : "FAIL"));
  console.log("");
}

console.log(passed + " of " + tests.length + " tests passed");

// Make "node returnRules.test.js" report failure to the shell/CI
if (passed !== tests.length) {
  process.exit(1);
}
