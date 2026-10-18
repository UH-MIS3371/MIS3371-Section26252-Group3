// BR-1: return must be within 30 days of purchase/delivery
const RETURN_WINDOW_DAYS = 30;

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

function isWithinReturnWindow(purchaseDateValue) {
  if (!purchaseDateValue) return true; // nothing entered yet, don't block on an empty field
  return daysSincePurchase(purchaseDateValue) <= RETURN_WINDOW_DAYS;
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

const form = document.querySelector("form");
const formMessage = document.getElementById("formMessage");

function setMessage(element, text, state) {
  element.textContent = text;
  element.classList.remove("field-message--ok", "field-message--blocked");
  if (state) {
    element.classList.add("field-message--" + state);
  }
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

// submit-time gate (Week 7): re-check both rules before letting the browser path continue
function handleSubmit(event) {
  event.preventDefault();

  if (isReplacementSkuRequired(preferredResolutionSelect.value) && replacementSkuInput.value.trim() === "") {
    setMessage(formMessage, "Enter a Replacement SKU before submitting, or change your Preferred Resolution.", "blocked");
    // Give invalid fields a visible error outline that doesn't depend on
    // :focus-visible's mouse-vs-keyboard heuristic (A13, accessibility review).
    replacementSkuInput.setAttribute("aria-invalid", "true");
    replacementSkuInput.focus();
    return;
  }

  if (!isWithinReturnWindow(purchaseDateInput.value)) {
    setMessage(formMessage, "This return is outside the 30-day window and cannot be submitted (BR-1).", "blocked");
    purchaseDateInput.setAttribute("aria-invalid", "true");
    purchaseDateInput.focus();
    return;
  }

  const quantity = Number(quantityInput.value);
  const originalQuantity = Number(originalQuantityInput.value);

  if (!isQuantityValid(quantity, originalQuantity)) {
    setMessage(formMessage, "Quantity to return cannot exceed the original quantity purchased (BR-3).", "blocked");
    quantityInput.setAttribute("aria-invalid", "true");
    quantityInput.focus();
    return;
  }

  setMessage(formMessage, "Client-side checks passed.", "ok");
}

form.addEventListener("submit", handleSubmit);
