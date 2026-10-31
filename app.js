// BR-1: return must be within 30 days of purchase/delivery
const RETURN_WINDOW_DAYS = 30;

// Week 10: HTTP API created in API Gateway, routed to the MIS3371-ReturnRequest Lambda.
const API_URL = "https://iqpj8rd7ff.execute-api.us-east-1.amazonaws.com/api/returns";

function isReplacementSkuRequired(preferredResolution) {
  return preferredResolution === "Replacement";
}

function daysSincePurchase(purchaseDateValue) {
  const purchaseDate = new Date(purchaseDateValue + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0); // compare calendar days, not exact timestamps
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((today - purchaseDate) / msPerDay);
}

// BR-3: return quantity can't exceed what was originally purchased
function isQuantityValid(quantity, originalQuantity) {
  return quantity >= 1 && quantity <= originalQuantity;
}

const preferredResolutionSelect = document.getElementById("preferredResolution");
const replacementSkuInput = document.getElementById("replacementSku");
const replacementSkuMessage = document.getElementById("replacementSkuMessage");

const purchaseDateInput = document.getElementById("purchaseDate");
const purchaseDateMessage = document.getElementById("purchaseDateMessage");

const originalQuantityInput = document.getElementById("originalQuantity");
const quantityInput = document.getElementById("quantity");
const quantityMessage = document.getElementById("quantityMessage");

const itemTotalInput = document.getElementById("itemTotal");
const reasonCodeSelect = document.getElementById("reasonCode");

const customerIdInput = document.getElementById("customerId");
const orderNumberInput = document.getElementById("orderNumber");
const skuInput = document.getElementById("sku");
const returnMethodSelect = document.getElementById("returnMethod");

const form = document.querySelector("form");
const formMessage = document.getElementById("formMessage");
const resultIcon = document.getElementById("resultIcon");
const resultHeading = document.getElementById("resultHeading");
const resultDetail = document.getElementById("resultDetail");

const submitButton = document.getElementById("submitButton");
const submitButtonLabel = document.getElementById("submitButtonLabel");
const submitSpinner = document.getElementById("submitSpinner");

function setMessage(element, text, state) {
  element.textContent = text;
  element.classList.remove("field-message--ok", "field-message--blocked");
  if (state) {
    element.classList.add("field-message--" + state);
  }
}

// result-panel icons, one per outcome state (RETURN_WINDOW_DAYS etc. stay pure data above)
const RESULT_ICONS = {
  approved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>',
  supervisor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  rejected: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
  loading: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" stroke-opacity="0.3"/><path d="M21 12a9 9 0 0 0-9-9"/></svg>'
};

// Single entry point for the post-submit result panel. state is one of
// RESULT_ICONS' keys, or null to hide the panel entirely.
function setResultPanel(state, heading, detail) {
  if (!state) {
    formMessage.hidden = true;
    return;
  }
  formMessage.hidden = false;
  formMessage.className = "result-panel result-panel--" + state;
  resultIcon.innerHTML = RESULT_ICONS[state];
  resultHeading.textContent = heading;
  resultDetail.textContent = detail || "";
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButtonLabel.textContent = isSubmitting ? "Submitting…" : "Submit Return Request";
  submitSpinner.hidden = !isSubmitting;
}

// live feedback while the user edits the form (Week 6)
function updateReplacementSkuState() {
  const required = isReplacementSkuRequired(preferredResolutionSelect.value);
  replacementSkuInput.required = required;

  if (!required) {
    setMessage(replacementSkuMessage, "");
    replacementSkuInput.removeAttribute("aria-invalid");
    return;
  }

  if (replacementSkuInput.value.trim() === "") {
    setMessage(replacementSkuMessage, "Replacement SKU is required when requesting a replacement.", "blocked");
  } else {
    setMessage(replacementSkuMessage, "Replacement SKU provided.", "ok");
    replacementSkuInput.removeAttribute("aria-invalid");
  }
}

function updatePurchaseDateMessage() {
  const value = purchaseDateInput.value;

  if (!value) {
    setMessage(purchaseDateMessage, "");
    return;
  }

  const elapsed = daysSincePurchase(value);

  if (elapsed > RETURN_WINDOW_DAYS) {
    setMessage(
      purchaseDateMessage,
      "This item was delivered " + elapsed + " days ago, which is outside the 30-day return window (BR-1).",
      "blocked"
    );
  } else {
    const daysLeft = RETURN_WINDOW_DAYS - elapsed;
    setMessage(
      purchaseDateMessage,
      daysLeft + (daysLeft === 1 ? " day" : " days") + " left to return this item.",
      "ok"
    );
    purchaseDateInput.removeAttribute("aria-invalid");
  }
}

function updateQuantityMessage() {
  const quantityValue = quantityInput.value;
  const originalValue = originalQuantityInput.value;

  if (!quantityValue || !originalValue) {
    setMessage(quantityMessage, "");
    quantityInput.removeAttribute("aria-invalid");
    return;
  }

  const quantity = Number(quantityValue);
  const originalQuantity = Number(originalValue);

  if (isQuantityValid(quantity, originalQuantity)) {
    setMessage(quantityMessage, "Quantity is valid.", "ok");
    quantityInput.removeAttribute("aria-invalid");
  } else {
    setMessage(quantityMessage, "Quantity to return cannot exceed the original quantity purchased (BR-3).", "blocked");
  }
}

preferredResolutionSelect.addEventListener("change", updateReplacementSkuState);
replacementSkuInput.addEventListener("input", updateReplacementSkuState);
purchaseDateInput.addEventListener("input", updatePurchaseDateMessage);
originalQuantityInput.addEventListener("input", updateQuantityMessage);
quantityInput.addEventListener("input", updateQuantityMessage);

// Submit handler. The browser's built-in checks (required fields, min=1) still run first.
// All business rules and input validation are enforced by the Lambda backend, so every
// submission is sent to the API and the result panel shows the backend's response.
// The inline hints above (days left, quantity, replacement SKU) are live feedback only.
async function handleSubmit(event) {
  event.preventDefault();

  const quantity = Number(quantityInput.value);
  const originalQuantity = Number(originalQuantityInput.value);

  setSubmitting(true);
  setResultPanel("loading", "Submitting your request…", "");

  const requestBody = {
    customerId: customerIdInput.value.trim(),
    orderNumber: orderNumberInput.value.trim(),
    sku: skuInput.value.trim(),
    purchaseDate: purchaseDateInput.value,
    quantity: quantity,
    originalQuantity: originalQuantity,
    itemTotal: Number(itemTotalInput.value),
    reasonCode: reasonCodeSelect.value,
    preferredResolution: preferredResolutionSelect.value,
    returnMethod: returnMethodSelect.value,
    replacementSku: replacementSkuInput.value.trim()
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
    const result = await response.json();

    if (!result.approved) {
      setResultPanel("rejected", "Not approved", result.message);
    } else if (result.needsSupervisor) {
      setResultPanel("supervisor", "Approved — pending supervisor review", result.message);
    } else {
      setResultPanel("approved", "Approved", result.message);
    }
  } catch (error) {
    setResultPanel("rejected", "Couldn't reach the server", "Check your connection and try again.");
  } finally {
    setSubmitting(false);
  }
}

form.addEventListener("submit", handleSubmit);
