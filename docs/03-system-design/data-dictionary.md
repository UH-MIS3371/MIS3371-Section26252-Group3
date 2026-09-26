# Product Return Request — Mini Data Dictionary

*Week 3 Activity 2 — Data + Architecture Clinic*

This list satisfies both the Activity 2 ask (8–12 essential fields, plus a transaction ID, status field, and at least two timestamps) and the Capstone Checkpoint's data dictionary requirement (approximately 10–20 meaningful fields).

| **Field** | **Meaning** | **Type** | **Req?** | **Source** | **Rule / Constraint** | **Example** | **Control Type** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| return_id | Unique identifier for the return request | String (UUID) | Yes | System-assigned | Generated on submission; immutable | RTN-2026-04821 | n/a (not on this form) |
| customer_id | Identifies the customer making the request | String | Yes | User-entered | Must match an existing customer account | CUST-10432 | text |
| order_number | Original purchase order reference | String | Yes | User-entered | Must match an existing order | ORD-88213 | text |
| sku | Product/SKU being returned | String | Yes | User-entered | Must exist on the referenced order | SKU-4471 | text |
| quantity | Quantity being returned | Integer | Yes | User-entered | ≤ originally purchased quantity (BR-3) | 1 | number |
| reason_code | Why the item is being returned | Enum | Yes | User-entered | One of: Defective, Wrong Item, No Longer Needed, Other | Defective | select |
| preferred_resolution | Customer's requested outcome | Enum | Yes | User-entered | Refund or Replacement | Refund | select |
| purchase_date | Date item was originally purchased/delivered | Date | Yes | User-entered | Used to calculate the 30-day window (BR-1) | 2026-08-25 | date |
| request_date | Date the return request was submitted | Date | Yes | System-assigned | Captured automatically at submission | 2026-09-20 | n/a (not on this form) |
| status | Current state of the request | Enum | Yes | System-assigned / Derived | One of the 5 workflow states; changes only through defined transitions | Pending Supervisor Review | n/a (not on this form) |
| item_value | Dollar value of the returned item | Decimal | Yes | Derived | Pulled from order line item; drives BR-4 routing | 249.99 | n/a (not on this form) |
| requires_supervisor_review | Whether the request needs supervisor approval | Boolean | Yes | Derived/Calculated | True when reason=Defective AND item_value > $200 | true | n/a (not on this form) |
| supervisor_decision | Supervisor's approve/reject decision | Enum | No | User-entered (Supervisor) | Only populated when requires_supervisor_review = true | Approved | n/a (not on this form) |
| submitted_at | Timestamp the request was created | Datetime | Yes | System-assigned | Immutable; set once | 2026-09-20T14:03:11Z | n/a (not on this form) |
| status_updated_at | Timestamp of the most recent status change | Datetime | Yes | System-assigned | Updated on every transition, feeds audit trail (NFR-3) | 2026-09-20T15:47:02Z | n/a (not on this form) |
| return_method | How the item will be sent back | Enum | Yes | User-entered | One of: Mail, In-Store Drop-off | Mail | select |
| rejection_reason | Supervisor's stated reason for rejecting the request | String | No | User-entered (Supervisor) | Required when supervisor_decision = Rejected | Item outside 30-day window | n/a (not on this form) |
| refund_amount | Dollar amount actually refunded | Decimal | No | Derived | Populated only when preferred_resolution = Refund and status reaches Completed; defaults to item_value unless a restocking fee applies | 249.99 | n/a (not on this form) |
| replacement_sku | SKU shipped out for a replacement | String | No | User-entered | Required when preferred_resolution = Replacement; must be the same SKU unless a substitution is approved | SKU-4471 | text |
| resolved_at | Timestamp the refund/replacement was actually issued | Datetime | No | System-assigned | Set once, when status transitions to Completed; used to measure resolution SLA | 2026-09-22T09:15:40Z | n/a (not on this form) |