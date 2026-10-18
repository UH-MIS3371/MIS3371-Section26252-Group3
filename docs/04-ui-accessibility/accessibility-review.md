# DOCUMENT 09: UI & Accessibility Review

**Owner:** Kamaria Noble (UI / Accessibility Lead)
**Artifact reviewed:** `transaction-form.html` (Product Return Request form)
**Requirements covered:** NFR-1 (keyboard + accessible labels), NFR-2 (field-specific error messages), NFR-4 (laptop + mobile usability)

---

## 1. Purpose

This review checks the return-request form against our non-functional requirements before the form is wired to a backend. Catching accessibility gaps now (Design phase) is far cheaper than fixing them after the system is built and tested.

**Business value:** an accessible form reduces abandoned submissions and support calls — the exact problem our system exists to fix (customers calling or emailing about returns).

---

## 2. Findings

| # | Check | Requirement | Status | Notes |
|---|---|---|---|---|
| A1 | Every input has a visible `<label for>` matched to its `id` | NFR-1 | ✅ Pass | All 9 fields correctly paired |
| A2 | Related fields grouped with `<fieldset>` + `<legend>` | NFR-1 | ✅ Pass | "Return Request Details" |
| A3 | Page language declared (`lang="en"`) | NFR-1 | ✅ Pass | |
| A4 | Decorative graphics hidden from screen readers | NFR-1 | ✅ Pass | Header mountain SVGs use `aria-hidden="true"` |
| A5 | Dynamic messages announced to screen readers | NFR-2 | ✅ Pass | Message areas use `aria-live="polite"` |
| A6 | Error/help messages programmatically tied to their input | NFR-2 | ⚠️ Gap | `purchaseDateMessage` and `replacementSkuMessage` are not linked with `aria-describedby`, so a screen reader won't read them when the user tabs into the field |
| A7 | Users told which fields are required before they start | NFR-2 | ⚠️ Gap | No instruction text; required status is only enforced on submit |
| A8 | Conditional field clearly labeled as conditional | NFR-2 | ⚠️ Minor | Replacement SKU label could say "optional unless requesting a replacement" |
| A9 | Expected input format shown for ID fields | NFR-2 | ⚠️ Minor | Customer ID / Order Number / SKU give no example format (e.g., CUST-10432) |
| A10 | Logical tab order follows visual order | NFR-1 | ☐ To test | See Section 4 |
| A11 | Visible focus indicator on every control | NFR-1 | ☐ To test | CSS defines focus states — confirm visually |
| A12 | Layout usable at mobile width (~375px) | NFR-4 | ☐ To test | Check that `.field-row` stacks to one column |
| A13 | Focus outline visible when an error moves the cursor | NFR-2 | ⚠️ Gap | Found in Test 5: after clicking Submit with a mouse, the cursor returns to the date field but no outline appears. `styles.css` uses `:focus-visible`, which Chrome hides after mouse clicks, so mouse users get no cue where to look |

---

## 3. Recommended HTML Changes

1. **Link messages to inputs (A6)** — add `aria-describedby="purchaseDateMessage"` to the purchase date input and `aria-describedby="replacementSkuMessage"` to the replacement SKU input.
2. **Add a required-fields note (A7)** — directly under the `<legend>`:
   `<p class="form-note">All fields are required unless marked optional.</p>`
3. **Clarify the conditional label (A8)** — "Replacement SKU (optional unless requesting a replacement)".
4. **Add format hints (A9)** — short hint text under ID fields, linked with `aria-describedby`.
5. **Show an error outline (A13)** — give the field a visible error style (e.g., red border via `aria-invalid="true"`) when the submit check sends focus back to it, so mouse users can see where to fix.

---

## 4. Keyboard & Responsive Test Script

Open `transaction-form.html` in a browser and do **not** use the mouse.

| Step | Action | Expected Result | Actual Result |
|---|---|---|---|
| 1 | Press **Tab** from the top of the page | Focus lands on Customer ID with a visible outline | |
| 2 | Keep pressing **Tab** | Focus moves top-to-bottom, left-to-right, through all 9 fields then the Submit button | |
| 3 | On a dropdown, press **↓ / ↑** | Options change without a mouse | |
| 4 | Choose "Replacement," leave Replacement SKU blank, press **Enter** on Submit | Message names the Replacement SKU field and focus moves there | |
| 5 | Enter a purchase date 45 days ago, submit | Message explains the 30-day rule (BR-1) and focus moves to the date field | ✅ Live message under the date appeared immediately ("45 days ago… outside the 30-day return window (BR-1)"). ✅ Submit was blocked with a BR-1 message above the button. ⚠️ No visible outline on the date field after a mouse click on Submit (see A13) |
| 6 | Resize browser to phone width (or use DevTools device mode) | Fields stack in one column; no sideways scrolling | |

**Tester:** Kamaria Noble  **Date tested:** October 7, 2026  **Browser:** Google Chrome (macOS)
