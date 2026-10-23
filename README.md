# After — A/B study preview

This standalone HTML/CSS/JavaScript prototype runs without installation or external libraries.

Start a local-only server from this folder:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`.

- **View A / View B** starts a review flow labelled `preview` in results.
- **Restart** returns to the anonymous participant flow and assigns the next locally balanced variant when Begin is pressed.
- **Results** shows attempts and lets you export a genuine `.xlsx` workbook or the raw JSON.
- `?variant=A` / `?variant=B` selects a review variant. `?view=research` opens local results.

## Current scope

18 fictional estate-administration tasks, scrolling dashboard A, tabbed dashboard B, identical task-detail and sample-document flow, explicit confirmation, completion screen, ease rating, and optional feedback. Incorrect tasks and document choices are recorded. No inferred deadlines are shown. The study asks participants to identify the next ready banking action using assignment, document readiness and dependencies. Daniel handles selected parallel tasks. A correct task submission is not bank acceptance or release of estate funds.

The researcher toolbar and inspector are review aids outside the participant interface. They must be removed or separately gated in the participant deployment.

## Local data and limitations

No hosting, backend connections, sign-in, analytics services or external response collection have been activated. All responses stay in this origin's browser localStorage. They do not follow the user to another device, browser or port. This is unsuitable for distributing the actual study until central storage and researcher authentication are connected. The local Results page is deliberately not authenticated.

The built-in samples are selectable simulated document records; no personal files are uploaded. Official source links open only if a participant explicitly selects them.

Each attempt records task discovery time, completion time, background-adjusted active times, taps, wrong-task openings, scroll displacement and episodes, events, ease rating and feedback. The Excel workbook contains Participant Summary, Event Log and Data Dictionary sheets. Preview attempts are included in exports but excluded from the on-screen participant comparison.

Interrupted/reloaded attempts remain in the data as `in_progress`, rather than being silently treated as successes. Researchers must examine these alongside abandoned attempts. Local balancing is a preview mechanism; hosted assignment must be atomic and server-side.

## Planned hosting phase — not implemented

After review: Vercel Hobby for the public study frontend, Supabase Free for durable anonymous session/event storage and researcher authentication, and server-controlled exports. Secrets belong in environment variables, never client code. Verify applicable free-tier allowances before connecting. Preserve event IDs for retry deduplication and add an explicit study-close control.

## Research basis

- OCBC: https://www.ocbc.com/personal-banking/estate-planning
- Singapore Courts: https://www.judiciary.gov.sg/family/apply-for-probate
- IRAS, deceased taxpayers: https://www.iras.gov.sg/taxes/individual-income-tax/my-situation/my-family-member-has-passed-away/
- IRAS, estate records: https://www.iras.gov.sg/taxes/other-taxes/trusts/basics-of-income-tax-of-estate-trust/keeping-proper-records-accounts
- SGX CDP: https://www.sgx.com/securities/retail-investor/cdp-faqs
- HDB resale: https://www.hdb.gov.sg/managing-my-home/selling-a-flat/process-for-selling-a-flat/resale-flat-application/application-process
- MyLegacy settlement: https://mylegacy.life.gov.sg/when-death-happens/settle-outstanding-bills-and-taxes

Sources support the general tasks; statuses, task splitting, assignees, prerequisites and the case story are study adaptations.

## Readiness-based revision

Build `local-review-2-readiness` replaces invented countdowns with assignment and dependency information. Task details explicitly say no deadline has been added. Current participant comparisons include only this build; prior local attempts remain visible and exportable with their build identifier. This revision tests identifying the next banking action rather than ranking unrelated tasks by urgency.

## GitHub Pages

This repository is ready for GitHub Pages: all asset paths are relative and `.nojekyll` disables Jekyll processing. In the repository settings, select Pages → Deploy from a branch → main → /(root), then save.

Publishing this static preview does **not** enable central response collection or researcher authentication. Results still belong to the current browser and website origin. The review controls remain visible so the two designs can be inspected. Do not distribute it as a live data-collection study until the backend and access controls are connected.

No credentials, participant responses or real documents are included in the source files.
