# ML4T Exam 1 Study Lab

An independent study companion for CS7646: 518 multi-select questions, 20 topic guides, 70 worked examples, six formula labs, and a 39-page printable guide.

## Use it together, keep progress separate

The site requires no account. Each person's attempts, saved questions, and current round stay in their own browser on their own device. There is no shared progress database. Two tabs in the same browser profile share the same progress; use separate browser profiles when sharing a device.

Use **Overview → Export progress** to create a backup and **Import progress** to restore it in another browser or on this new host. Progress from the earlier private Site does not transfer automatically. Clearing browser storage removes local progress.

## Daily study calendar

Open **Study calendar** for the October 9–18, 2026 plan. The first seven days cover all 20 domains and 135 topic groups with one representative question per group. October 16 adds a 20-domain mixed round, October 17 uses the 24 printed self-tests and mistake review, and October 18 is a light warm-up plus the exam.

Most days target roughly two hours; unfinished work stays visible as carryover. Reading and recall tasks are manual checkboxes. Practice goals update automatically when the assigned questions have been checked, including earlier attempts; completion measures attempted work, not mastery. The exact exam closing time remains the one specified by the course.

Calendar checklists are stored with existing browser-local progress and included in Export/Import. Existing version-2 backups remain supported. Calendar dates use the viewer's local date, with date-only arithmetic for the deadline count.

## Content

The practice pool includes 308 machine-learning and 210 quantitative-finance questions from the supplied pool revision `081020261230`, including 95 reversed-direction questions. All five decisions are checked against the published labels; source-key inconsistencies and wording caveats are displayed separately. The exact-match rate is a study measure, not a claim about course grading.

The included course question pool and lecture frames retain their source attribution and belong to their respective owners. This is an unofficial study companion, not a Georgia Tech service.

## Hosting

GitHub Pages publishes `docs/` from the `main` branch. Relative asset paths and hash navigation support project-site URLs. The website and bundled documents are publicly accessible.

No build step, server, authentication service, analytics, or external fonts are required. Future commits to `main` automatically republish the site.

## Local preview and validation

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory docs
node --check docs/app.js
node scripts/test-exam.cjs
node scripts/test-calendar.cjs
```

The logic test covers all 16,576 question/selection combinations, normal and reversed polarity, known source-key caveats, calculator results, and complete domain/group coverage.
