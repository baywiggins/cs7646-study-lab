# ML4T Study Lab — Exams 1 and 2

An independent study companion for CS7646, with the same interface for two separate exam editions.

| Edition | Questions | Topic groups | Worked examples | Printable guide |
| --- | ---: | ---: | ---: | ---: |
| [Exam 1](https://baywiggins.github.io/cs7646-study-lab/) | 518 | 135 | 70 | 39 pages |
| [Exam 2](https://baywiggins.github.io/cs7646-study-lab/exam2/) | 420 | 140 | 61 | 50 pages |

Each edition has 20 domain guides, a daily study calendar, question practice, six formula labs, and source-key notes. Use the sidebar exam switch to move between editions.

## Use it together, keep progress separate

The site requires no account. Each person's attempts, saved questions, and current round stay in their own browser on their own device. There is no shared progress database. Two tabs in the same browser profile share the same progress; use separate browser profiles when sharing a device.

Use **Overview → Export progress** to create a backup and **Import progress** to restore it in another browser or on this new host. Progress from the earlier private Site does not transfer automatically. Clearing browser storage removes local progress.

Exam 1 and Exam 2 have separate storage keys, rounds, saved questions, calendars, resets, and backups. Importing the other exam's backup is rejected. Existing Exam 1 backups without an exam marker remain supported.

## Daily study calendar

**Exam 1** retains the October 9–18, 2026 plan. The first seven days cover all 20 domains and 135 topic groups with one representative question per group. October 16 adds a 20-domain mixed round, October 17 uses the 24 printed self-tests and mistake review, and October 18 is a light warm-up plus the exam.

**Exam 2** provides an editable ten-day plan. Set **Study finish date** to your target; no official deadline is assumed. Seven learning days cover all 140 groups, followed by a fresh 20-domain mixed round, 20 printed self-tests and mistake review, and a readiness check. The initial suggestion begins on the viewer's current date. Rescheduling retains completed session goals and practice progress.

Most days target roughly two hours; unfinished work stays visible as carryover. Reading and recall tasks are manual checkboxes. Practice goals update automatically when the assigned questions have been checked, including earlier attempts; completion measures attempted work, not mastery. The exact exam closing time remains the one specified by the course.

Calendar checklists are stored with existing browser-local progress and included in Export/Import. Existing version-2 backups remain supported. Calendar dates use the viewer's local date, with date-only arithmetic for the deadline count.

## Content

The supplied pool revision is `081020261230`. Exam 1 includes 308 machine-learning and 210 quantitative-finance questions, including 95 reversed-direction questions. Exam 2 includes 210 questions in each subject from source pages 421–753. Its 90 direct reversed stems are distinct from 99 questions whose options already contain a negation; those options are evaluated as written without a second inversion.

All five decisions are checked against the published labels; source-key inconsistencies and wording caveats are displayed separately. The exact-match rate is a study measure, not a claim about course grading. Exam 2 includes lecture frames for Q-learning, Dyna, Bollinger Bands, and the Fundamental Law. Its formula labs cover Q-learning, epsilon-greedy action probabilities, technical indicators, the Fundamental Law, trading costs, and option payoffs.

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
node scripts/test-exam2.cjs
node scripts/test-editions.cjs
```

The logic tests cover all 16,576 Exam 1 and 13,440 Exam 2 question/selection combinations, polarity, source-key caveats, calculations, and complete domain/group coverage. Calendar and integration tests cover date boundaries, rescheduling, separate storage, cross-exam import rejection, reset isolation, and backup restoration.

## Rebuilding Exam 2 content

Python requires `pypdf`; printable generation additionally requires `reportlab` and the font paths declared in the script. The Codex bundled Python runtime supplies these packages. The deployed site does not need Python.

```sh
python3 scripts/prepare-exam2.py
python3 scripts/build-exam2-data.py
python3 scripts/build-exam2-pdf.py
```

Reviewed teaching content and whitespace-only transcription corrections live in `content/exam2/`. Intermediate extraction and PDF QA files go to ignored `.work/exam2/`. The PDF generator can also rebuild directly from committed `docs/exam2/exam-data.js`. After changing printable pagination, review the generated `.work/exam2/pdf-page-map.json`, update `content/exam2/pdf-page-map.json`, and rebuild the app data so its PDF links stay accurate.
