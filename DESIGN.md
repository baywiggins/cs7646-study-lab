---
version: alpha
colors:
  primary: "#247567"
  ink: "#19343b"
  muted: "#5a6e71"
  navy: "#142b32"
  paper: "#f5f5ef"
  line: "#d9dfd7"
  gold: "#eec782"
  green: "#247567"
  red: "#ac4738"
typography:
  body:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  heading:
    fontFamily: 'Georgia, "Times New Roman", serif'
rounded:
  control: "8px"
  panel: "12px"
spacing:
  panel: "24px"
  desktop: "44px"
---

## Overview
ML4T Study Lab is a focused exam preparation tool for two independent learners. The accepted Exam 1 interface is the visual reference. Exam 2 must use exactly the same layout, type, colors, interaction patterns, and six main views. The only new navigation is an explicit exam switch.

## Colors
Runtime ownership model B: `docs/styles.css` `:root` variables are canonical. Frontmatter mirrors those variables; shared views consume them directly. Navy anchors the sidebar, green denotes actions and completion, gold denotes exam context and cautions, and red denotes incorrect answers or destructive actions. Color is always accompanied by text.

## Typography
Georgia headings and numerical highlights pair with the existing system sans-serif stack. No external font request or new dependency. Keep formula strings readable and allow long identifiers and equations to wrap.

## Layout
Preserve the 236px desktop sidebar, 77px topbar, 1370px maximum content width, and established responsive breakpoints. The document owns vertical scrolling. Exam switching uses ordinary links to the root Exam 1 app and `/exam2/`; hash routes retain each app's existing navigation.

## Elevation & Depth
Use the existing subtle panel shadow and hairline borders. Do not add a new visual language for Exam 2.

## Shapes
Shared controls have 8px corners, content panels 12px, badges are rounded pills. Reuse existing classes.

## Components
`docs/app.js` owns both exams' shell, question cards, guide, feedback, backups, and navigation. `docs/styles.css` owns all shared visual treatment. Each exam supplies content, calendar behavior, and calculation definitions. Native selects and date input are intentional: platform-owned popups are acceptable.

## Do's and Don'ts
- Preserve Exam 1 routes, content, saved state, and printable guide.
- Keep Exam 2 vocabulary, questions, examples, calculations, and PDFs exclusively in its scope.
- Do not invent an official Exam 2 deadline. A suggested study finish date must be clearly labeled and editable.
- Use visible focus, semantic controls, readable error messages, and narrow layouts.
