describe("background.js", () => {
  let commandListener;
  let startupListener;

  beforeEach(() => {
    jest.resetModules();
    chrome.storage.local.get.mockResolvedValue({ urls: [] });
    chrome.storage.local.set.mockResolvedValue(undefined);
    chrome.tabs.query.mockResolvedValue([]);

    require("../extension/background.js");

    commandListener = chrome.commands.onCommand.addListener.mock.calls[0][0];
    startupListener = chrome.runtime.onStartup.addListener.mock.calls[0][0];
  });

  describe("save-url command", () => {
    it("saves URL and title to storage", async () => {
      chrome.tabs.query.mockResolvedValue([
        { url: "https://example.com", title: "Example" },
      ]);

      await commandListener("save-url");

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        urls: [
          expect.objectContaining({
            url: "https://example.com",
            title: "Example",
          }),
        ],
      });
    });

    it("prepends to existing list", async () => {
      chrome.tabs.query.mockResolvedValue([
        { url: "https://new.com", title: "New" },
      ]);
      chrome.storage.local.get.mockResolvedValue({
        urls: [{ url: "https://old.com", title: "Old", savedAt: "2024-01-01" }],
      });

      await commandListener("save-url");

      const saved = chrome.storage.local.set.mock.calls[0][0].urls;
      expect(saved[0].url).toBe("https://new.com");
      expect(saved[1].url).toBe("https://old.com");
    });

    it("sets badge to new count", async () => {
      chrome.tabs.query.mockResolvedValue([
        { url: "https://example.com", title: "Example" },
      ]);

      await commandListener("save-url");

      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "1" });
    });

    it("falls back to URL when title is missing", async () => {
      chrome.tabs.query.mockResolvedValue([{ url: "https://example.com" }]);

      await commandListener("save-url");

      const saved = chrome.storage.local.set.mock.calls[0][0].urls[0];
      expect(saved.title).toBe("https://example.com");
    });

    it("does nothing when tab has no URL", async () => {
      chrome.tabs.query.mockResolvedValue([{ title: "New Tab" }]);

      await commandListener("save-url");

      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it("ignores other commands", async () => {
      await commandListener("something-else");

      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it("records savedAt as ISO8601", async () => {
      chrome.tabs.query.mockResolvedValue([
        { url: "https://example.com", title: "Example" },
      ]);

      await commandListener("save-url");

      const saved = chrome.storage.local.set.mock.calls[0][0].urls[0];
      expect(new Date(saved.savedAt).toISOString()).toBe(saved.savedAt);
    });
  });

  describe("syncBadge", () => {
    it("sets badge to count when URLs exist", async () => {
      chrome.storage.local.get.mockResolvedValue({
        urls: [{}, {}, {}],
      });

      await startupListener();

      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "3" });
    });

    it("clears badge when list is empty", async () => {
      chrome.storage.local.get.mockResolvedValue({ urls: [] });

      await startupListener();

      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
    });

    it("handles missing urls key gracefully", async () => {
      chrome.storage.local.get.mockResolvedValue({});

      await startupListener();

      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
    });
  });
});
