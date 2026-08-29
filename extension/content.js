const textOf = (root, selectors) => {
  for (const selector of selectors) {
    const el = root.querySelector(selector);
    const value = el?.textContent?.trim();
    if (value) return value;
  }
  return "";
};

function visibleReview() {
  const candidates = [...document.querySelectorAll('[data-review-id], div[role="article"]')].filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.height > 40 && rect.top < innerHeight && rect.bottom > 0;
  });
  const root = candidates[0];
  if (!root) return null;
  const ratingEl = root.querySelector('[aria-label*="star" i], [aria-label*="étoile" i]');
  const ratingText = ratingEl?.getAttribute("aria-label") || "5";
  const rating = Number((ratingText.match(/[1-5](?:[.,]\d)?/) || ["5"])[0].replace(",", "."));
  return {
    author_name: textOf(root, [".d4r55", "[class*='author']", "button[aria-label]"]) || "Customer",
    rating: Math.round(rating),
    text: textOf(root, [".wiI7pd", "[data-expandable-section]", "[class*='review-text']", "span[lang]"])
  };
}

function insertReply(text) {
  const field = [...document.querySelectorAll('textarea, [contenteditable="true"]')].find((el) => {
    const label = `${el.getAttribute("aria-label") || ""} ${el.getAttribute("placeholder") || ""}`;
    return /reply|response|répond|réponse/i.test(label) && el.getBoundingClientRect().height > 0;
  });
  if (!field) return false;
  field.focus();
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), "value")?.set;
    setter ? setter.call(field, text) : (field.value = text);
  } else field.textContent = text;
  field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_VISIBLE_REVIEW") sendResponse({ review: visibleReview() });
  if (message?.type === "INSERT_REPLY") sendResponse({ ok: insertReply(String(message.text || "")) });
});
