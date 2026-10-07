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

const preferredResolutionSelect = document.getElementById("preferredResolution");
const replacementSkuInput = document.getElementById("replacementSku");
const replacementSkuMessage = document.getElementById("replacementSkuMessage");

const purchaseDateInput = document.getElementById("purchaseDate");
const purchaseDateMessage = document.getElementById("purchaseDateMessage");

const quantityInput = document.getElementById("quantity");

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
    return;
  }

  if (replacementSkuInput.value.trim() === "") {
    setMessage(replacementSkuMessage, "Replacement SKU is required when requesting a replacement.", "blocked");
  } else {
    setMessage(replacementSkuMessage, "Replacement SKU provided.", "ok");
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
  }
}

preferredResolutionSelect.addEventListener("change", updateReplacementSkuState);
replacementSkuInput.addEventListener("input", updateReplacementSkuState);
purchaseDateInput.addEventListener("input", updatePurchaseDateMessage);

// submit-time gate (Week 7): re-check both rules before letting the browser path continue
function handleSubmit(event) {
  event.preventDefault();

  if (isReplacementSkuRequired(preferredResolutionSelect.value) && replacementSkuInput.value.trim() === "") {
    setMessage(formMessage, "Enter a Replacement SKU before submitting, or change your Preferred Resolution.", "blocked");
    replacementSkuInput.focus();
    return;
  }

  if (!isWithinReturnWindow(purchaseDateInput.value)) {
    setMessage(formMessage, "This return is outside the 30-day window and cannot be submitted (BR-1).", "blocked");
    purchaseDateInput.focus();
    return;
  }

  // Read quantity input as a Number before using it.
  const quantity = Number(quantityInput.value);

  setMessage(formMessage, "Client-side checks passed.", "ok");
}

form.addEventListener("submit", handleSubmit);
