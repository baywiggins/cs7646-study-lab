# Exam 2 extension

The user requests an Exam 2 section on the existing GitHub Pages site in exactly the same format and layout. Reuse the buildless app at `/exam2/`, with Exam 1 / Exam 2 links, exam-specific data and metadata, independent local progress, a matching calendar, practice, topic guides, formula lab, source notes and printable PDF. The PDF pool provides 420 Exam 2 questions, 20 domains and 140 groups. Preserve source keys and expose verified caveats.

## Approaches
Reuse a configurable shared renderer with separate entry pages (chosen implementation): consistent presentation and isolated URLs/storage without copying the whole interface. Duplicating the app would drift; replacing the root app would disrupt Exam 1. The requested exact same format resolves the design direction; no redesign or additional approval is needed.

The calendar uses a user-editable study finish date; absent an official deadline, its suggested ten-day schedule must not claim an exam date. Each first-pass group gets a question, with mixed practice, weak-area repair, and final recall. Review all math extraction and negation instructions against the source. Keep existing Exam 1 backwards compatibility.
