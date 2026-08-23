# Screen Reader Performance Notes - SaathiFy

This document outlines screen reader (NVDA, VoiceOver) verification findings, live stream polling configurations, and text announcement strategies built to prevent verbal overloading.

---

## 1. Wizard Profile Onboarding (`/onboarding`)
- **Semantic Fieldsets**: Every step is encapsulated in an HTML `<fieldset>` with a corresponding `<legend>` detailing the category. Screen readers announce the legend immediately upon tab focus entry.
- **Progress Tracking**: Step indicators utilize `aria-current="step"` on the active step icon to verify spatial location.
- **Sliders & Inputs**: The font scale range slider announces values dynamically (e.g. "Font scale: 125%").

---

## 2. Document Reader TTS Navigation (`/read/:documentId`)
- **Focus Highlighting**: As the text-to-speech engine steps through paragraphs and images, the active sentence receives the visual outline class `.tts-active`.
- **Image Accessibility**: Figures are rendered with brief, descriptive `alt` tags as the image primary text. The long-form detailed description is placed inside an expandable group with `aria-expanded="true/false"`.
- **Chart Tabular Representation**: Underlying data series are rendered in a standard HTML `<table>` with explicit row/column headers (`<th scope="col">` and `<th scope="row">`). This allows screen readers to navigate tabular numerical data cleanly.

---

## 3. Real-Time Caption Studio (`/live`)
- **Partials Stuttering Mitigation**: In-flight partial transcription updates received via the FastAPI WebSocket are rendered inside a container marked with `aria-hidden="true"`.
- **Polite Final Announcements**: Final committed segments are rendered in an `aria-live="polite"` zone. This ensures the screen reader waits until the user is silent before announcing full, final sentences, avoiding partial stuttering.
- **Pipeline Alerts**: Errors such as WebSocket disconnects (`PIPELINE_ERROR`) are rendered inside an `aria-live="assertive"` alert box containing descriptive retry actions.
- **ISL Gloss Tracks**: Gloss tokens are placed inside a semantic ordered list `<ol>` representing syntax order. Unknown words fallback to fingerspelling chips annotated with explicit screen-reader notices.
