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
| 1 | Valid | 10 days old, return 1 of 2, "No Longer Needed", $50 | Approved, no supervisor | _fill in after running_ | |
| 2 | Valid | 17 days old, return 1 of 1, "Defective", $250 | Approved, supervisor needed | _fill in after running_ | |
| 3 | Invalid | 45 days old, return 1 of 1, "Wrong Item", $40 | Rejected (outside 30 days) | _fill in after running_ | |
| 4 | Invalid | 8 days old, return 3 of 2, "Other", $60 | Rejected (quantity too high) | _fill in after running_ | |
| 5 | Boundary | exactly 30 days old, return 1 of 1, $75 | Approved, no supervisor | _fill in after running_ | |
| 6 | Boundary | 3 days old, return 1 of 1, "Defective", exactly $200 | Approved, no supervisor | _fill in after running_ | |

## Notes

- `returnRules.js` currently has TODO placeholders, so the four tests that expect approval will FAIL until the rules are implemented. Tests 3 and 4 expect a rejection, so they pass by accident with the placeholder code - they only count once the real rules are written.
