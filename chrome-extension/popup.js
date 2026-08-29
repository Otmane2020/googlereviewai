const ENDPOINT = "https://hlruprayqfnatnldrski.supabase.co/functions/v1/generate-demo-response";

const els = {
  status: document.getElementById("status"),
  businessName: document.getElementById("businessName"),
  rating: document.getElementById("rating"),
  author: document.getElementById("author"),
  review: document.getElementById("review"),
  response: document.getElementById("response"),
  resultPanel: document.getElementById("resultPanel"),
  detect: document.getElementById("detect"),
  generate: document.getElementById("generate"),
  regenerate: document.getElementById("regenerate"),
  copy: document.getElementById("copy"),
  insert: document.getElementById("insert"),
};

function setStatus(message, type = "") {
  els.status.textContent = message;
  els.status.className = `status ${type}`.trim();
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToPage(message) {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error("No active tab found.");
  return chrome.tabs.sendMessage(tab.id, message);
}

async function detectReview({ quiet = false } = {}) {
  try {
    const context = await sendToPage({ type: "GET_REVIEW_CONTEXT" });
    if (!context) throw new Error("No review detected.");

    if (context.businessName && !els.businessName.value.trim()) {
      els.businessName.value = context.businessName;
    }
    if (context.author) els.author.value = context.author;
    if (context.rating) els.rating.value = String(Math.max(1, Math.min(5, Math.round(context.rating))));
    if (context.text) els.review.value = context.text;

    if (context.text) {
      setStatus("Review detected. You can generate a reply now.", "success");
    } else if (!quiet) {
      setStatus("Google page detected, but no review text was found. Select the review text or paste it manually.");
    }
  } catch (error) {
    if (!quiet) {
      setStatus("Open a Google Maps / Business Profile review, or paste the review manually.", "error");
    }
  }
}

async function generateReply() {
  const businessName = els.businessName.value.trim();
  const text = els.review.value.trim();
  const rating = Number(els.rating.value || 5);
  const author = els.author.value.trim() || "Customer";

  if (!businessName) {
    setStatus("Add the business name first.", "error");
    els.businessName.focus();
    return;
  }
  if (!text) {
    setStatus("Add or detect a review first.", "error");
    els.review.focus();
    return;
  }

  els.generate.disabled = true;
  els.regenerate.disabled = true;
  setStatus("Generating a professional reply…");

  try {
    await chrome.storage.local.set({ businessName });
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        review: { rating, author_name: author, text },
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.response) {
      throw new Error(payload.error || `Generation failed (${res.status})`);
    }

    els.response.value = payload.response.trim();
    els.resultPanel.classList.remove("hidden");
    setStatus("Reply generated. Review it before publishing.", "success");
  } catch (error) {
    setStatus(error?.message || "Could not generate the reply.", "error");
  } finally {
    els.generate.disabled = false;
    els.regenerate.disabled = false;
  }
}

async function copyReply() {
  const value = els.response.value.trim();
  if (!value) return;
  await navigator.clipboard.writeText(value);
  setStatus("Reply copied to clipboard.", "success");
}

async function insertReply() {
  const value = els.response.value.trim();
  if (!value) return;

  try {
    const result = await sendToPage({ type: "INSERT_RESPONSE", text: value });
    if (!result?.ok) throw new Error(result?.error || "No reply field found.");
    setStatus("Reply inserted in Google. Check it, then click Google's publish/reply button.", "success");
  } catch (error) {
    setStatus("Open the Google reply box first, then try Insert again. You can also use Copy.", "error");
  }
}

els.detect.addEventListener("click", () => detectReview());
els.generate.addEventListener("click", generateReply);
els.regenerate.addEventListener("click", generateReply);
els.copy.addEventListener("click", copyReply);
els.insert.addEventListener("click", insertReply);
els.businessName.addEventListener("change", () => chrome.storage.local.set({ businessName: els.businessName.value.trim() }));

document.addEventListener("DOMContentLoaded", async () => {
  const saved = await chrome.storage.local.get(["businessName"]);
  if (saved.businessName) els.businessName.value = saved.businessName;
  detectReview({ quiet: true });
});
