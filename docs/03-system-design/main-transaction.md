# DOCUMENT 03: Main transaction

**Transaction Event:** Customer submits a product return request.
* **Trigger:** Customer needs to return a purchased item for a refund or replacement.
* **Inputs:** Customer ID, original order number, product/SKU, quantity, reason code, preferred resolution, purchase date, return method, replacement SKU (if applicable).
* **System Action:** Check required data, validate against the 30-day policy and final-sale exclusions; assign a return ID and initial status; route for approval if necessary.
* **Outcome:** Accept for standard processing, route to a supervisor for high-value review, or reject automatically with a reason.
