const listEl = document.getElementById("url-list");
const emptyEl = document.getElementById("empty-state");
const copyBtn = document.getElementById("copy-btn");
const saveBtn = document.getElementById("save-btn");
const feedbackEl = document.getElementById("copy-feedback");

async function load() {
  const { urls = [] } = await chrome.storage.local.get("urls");
  render(urls);
}

function render(urls) {
  listEl.innerHTML = "";

  if (urls.length === 0) {
    emptyEl.style.display = "block";
    copyBtn.disabled = true;
    return;
  }

  emptyEl.style.display = "none";
  copyBtn.disabled = false;

  for (const [i, entry] of urls.entries()) {
    const li = document.createElement("li");

    const titleSpan = document.createElement("span");
    titleSpan.className = "title";
    titleSpan.textContent = entry.title;
    titleSpan.title = entry.url;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", `Remove ${entry.title}`);
    deleteBtn.addEventListener("click", () => deleteItem(i));

    li.appendChild(titleSpan);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  }
}

async function deleteItem(index) {
  const { urls = [] } = await chrome.storage.local.get("urls");
  const updated = urls.filter((_, i) => i !== index);
  await chrome.storage.local.set({ urls: updated });
  updateBadge(updated.length);
  render(updated);
}

async function copyAll() {
  const { urls = [] } = await chrome.storage.local.get("urls");
  if (urls.length === 0) return;

  const text = urls.map((e) => e.url).join("\n");
  await navigator.clipboard.writeText(text);

  await chrome.storage.local.set({ urls: [] });
  updateBadge(0);
  render([]);

  feedbackEl.textContent = `Copied ${urls.length} URL${urls.length === 1 ? "" : "s"}`;
  setTimeout(() => (feedbackEl.textContent = ""), 2500);
}

async function saveCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const entry = {
    url: tab.url,
    title: tab.title || tab.url,
    savedAt: new Date().toISOString(),
  };

  const { urls = [] } = await chrome.storage.local.get("urls");
  const updated = [entry, ...urls];
  await chrome.storage.local.set({ urls: updated });
  updateBadge(updated.length);
  render(updated);
}

function updateBadge(count) {
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#4A90D9" });
}

copyBtn.addEventListener("click", copyAll);
saveBtn.addEventListener("click", saveCurrentTab);

load();
