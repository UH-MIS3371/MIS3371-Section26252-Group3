// test file for the return request business rules.
// Run from the backend folder with:  node returnRules.test.js

var rules = require("./returnRules");

// "Today" is fixed so the tests give the same result every time
var TODAY = "2026-10-18";

// Each test has a name, a type, the input, and the expected result
var tests = [
  {
    name: "Test 1 - Valid: return 10 days after purchase",
    type: "Valid",
    request: {
      purchaseDate: "2026-10-08",
      quantity: 1,
      originalQuantity: 2,
      reasonCode: "No Longer Needed",
      itemTotal: 50
    },
    expectedApproved: true,
    expectedSupervisor: false
  },
  {
    name: "Test 2 - Valid: defective item over $200 goes to supervisor",
    type: "Valid",
    request: {
      purchaseDate: "2026-10-01",
      quantity: 1,
      originalQuantity: 1,
      reasonCode: "Defective",
      itemTotal: 250
    },
    expectedApproved: true,
    expectedSupervisor: true
  },
  {
    name: "Test 3 - Invalid: purchase was 45 days ago",
    type: "Invalid",
    request: {
      purchaseDate: "2026-09-03",
      quantity: 1,
      originalQuantity: 1,
      reasonCode: "Wrong Item",
      itemTotal: 40
    },
    expectedApproved: false,
    expectedSupervisor: false
  },
  {
    name: "Test 4 - Invalid: returning more than was purchased",
    type: "Invalid",
    request: {
      purchaseDate: "2026-10-10",
      quantity: 3,
      originalQuantity: 2,
      reasonCode: "Other",
      itemTotal: 60
    },
    expectedApproved: false,
    expectedSupervisor: false
  },
  {
    name: "Test 5 - Boundary: exactly 30 days after purchase",
    type: "Boundary",
    request: {
      purchaseDate: "2026-09-18",
      quantity: 1,
      originalQuantity: 1,
      reasonCode: "No Longer Needed",
      itemTotal: 75
    },
    expectedApproved: true,
    expectedSupervisor: false
  },
  {
    name: "Test 6 - Boundary: defective item at exactly $200",
    type: "Boundary",
    request: {
      purchaseDate: "2026-10-15",
      quantity: 1,
      originalQuantity: 1,
      reasonCode: "Defective",
      itemTotal: 200
    },
    expectedApproved: true,
    expectedSupervisor: false
  }
];

// Run each test and print expected vs actual
var passed = 0;

for (var i = 0; i < tests.length; i++) {
  var t = tests[i];
  var result = rules.processReturnRequest(t.request, TODAY);

  var ok = (result.approved === t.expectedApproved &&
            result.needsSupervisor === t.expectedSupervisor);

  if (ok) {
    passed = passed + 1;
  }

  console.log(t.name + " [" + t.type + "]");
  console.log("  Expected: approved=" + t.expectedApproved +
              ", supervisor=" + t.expectedSupervisor);
  console.log("  Actual:   approved=" + result.approved +
              ", supervisor=" + result.needsSupervisor +
              " (" + result.message + ")");
  console.log("  Result:   " + (ok ? "PASS" : "FAIL"));
  console.log("");
}

console.log(passed + " of " + tests.length + " tests passed");
