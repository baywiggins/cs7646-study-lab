# Study Lab behavior contract

Both exam sections share the same six views and canonical UI in `docs/app.js` / `docs/styles.css`. English content, local calendar dates, and no user accounts.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native select in shared app | This contract | Native OS popup | Browser keyboard and popup check |
| Date | Native date input, Exam 2 planner | This contract | Editable plan finish date | Invalid date, month/year rollover, reload |
| Form | Shared app handlers | This contract | Local calculator/date fields | Empty/nonfinite input errors |
| Scrollbar | styles.css global baseline | DESIGN.md | Existing natural page scroll | Narrow viewport inspection |
| Toast | shared toast(), #toast live region | This contract | Save/import/reset messages | Storage failure and import feedback |
| CRUD | validState(), save(), reset dialog | This contract | Per-exam progress only | Cross-exam rejection, reload, reset |

Exam 1 keeps `ml4t-exam1-v2`; Exam 2 uses `ml4t-exam2-v2` and an exam marker in backups. Imports for another exam are rejected. Question IDs retain the pool's ML2/QF2 prefixes. Reset affects only the current exam and requires the existing app-owned dialog. Exports include calendar settings and checks.

Question scoring preserves all five supplied selection labels, including reversed stems. Exact-match and statement-accuracy are study metrics, not an asserted course grading policy. Check/retry/next/finish and saved/missed filters behave identically across exams. Local search remains in per-exam local state, matching the existing app; clear buttons reset it immediately. No network request is issued for filtering.

Exam 2 has a ten-session route. Until a deadline is provided, it begins today and ends nine days later as an explicitly suggested study finish date. Users can change the finish date; session checklists retain stable IDs and practice follows completed question records. The final day is a readiness check, with exam logistics referring to the actual course deadline.

Validation uses inline text and accessible status feedback. Keep existing answers when switching routes or exams. Data load is static; the loading fallback links to the PDF. Browser-storage failures warn and permit export. No shared cloud progress or synchronization is implied.
