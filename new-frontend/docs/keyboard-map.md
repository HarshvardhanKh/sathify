# Keyboard Navigation Map - SaathiFy

This document outlines the global and route-specific keyboard shortcuts, focus behaviors, and keyboard navigation configurations for the SaathiFy platform.

---

## 1. Global Navigation & Layout Hotkeys

Global shortcuts are bound to custom listeners and remain active across all authenticated dashboard routes:

| Shortcut Combo | Action Targeted | Description | Scope / Context |
| :--- | :--- | :--- | :--- |
| `Alt + D` | Shift focus to main app navigation | Moves active focus straight to the main app dashboard navigation. | Global dashboard |
| `Alt + L` | Jump to Live Session Studio | Navigates the student route to `/live` instantly. | Global dashboard |
| `Alt + K` | Show Keyboard Shortcut Overlay | Opens the floating keyboard helper reference drawer. | Global app |
| `Alt + C` | Toggle Complexity Level | Steps through text complexity (Original -> Simplified -> Key points). | `/read/:documentId` |

---

## 2. Document Reader Shortcuts (`/read/:documentId`)

When consumption view is active, the following shortcuts operate directly on the reading interface and media players:

| Key Combo | Action Targeted | Description |
| :--- | :--- | :--- |
| `Space` | Toggle Play/Pause TTS | Starts or stops the text-to-speech audio reader. |
| `Arrow Left` | Seek to Previous Sentence | Returns the TTS active highlight to the preceding sentence. |
| `Arrow Right` | Seek to Next Sentence | Moves the TTS highlight and focus to the next sentence. |
| `Shift + Arrow Left` | Decrease Playback Speed | Slows down the TTS speed rate by 0.25x intervals. |
| `Shift + Arrow Right` | Increase Playback Speed | Speeds up the TTS speed rate by 0.25x intervals. |

---

## 3. Keyboard-Only Navigation Rules & Focus States
1. **Skiplinks**: A hidden "Skip to main content" link is located at the top of every page layout, allowing keyboard users to bypass navigation sidebars.
2. **Focus Rings**: A custom visible `focus-visible:ring-2` styling is active for all interactive buttons, cards, selects, and textareas.
3. **Headings Outline Tree**: Tab keys navigate headings sequentially inside the left outline drawer. Pressing `Enter` or `Space` moves focus to the selected article body text block.
4. **Notes Insertion**: Users can tab into the notes form on the right utility panel and save a note for the active highlighted block ID without needing mouse selections.
