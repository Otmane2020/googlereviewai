function isVisible(el) {
  if (!(el instanceof Element)) return false;
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function parseRating(root) {
  if (!root) return null;
  const labelled = root.querySelectorAll?.("[aria-label]") || [];
  for (const el of labelled) {
    const label = el.getAttribute("aria-label") || "";
    const match = label.match(/([1-5](?:[.,]\d)?)\s*(?:star|stars|étoile|étoiles)/i);
    if (match) return Number(match[1].replace(",", "."));
  }
  return null;
}

function findBusinessName() {
  const selectors = [
    "h1.DUwDvf",
    "h1",
    "[role='main'] h1",
    ".fontHeadlineLarge",
    "[data-attrid='title']",
  ];
  for (const selector of selectors) {
    const nodes = [...document.querySelectorAll(selector)].filter(isVisible);
    for (const node of nodes) {
      const text = cleanText(node.textContent);
      if (text && text.length < 120) return text;
    }
  }

  const title = cleanText(document.title).replace(/\s*[–—|-]\s*Google.*$/i, "");
  return title && title.length < 120 ? title : "";
}

function getSelectedText() {
  const text = cleanText(window.getSelection?.().toString());
  return text.length >= 8 ? text : "";
}

function findReviewCard() {
  const selected = window.getSelection?.();
  if (selected?.rangeCount) {
    const node = selected.anchorNode?.nodeType === Node.ELEMENT_NODE
      ? selected.anchorNode
      : selected.anchorNode?.parentElement;
    const selectedCard = node?.closest?.("[data-review-id], article, [role='article']");
    if (selectedCard) return selectedCard;
  }

  const direct = [...document.querySelectorAll("[data-review-id], article, [role='article']")].filter(isVisible);
  const withStars = direct.find((node) => parseRating(node));
  if (withStars) return withStars;

  const stars = [...document.querySelectorAll("[aria-label]")].filter((el) => {
    const label = el.getAttribute("aria-label") || "";
    return isVisible(el) && /(?:star|stars|étoile|étoiles)/i.test(label);
  });

  for (const star of stars) {
    const card = star.closest("[data-review-id], article, [role='article'], [jscontroller]");
    if (card && isVisible(card)) return card;
  }
  return null;
}

function extractReview() {
  const card = findReviewCard();
  const selection = getSelectedText();

  let text = selection;
  let author = "";
  let rating = null;

  if (card) {
    rating = parseRating(card);

    const textSelectors = ["[data-review-text]", ".wiI7pd", ".MyEned", ".review-full-text"];
    if (!text) {
      for (const selector of textSelectors) {
        const candidate = [...card.querySelectorAll(selector)].find(isVisible);
        const value = cleanText(candidate?.textContent);
        if (value && value.length >= 3) {
          text = value;
          break;
        }
      }
    }

    const authorSelectors = ["[data-reviewer-name]", ".d4r55", ".TSUbDb", ".WNxzHc"];
    for (const selector of authorSelectors) {
      const candidate = [...card.querySelectorAll(selector)].find(isVisible);
      const value = cleanText(candidate?.getAttribute?.("data-reviewer-name") || candidate?.textContent);
      if (value) {
        author = value;
        break;
      }
    }

    if (!text) {
      const full = cleanText(card.textContent);
      if (full && full.length <= 1200) text = full;
    }
  }

  return {
    businessName: findBusinessName(),
    author,
    rating: rating || 5,
    text,
    url: location.href,
  };
}

function setNativeInputValue(element, value) {
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (setter) setter.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.focus();
}

function findReplyField() {
  const active = document.activeElement;
  if (active && isVisible(active) && (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement || active.getAttribute?.("contenteditable") === "true")) {
    return active;
  }

  const fields = [...document.querySelectorAll("textarea, input[type='text'], [contenteditable='true']")].filter(isVisible);
  const replyPattern = /reply|respond|response|répondre|réponse|antwort|responder/i;
  return fields.find((el) => {
    const label = `${el.getAttribute("aria-label") || ""} ${el.getAttribute("placeholder") || ""}`;
    return replyPattern.test(label);
  }) || fields.find((el) => el instanceof HTMLTextAreaElement) || null;
}

function insertResponse(text) {
  const field = findReplyField();
  if (!field) return { ok: false, error: "No visible reply field found" };

  if (field.getAttribute?.("contenteditable") === "true") {
    field.focus();
    field.textContent = text;
    field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  } else {
    setNativeInputValue(field, text);
  }
  return { ok: true };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_REVIEW_CONTEXT") {
    sendResponse(extractReview());
    return;
  }
  if (message?.type === "INSERT_RESPONSE") {
    sendResponse(insertResponse(message.text || ""));
  }
});
