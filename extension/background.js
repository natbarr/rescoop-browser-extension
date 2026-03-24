chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "save-url") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const entry = {
    url: tab.url,
    title: tab.title || tab.url,
    savedAt: new Date().toISOString(),
  };

  const { urls = [] } = await chrome.storage.local.get("urls");
  urls.unshift(entry);
  await chrome.storage.local.set({ urls });

  chrome.action.setBadgeText({ text: String(urls.length) });
  chrome.action.setBadgeBackgroundColor({ color: "#4A90D9" });
});

// Keep badge in sync on startup
chrome.runtime.onStartup.addListener(syncBadge);
chrome.runtime.onInstalled.addListener(syncBadge);

async function syncBadge() {
  const { urls = [] } = await chrome.storage.local.get("urls");
  const count = urls.length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#4A90D9" });
}
