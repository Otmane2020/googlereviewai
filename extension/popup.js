const endpoint = "https://hlruprayqfnatnldrski.supabase.co/functions/v1/generate-demo-response";
const $ = (id) => document.getElementById(id);
let currentReview = null;

const setStatus = (message, error = false) => {
  $("status").textContent = message;
  $("status").style.color = error ? "#b42318" : "#687386";
};

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function detectReview() {
  const saved = await chrome.storage.local.get("businessName");
  $("business").value = saved.businessName || "";
  const tab = await activeTab();
  if (!tab?.id || !/^https:\/\/(www\.google\.com\/maps|business\.google\.com)\//.test(tab.url || "")) return;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_VISIBLE_REVIEW" });
    if (!response?.review) throw new Error("No review found");
    currentReview = response.review;
    $("author").textContent = currentReview.author_name || "Customer";
    $("comment").textContent = currentReview.text || "Review without written comment";
    $("stars").textContent = "★".repeat(Math.max(1, Math.min(5, currentReview.rating || 5)));
    $("review").classList.remove("hidden");
    $("generate").disabled = false;
    setStatus("Review detected. Check the business name, then generate a reply.");
  } catch {
    setStatus("Open a specific review and its reply field, then reopen the extension.");
  }
}

$("business").addEventListener("change", () => chrome.storage.local.set({ businessName: $("business").value.trim() }));
$("generate").addEventListener("click", async () => {
  const businessName = $("business").value.trim();
  if (!businessName) return setStatus("Enter your business name first.", true);
  if (!currentReview) return setStatus("No review is currently detected.", true);
  chrome.storage.local.set({ businessName });
  $("generate").disabled = true;
  setStatus("Generating a personalized reply…");
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ review: currentReview, businessName }) });
    const data = await response.json();
    if (!response.ok || !data.response) throw new Error(data.error || "Generation failed");
    $("reply").value = data.response;
    $("result").classList.remove("hidden");
    setStatus("Reply generated. Review and edit it before inserting.");
  } catch (error) {
    setStatus(error.message || "Unable to generate a reply. Try again.", true);
  } finally { $("generate").disabled = false; }
});

$("copy").addEventListener("click", async () => { await navigator.clipboard.writeText($("reply").value); setStatus("Reply copied."); });
$("insert").addEventListener("click", async () => {
  const tab = await activeTab();
  const response = await chrome.tabs.sendMessage(tab.id, { type: "INSERT_REPLY", text: $("reply").value });
  setStatus(response?.ok ? "Reply inserted. Check it before publishing." : "Open the reply field, then try again.", !response?.ok);
});

detectReview();
