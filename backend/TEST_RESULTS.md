# Week 8 - Backend Test Results

Run the tests from the `backend` folder with `node returnRules.test.js`.
All tests use today's date = 2026-10-18.

## Business Rules Tested

1. Return must be within 30 days of the purchase date.
2. Quantity to return must be at least 1 and no more than the original quantity.
3. Defective items over $200 must be approved by a supervisor (exactly $200 does not).

## Test Cases

| # | Type | Input (summary) | Expected | Actual | Pass/Fail |
|---|------|-----------------|----------|--------|-----------|
| 1 | Valid | 10 days old, return 1 of 2, "No Longer Needed", $50 | Approved, no supervisor | Approved, no supervisor | PASS |
| 2 | Valid | 17 days old, return 1 of 1, "Defective", $250 | Approved, supervisor needed | Approved, supervisor needed | PASS |
| 3 | Invalid | 45 days old, return 1 of 1, "Wrong Item", $40 | Rejected (outside 30 days) | Rejected (outside 30 days) | PASS |
| 4 | Invalid | 8 days old, return 3 of 2, "Other", $60 | Rejected (quantity too high) | Rejected (quantity too high) | PASS |
| 5 | Boundary | exactly 30 days old, return 1 of 1, $75 | Approved, no supervisor | Approved, no supervisor | PASS |
| 6 | Boundary | 3 days old, return 1 of 1, "Defective", exactly $200 | Approved, no supervisor | Approved, no supervisor | PASS |

6 of 6 tests passed. Run with `node returnRules.test.js` from the `backend` folder to reproduce.

## Notes

- All three rules (30-day window, quantity vs. original purchased, defective-over-$200 supervisor routing) are implemented in `returnRules.js`.
- Test 5 confirms the 30-day boundary is inclusive (exactly 30 days still approves).
- Test 6 confirms the $200 boundary is exclusive (exactly $200 does not require supervisor approval — only strictly over $200 does).
