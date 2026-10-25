# Exam 2 verification — October 25, 2026

The source is revision `081020261230` of the supplied question pool, pages 421–753. All 420 questions, 2,100 published labels, and 4,620 text fields were compared with an independent Poppler extraction. Two Poppler reading-order differences were resolved against rendered source pages. Page anchors and 528 whitespace-only corrections were checked separately; no published selection labels were changed.

The app distinguishes 90 directly reversed stems from 99 questions containing already-negated options. The latter are evaluated as complete statements without a second inversion. The known contradiction in ML2-D10G2Q3 E remains visibly flagged, while practice retains the published True label.

## Automated checks

- `test-exam.cjs`: 16,576 Exam 1 answer combinations and original calculator/content checks.
- `test-calendar.cjs`: original calendar coverage, migration, five time zones, and DST boundaries.
- `test-exam2.cjs`: 13,440 Exam 2 answer combinations, a pinned digest of all 2,100 labels, complete 140-group coverage, six calculators, invalid inputs, date rollover and rescheduling.
- `test-editions.cjs`: shared app rendering, separate storage/reset, cross-exam backup rejection, reload/export/import, formula errors, and rescheduled practice links.
- JavaScript syntax and Git whitespace checks pass. DESIGN.md lint reports zero errors and warnings.

## PDF and interface

The 50-page printable guide includes all 420 question IDs, 140 group references, 61 worked examples, and 20 self-tests with separate answers. All pages were rendered and inspected through contact sheets, with representative pages inspected at full size. A geometry check found no clipped text or gutter collisions. The committed page map supplies app chapter and self-test links.

Browser checks cover both exam editions, saved calendar goals after reload, a scored reversed question, year-boundary rescheduling, source notes, formula input errors, and a 390-pixel mobile layout without horizontal page overflow. Exam 1 content and printable files remain unchanged. An independent code review found and verified fixes for a hidden source note and a rescheduled practice link; no actionable findings remain.

## Static audit disposition

The premium static audit was run on an unchanged UI-source snapshot, excluding large generated content files after the full scan stalled. It reported ten `affordance.actionless-button` findings. The rule recognizes inline handlers but does not recognize this app's document-level delegated `data-action` handlers. Each reported button has a real handler in `docs/app.js`; interaction tests and browser checks verify the relevant flows. These are documented false positives, not a claim that the static audit returned zero findings.

## Limits

Source fidelity does not establish that every course-pool claim is conceptually correct. The app preserves the supplied grading labels and exposes the identified contradiction. Exact-match scores and attempted calendar goals are study measures, not predictions of official grades or readiness. The Exam 2 calendar target is user-selected; no official deadline was supplied.
