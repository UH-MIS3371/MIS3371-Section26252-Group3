# Backend Test Results

Run the tests from the `backend` folder with `node returnRules.test.js`.
All tests use today's date = 2026-10-18.

## Business Rules and Validation Tested

1. **BR-1:** Return must be within 30 days of the purchase date.
2. **BR-2:** Final-sale and clearance items (flagged SKUs) cannot be returned.
3. **BR-3:** Quantity to return must be at least 1 and no more than the original quantity.
4. **BR-4:** Defective items over $200 must be approved by a supervisor (exactly $200 does not).
5. **Input validation:** required fields, real calendar date, date not in the future, whole-number quantities, non-negative item value, allowed reason / resolution / return method, replacement SKU required for replacements, request body must be a JSON object.

## Test Cases

| # | Type | Input (summary) | Expected | Actual | Pass/Fail |
|---|------|-----------------|----------|--------|-----------|
| 1 | Valid | 10 days old, return 1 of 2, "No Longer Needed", $50 | Approved, no supervisor | Approved, no supervisor | PASS |
| 2 | Valid | 17 days old, return 1 of 1, "Defective", $250 | Approved, supervisor needed | Approved, supervisor needed | PASS |
| 3 | Valid | Replacement with replacement SKU | Approved, no supervisor | Approved, no supervisor | PASS |
| 4 | Invalid (BR-1) | 45 days old | Rejected: outside 30-day window | Rejected: outside 30-day window | PASS |
| 5 | Invalid (BR-2) | SKU `FS-1001` (final-sale) | Rejected: final-sale | Rejected: final-sale | PASS |
| 6 | Invalid (BR-2) | SKU `clr-2002` (clearance, lowercase) | Rejected: clearance | Rejected: clearance | PASS |
| 7 | Invalid (BR-3) | Return 3 of 2 | Rejected: exceeds original quantity | Rejected: exceeds original quantity | PASS |
| 8 | Invalid input | Purchase date after today | Rejected: cannot be in the future | Rejected: cannot be in the future | PASS |
| 9 | Invalid input | Purchase date `2026-02-31` | Rejected: must be a valid date | Rejected: must be a valid date | PASS |
| 10 | Invalid input | Quantity to return = 0 | Rejected: whole number of at least 1 | Rejected: whole number of at least 1 | PASS |
| 11 | Invalid input | Replacement, blank replacement SKU | Rejected: Replacement SKU required | Rejected: Replacement SKU required | PASS |
| 12 | Invalid input | Item value -5 | Rejected: item value | Rejected: item value | PASS |
| 13 | Invalid input | Unknown reason code | Rejected: reason must be one of | Rejected: reason must be one of | PASS |
| 14 | Invalid input | Blank Customer ID | Rejected: Customer ID required | Rejected: Customer ID required | PASS |
| 15 | Invalid input | Request body `null` | Rejected: must be a JSON object | Rejected: must be a JSON object | PASS |
| 16 | Boundary | Exactly 30 days old | Approved | Approved | PASS |
| 17 | Boundary | 31 days old | Rejected: outside 30-day window | Rejected: outside 30-day window | PASS |
| 18 | Boundary | Defective, exactly $200 | Approved, no supervisor | Approved, no supervisor | PASS |
| 19 | Boundary | Defective, $200.01 | Approved, supervisor needed | Approved, supervisor needed | PASS |
| 20 | Boundary | Return 2 of 2 (quantity = original) | Approved | Approved | PASS |

20 of 20 tests passed. Run `node returnRules.test.js` from the `backend` folder to reproduce.

## Lambda adapter test events

`index.js` can be tested in the Lambda console with the events in this folder:

| File | Expected |
|---|---|
| `test-event-accepted.json` | 200, approved |
| `test-event-rejected.json` | 400, outside 30-day window |
| `test-event-final-sale.json` | 400, final-sale item |
| `test-event-invalid-input.json` | 400, quantity must be a whole number of at least 1 |

The event dates are fixed, so the accepted event stops passing once its purchase date is more than 30 days old (around 2026-11-20). Change `purchaseDate` inside `body` to re-test.

## Notes

- Test 16/17 confirm the 30-day boundary is inclusive (day 30 approves, day 31 rejects).
- Test 18/19 confirm the $200 boundary is exclusive (only strictly over $200 needs supervisor approval).
- BR-2 uses a small list of flagged SKUs in `returnRules.js` (`FS-1001`, `FS-1002`, `CLR-2001`, `CLR-2002`) as a stand-in for a product catalog.
