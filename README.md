# Rescoop

A lightweight Chrome extension that lets you save URLs as you browse and export them in bulk — one URL per line, ready to paste wherever you need them.

No backend. No accounts. Nothing leaves your machine.

---

## Install (Development)

1. Clone this repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `extension/` folder
5. Pin the Rescoop icon to your toolbar

---

## Usage

| Action | How |
|---|---|
| Save current tab | `Alt+Shift+S` from any tab |
| Save current tab | Click the extension icon → **Save this tab** |
| Remove a URL | Hover over an item in the popup → click **×** |
| Export all URLs | Click **Copy all & clear** — copies one URL per line and wipes the list |

The icon badge shows how many URLs are saved.

---

## Storage

All data is stored locally via `chrome.storage.local`. Nothing is sent anywhere.

Schema:
```json
{ "urls": [{ "url": "string", "title": "string", "savedAt": "ISO8601" }] }
```

---

## Roadmap

- **Phase 2** — iOS Shortcut companion: one-tap save from Safari Share Sheet, appends to an iCloud Note
- **Option B** — Native messaging bridge to write directly to a local file instead of copying to clipboard

---

## License

MIT
