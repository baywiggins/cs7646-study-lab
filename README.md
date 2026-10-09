# ML4T Exam 1 Study Lab

An independent study companion for CS7646: 518 multi-select questions, 20 topic guides, 70 worked examples, six formula labs, and a 39-page printable guide.

## Use it together, keep progress separate

The site requires no account. Each person's attempts, saved questions, and current round stay in their own browser on their own device. There is no shared progress database. Two tabs in the same browser profile share the same progress; use separate browser profiles when sharing a device.

Use **Overview → Export progress** to create a backup and **Import progress** to restore it in another browser or on this new host. Progress from the earlier private Site does not transfer automatically. Clearing browser storage removes local progress.

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
```

The logic test covers all 16,576 question/selection combinations, normal and reversed polarity, known source-key caveats, calculator results, and complete domain/group coverage.
