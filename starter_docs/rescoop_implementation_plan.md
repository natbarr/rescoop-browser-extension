# Rescoop — Implementation Plan

## Overview

Rescoop is a lightweight browser extension + iOS companion that lets you save URLs as you browse and export them in bulk. Built to feed the AI PM Learning Path resource review workflow, but generic enough to use for any URL collection task.

---

## Goals

- Zero-friction URL capture while browsing
- Batch export (copy all) at review time, formatted one URL per line
- No backend, no accounts, no external services
- Desktop (Chrome) and mobile (iOS Safari) both covered

---

## Repository Structure

```
rescoop/
  extension/          ← Chrome extension (Phase 1)
    manifest.json
    background.js
    popup.html
    popup.js
    popup.css
    icons/
      icon16.png
      icon48.png
      icon128.png
  shortcuts/          ← iOS Shortcut companion (Phase 2)
    README.md         ← install instructions + shortcut download link
  README.md
```

---

## Phase 1 — Chrome Extension

### Tech Stack

- Manifest V3 (Chrome's current extension standard)
- Vanilla JS — no build tooling, no framework
- `chrome.storage.local` for persistence
- `chrome.commands` API for keyboard shortcut

### Features

#### Saving a URL
- Keyboard shortcut: `Alt+S` on any tab → saves current tab's URL and page title
- Clicking the extension icon and pressing "Save this tab" in the popup also works
- Extension icon badge increments to show saved count

#### Popup UI
- List of saved URLs, most recent at top
- Each item displays page title (not raw URL)
- Hovering an item reveals the raw URL as a tooltip
- Per-item delete button (×)
- "Copy all" button — copies all URLs one-per-line to clipboard, then clears the list
- Empty state: "No URLs saved yet. Press Alt+S on any tab."

#### Storage
- `chrome.storage.local` — persists across browser restarts
- Data never leaves the local machine
- Schema: `{ urls: [{ url: string, title: string, savedAt: ISO8601 }] }`

### File Responsibilities

| File | Responsibility |
|------|---------------|
| `manifest.json` | Extension metadata, permissions, shortcut declaration |
| `background.js` | Service worker — handles `Alt+S` command, fetches tab info, writes to storage |
| `popup.html` | Popup shell and structure |
| `popup.js` | Reads storage, renders list, handles delete and copy-all |
| `popup.css` | Styles — minimal, functional |

### Permissions Required

```json
"permissions": ["activeTab", "storage", "scripting"],
"commands": {
  "save-url": {
    "suggested_key": { "default": "Alt+S" },
    "description": "Save current tab URL"
  }
}
```

### UX Flow

```
User on any webpage
  → presses Alt+S
  → background.js gets tab URL + title
  → appends to chrome.storage.local
  → badge count increments

User ready to review
  → clicks extension icon
  → popup opens, shows saved list
  → clicks "Copy all"
  → clipboard contains: one URL per line
  → list clears
  → user pastes into daily resource file
```

### Copy All Output Format

```
https://example.com/article-one
https://example.com/article-two
https://example.com/article-three
```

---

## Phase 2 — iOS Shortcut Companion

### Goal

Replicate the one-tap save experience in iOS Safari via the Share Sheet.

### Mechanism

- iOS Shortcut that appears as "Save to Rescoop" in the Safari Share Sheet
- Appends the shared URL to a dedicated iCloud Note ("Rescoop Inbox")
- At review time, user copies URLs from the note and pastes into the daily file alongside Chrome-captured URLs

### Shortcut Logic (pseudocode)

```
Receive [Safari web page] from Share Sheet
Get URL from input
Append URL + newline to iCloud Note named "Rescoop Inbox"
Show quick notification: "Saved to Rescoop"
```

### Deliverable

- The `.shortcut` file hosted in the repo
- `shortcuts/README.md` with install instructions (download file → open on iOS → add shortcut)

---

## Future Considerations

- **Option B upgrade**: Native messaging bridge so "Copy all" writes directly to `resources/to_review/YYMMDD_resources.md` instead of requiring a manual paste
- **Arc/Brave support**: No changes needed — both support MV3 Chrome extensions
- **Firefox support**: Would require minor manifest adjustments (`browser_action` vs `action`)
- **Rescoop Inbox sync**: If iCloud Note and Chrome extension should share a list, a small iCloud-backed sync layer could unify them — out of scope for v1

---

## Install (Development)

1. Clone the repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** → select the `extension/` directory
5. Pin the Rescoop icon to the toolbar

---

## Out of Scope (v1)

- Any backend or cloud sync
- Safari desktop extension (separate build pipeline required)
- Tab group saving
- Deduplication
- Tags or notes on saved URLs
