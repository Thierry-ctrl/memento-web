---
name: Mobile menu containing block
description: Why viewport-fixed navigation overlays must not live inside the filtered Memento header.
---

Render the mobile navigation overlay through a document-body portal rather than as a fixed descendant of the site header.

**Why:** The header uses backdrop filtering, which creates a containing block for fixed descendants in browsers. A nested `fixed inset-0` menu is then constrained to the header and exposes the page beneath it.

**How to apply:** Keep the menu toggle in the header, but portal the opaque overlay to `document.body`; preserve body scroll locking while open.