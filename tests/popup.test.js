/**
 * @jest-environment jsdom
 */

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const DOM = `
  <header>
    <h1>Rescoop</h1>
    <button id="save-btn">Save this tab</button>
  </header>
  <main id="list-container">
    <p id="empty-state" style="display:block">No URLs saved yet.</p>
    <ul id="url-list"></ul>
  </main>
  <footer>
    <button id="copy-btn" disabled>Copy all &amp; clear</button>
    <span id="copy-feedback"></span>
  </footer>
`;

const makeUrls = () => [
  { url: "https://a.com", title: "Site A", savedAt: "2024-01-01T00:00:00.000Z" },
  { url: "https://b.com", title: "Site B", savedAt: "2024-01-02T00:00:00.000Z" },
];

async function initPopup(urls = []) {
  jest.resetModules();
  document.body.innerHTML = DOM;

  chrome.storage.local.get.mockResolvedValue({ urls });
  chrome.storage.local.set.mockResolvedValue(undefined);
  chrome.tabs.query.mockResolvedValue([
    { url: "https://current.com", title: "Current Page" },
  ]);

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });

  require("../extension/popup.js");
  await flushPromises();
}

describe("popup.js — empty state", () => {
  beforeEach(() => initPopup([]));

  it("shows empty state", () => {
    expect(document.getElementById("empty-state").style.display).toBe("block");
  });

  it("renders no list items", () => {
    expect(document.getElementById("url-list").children).toHaveLength(0);
  });

  it("disables copy button", () => {
    expect(document.getElementById("copy-btn").disabled).toBe(true);
  });
});

describe("popup.js — list rendering", () => {
  beforeEach(() => initPopup(makeUrls()));

  it("renders one item per saved URL", () => {
    expect(document.getElementById("url-list").children).toHaveLength(2);
  });

  it("displays titles", () => {
    const titles = [...document.querySelectorAll(".title")].map(
      (el) => el.textContent
    );
    expect(titles).toEqual(["Site A", "Site B"]);
  });

  it("sets URL as tooltip on title", () => {
    const [first] = document.querySelectorAll(".title");
    expect(first.title).toBe("https://a.com");
  });

  it("hides empty state", () => {
    expect(document.getElementById("empty-state").style.display).toBe("none");
  });

  it("enables copy button", () => {
    expect(document.getElementById("copy-btn").disabled).toBe(false);
  });

  it("renders a delete button for each item", () => {
    expect(document.querySelectorAll(".delete-btn")).toHaveLength(2);
  });
});

describe("popup.js — delete", () => {
  beforeEach(async () => {
    await initPopup(makeUrls());
    // Subsequent get calls (from deleteItem) should return the full list
    chrome.storage.local.get.mockResolvedValue({ urls: makeUrls() });
  });

  it("removes the correct item from storage", async () => {
    document.querySelectorAll(".delete-btn")[0].click();
    await flushPromises();

    const saved = chrome.storage.local.set.mock.calls[0][0].urls;
    expect(saved).toHaveLength(1);
    expect(saved[0].url).toBe("https://b.com");
  });

  it("re-renders list after delete", async () => {
    document.querySelectorAll(".delete-btn")[0].click();
    await flushPromises();

    expect(document.getElementById("url-list").children).toHaveLength(1);
  });

  it("updates badge after delete", async () => {
    document.querySelectorAll(".delete-btn")[0].click();
    await flushPromises();

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "1" });
  });
});

describe("popup.js — copy all", () => {
  beforeEach(async () => {
    await initPopup(makeUrls());
    chrome.storage.local.get.mockResolvedValue({ urls: makeUrls() });
  });

  it("copies URLs one per line", async () => {
    document.getElementById("copy-btn").click();
    await flushPromises();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://a.com\nhttps://b.com"
    );
  });

  it("clears storage after copy", async () => {
    document.getElementById("copy-btn").click();
    await flushPromises();

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ urls: [] });
  });

  it("shows feedback with correct count", async () => {
    document.getElementById("copy-btn").click();
    await flushPromises();

    expect(document.getElementById("copy-feedback").textContent).toBe(
      "Copied 2 URLs"
    );
  });

  it("renders empty state after copy", async () => {
    document.getElementById("copy-btn").click();
    await flushPromises();

    expect(document.getElementById("url-list").children).toHaveLength(0);
    expect(document.getElementById("empty-state").style.display).toBe("block");
  });

  it("clears badge after copy", async () => {
    document.getElementById("copy-btn").click();
    await flushPromises();

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
  });
});

describe("popup.js — save this tab", () => {
  beforeEach(() => initPopup([]));

  it("saves current tab to storage", async () => {
    chrome.tabs.query.mockResolvedValue([
      { url: "https://new.com", title: "New Page" },
    ]);
    chrome.storage.local.get.mockResolvedValue({ urls: [] });

    document.getElementById("save-btn").click();
    await flushPromises();

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      urls: [
        expect.objectContaining({ url: "https://new.com", title: "New Page" }),
      ],
    });
  });

  it("prepends to existing list", async () => {
    chrome.tabs.query.mockResolvedValue([
      { url: "https://new.com", title: "New Page" },
    ]);
    chrome.storage.local.get.mockResolvedValue({ urls: makeUrls() });

    document.getElementById("save-btn").click();
    await flushPromises();

    const saved = chrome.storage.local.set.mock.calls[0][0].urls;
    expect(saved[0].url).toBe("https://new.com");
    expect(saved).toHaveLength(3);
  });

  it("updates badge after save", async () => {
    chrome.tabs.query.mockResolvedValue([
      { url: "https://new.com", title: "New Page" },
    ]);
    chrome.storage.local.get.mockResolvedValue({ urls: [] });

    document.getElementById("save-btn").click();
    await flushPromises();

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "1" });
  });
});
