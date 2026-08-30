const ENDPOINT = "https://hlruprayqfnatnldrski.supabase.co/functions/v1/generate-demo-response";

const STRINGS = {
  fr: {
    headline: "Répondez à vos avis en quelques secondes",
    subline: "Ouvrez un avis, puis générez une réponse professionnelle à relire avant publication.",
    ready: "Avis détecté. Vous pouvez générer une réponse.",
    empty: "Page Google détectée, mais aucun texte d’avis n’a été trouvé. Sélectionnez l’avis ou collez-le manuellement.",
    unsupported: "Ouvrez un avis dans Google Maps ou Google Business Profile, ou collez le texte manuellement.",
    businessRequired: "Ajoutez d’abord le nom de l’établissement.",
    reviewRequired: "Ajoutez ou détectez d’abord un avis.",
    generating: "Génération de la réponse…",
    generated: "Réponse générée. Relisez-la avant publication.",
    copied: "Réponse copiée.",
    inserted: "Réponse insérée. Vérifiez-la puis utilisez le bouton de publication de Google.",
    insertError: "Ouvrez d’abord le champ de réponse Google, puis réessayez. Vous pouvez aussi copier la réponse.",
    generationError: "Impossible de générer la réponse pour le moment.",
    detect: "Détecter l’avis",
    generate: "Générer la réponse IA",
    regenerate: "Régénérer",
    copy: "Copier",
    insert: "Insérer dans Google",
    business: "Établissement",
    rating: "Note",
    review: "Avis",
    reviewTitle: "Avis client",
    replyTitle: "Réponse proposée",
    privacy: "Le texte de l’avis, la note et le nom de l’établissement sont envoyés à notre service IA uniquement pour générer la réponse demandée.",
    publish: "Business Reviews AI ne publie jamais automatiquement. Vérifiez la réponse puis utilisez le bouton de publication de Google."
  },
  en: {
    headline: "Reply to reviews in seconds",
    subline: "Open a review, generate a professional draft, then review it before publishing.",
    ready: "Review detected. You can generate a reply now.",
    empty: "Google page detected, but no review text was found. Select the review text or paste it manually.",
    unsupported: "Open a review in Google Maps or Google Business Profile, or paste the text manually.",
    businessRequired: "Add the business name first.",
    reviewRequired: "Add or detect a review first.",
    generating: "Generating your reply…",
    generated: "Reply generated. Review it before publishing.",
    copied: "Reply copied.",
    inserted: "Reply inserted. Review it, then use Google’s publish button.",
    insertError: "Open Google’s reply field first, then try again. You can also copy the reply.",
    generationError: "Could not generate the reply right now.",
    detect: "Detect review",
    generate: "Generate AI reply",
    regenerate: "Regenerate",
    copy: "Copy",
    insert: "Insert in Google",
    business: "Business",
    rating: "Rating",
    review: "Review",
    reviewTitle: "Customer review",
    replyTitle: "Suggested reply",
    privacy: "The review text, rating and business name are sent to our AI service only to generate the reply you request.",
    publish: "Business Reviews AI never publishes automatically. Review the draft, then use Google’s publish button."
  }
};

const lang = (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
const t = STRINGS[lang];

const els = {
  status: document.getElementById("status"),
  headline: document.getElementById("headline"),
  subline: document.getElementById("subline"),
  businessName: document.getElementById("businessName"),
  rating: document.getElementById("rating"),
  review: document.getElementById("review"),
  response: document.getElementById("response"),
  resultPanel: document.getElementById("resultPanel"),
  detect: document.getElementById("detect"),
  generate: document.getElementById("generate"),
  regenerate: document.getElementById("regenerate"),
  copy: document.getElementById("copy"),
  insert: document.getElementById("insert")
};

function localize() {
  document.documentElement.lang = lang;
  els.headline.textContent = t.headline;
  els.subline.textContent = t.subline;
  document.getElementById("businessLabel").textContent = t.business;
  document.getElementById("ratingLabel").textContent = t.rating;
  document.getElementById("reviewLabel").textContent = t.review;
  document.getElementById("reviewSectionTitle").textContent = t.reviewTitle;
  document.getElementById("replySectionTitle").textContent = t.replyTitle;
  document.getElementById("privacyNote").textContent = t.privacy;
  document.getElementById("publishNote").textContent = t.publish;
  els.detect.textContent = t.detect;
  document.getElementById("generateLabel").textContent = t.generate;
  els.regenerate.textContent = t.regenerate;
  els.copy.textContent = t.copy;
  els.insert.textContent = t.insert;
}

function setStatus(message, type = "neutral") {
  els.status.textContent = message;
  els.status.className = `status ${type}`;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  return tab;
}

function extractReviewContext() {
  const isVisible = (el) => {
    if (!(el instanceof Element)) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };
  const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
  const parseRating = (root) => {
    if (!root) return null;
    for (const el of root.querySelectorAll?.("[aria-label]") || []) {
      const label = el.getAttribute("aria-label") || "";
      const match = label.match(/([1-5](?:[.,]\d)?)\s*(?:star|stars|étoile|étoiles|estrella|estrellas|stern|sterne)/i);
      if (match) return Number(match[1].replace(",", "."));
    }
    return null;
  };
  const findBusinessName = () => {
    const selectors = ["h1.DUwDvf", "[role='main'] h1", ".fontHeadlineLarge", "[data-attrid='title']", "h1"];
    for (const selector of selectors) {
      for (const node of document.querySelectorAll(selector)) {
        if (!isVisible(node)) continue;
        const text = clean(node.textContent);
        if (text && text.length < 120) return text;
      }
    }
    return clean(document.title).replace(/\s*[–—|-]\s*Google.*$/i, "").slice(0, 120);
  };
  const selection = clean(window.getSelection?.().toString());
  let card = null;
  const selected = window.getSelection?.();
  if (selected?.rangeCount) {
    const anchor = selected.anchorNode?.nodeType === Node.ELEMENT_NODE ? selected.anchorNode : selected.anchorNode?.parentElement;
    card = anchor?.closest?.("[data-review-id], article, [role='article']") || null;
  }
  if (!card) {
    const direct = [...document.querySelectorAll("[data-review-id], article, [role='article']")].filter(isVisible);
    card = direct.find((node) => parseRating(node)) || null;
  }
  if (!card) {
    for (const star of [...document.querySelectorAll("[aria-label]")].filter(isVisible)) {
      if (!/(?:star|stars|étoile|étoiles|estrella|estrellas|stern|sterne)/i.test(star.getAttribute("aria-label") || "")) continue;
      card = star.closest("[data-review-id], article, [role='article'], [jscontroller]");
      if (card && isVisible(card)) break;
    }
  }
  let text = selection.length >= 8 ? selection : "";
  let rating = card ? parseRating(card) : null;
  if (card && !text) {
    for (const selector of ["[data-review-text]", ".wiI7pd", ".MyEned", ".review-full-text"]) {
      const candidate = [...card.querySelectorAll(selector)].find(isVisible);
      const value = clean(candidate?.textContent);
      if (value && value.length >= 3) { text = value; break; }
    }
    if (!text) {
      const full = clean(card.textContent);
      if (full && full.length <= 1200) text = full;
    }
  }
  return {
    businessName: findBusinessName(),
    rating: rating || 5,
    text,
    url: location.href
  };
}

function insertReplyIntoPage(text) {
  const isVisible = (el) => {
    if (!(el instanceof Element)) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };
  const active = document.activeElement;
  const editable = (el) => el && isVisible(el) && (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && el.type === "text") || el.getAttribute?.("contenteditable") === "true");
  let field = editable(active) ? active : null;
  if (!field) {
    const fields = [...document.querySelectorAll("textarea,input[type='text'],[contenteditable='true']")].filter(isVisible);
    const pattern = /reply|respond|response|répondre|réponse|antwort|responder/i;
    field = fields.find((el) => pattern.test(`${el.getAttribute("aria-label") || ""} ${el.getAttribute("placeholder") || ""}`)) || fields.find((el) => el instanceof HTMLTextAreaElement) || null;
  }
  if (!field) return { ok: false };
  field.focus();
  if (field.getAttribute?.("contenteditable") === "true") {
    field.textContent = text;
    field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  } else {
    const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(field, text); else field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return { ok: true };
}

async function detectReview({ quiet = false } = {}) {
  try {
    const tab = await getActiveTab();
    if (!/^https?:/i.test(tab.url || "")) throw new Error("Unsupported page");
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractReviewContext });
    if (!result) throw new Error("No context");
    if (result.businessName && !els.businessName.value.trim()) els.businessName.value = result.businessName;
    if (result.rating) els.rating.value = String(Math.max(1, Math.min(5, Math.round(result.rating))));
    if (result.text) els.review.value = result.text;
    if (result.text) setStatus(t.ready, "success");
    else if (!quiet) setStatus(t.empty, "neutral");
  } catch (_error) {
    if (!quiet) setStatus(t.unsupported, "error");
  }
}

async function generateReply() {
  const businessName = els.businessName.value.trim();
  const text = els.review.value.trim();
  const rating = Number(els.rating.value || 5);
  if (!businessName) { setStatus(t.businessRequired, "error"); els.businessName.focus(); return; }
  if (!text) { setStatus(t.reviewRequired, "error"); els.review.focus(); return; }
  els.generate.disabled = true;
  els.regenerate.disabled = true;
  setStatus(t.generating, "loading");
  try {
    await chrome.storage.local.set({ businessName });
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, review: { rating, text }, language: lang })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.response) throw new Error(payload.error || `Generation failed (${res.status})`);
    els.response.value = String(payload.response).trim();
    els.resultPanel.classList.remove("hidden");
    setStatus(t.generated, "success");
  } catch (error) {
    setStatus(error?.message || t.generationError, "error");
  } finally {
    els.generate.disabled = false;
    els.regenerate.disabled = false;
  }
}

async function copyReply() {
  const value = els.response.value.trim();
  if (!value) return;
  await navigator.clipboard.writeText(value);
  setStatus(t.copied, "success");
}

async function insertReply() {
  const value = els.response.value.trim();
  if (!value) return;
  try {
    const tab = await getActiveTab();
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: insertReplyIntoPage, args: [value] });
    if (!result?.ok) throw new Error("No reply field");
    setStatus(t.inserted, "success");
  } catch (_error) {
    setStatus(t.insertError, "error");
  }
}

els.detect.addEventListener("click", () => detectReview());
els.generate.addEventListener("click", generateReply);
els.regenerate.addEventListener("click", generateReply);
els.copy.addEventListener("click", copyReply);
els.insert.addEventListener("click", insertReply);
els.businessName.addEventListener("change", () => chrome.storage.local.set({ businessName: els.businessName.value.trim() }));

document.addEventListener("DOMContentLoaded", async () => {
  localize();
  const saved = await chrome.storage.local.get(["businessName"]);
  if (saved.businessName) els.businessName.value = saved.businessName;
  await detectReview({ quiet: true });
});
