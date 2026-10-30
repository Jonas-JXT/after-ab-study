# After — A/B usability study

Public study: https://jonas-jxt.github.io/after-ab-study/

Private researcher workspace: https://jonas-jxt.github.io/after-ab-study/?view=research

The static HTML/CSS/JavaScript frontend uses Supabase for anonymous response storage and researcher email sign-in. No installation or third-party browser libraries are required.

## Study flow

17 fictional estate-administration tasks, scrolling dashboard A, tabbed dashboard B, identical task details, built-in sample selection, submission confirmation, completion and feedback. No personal documents are uploaded. No automatic deadlines are inferred. The objective is identifying the next ready banking action using readiness, assignment and dependencies.

The server balances A/B assignment across current-build participant attempts atomically. An assignment is registered before the timed dashboard opens. Preview attempts (`?variant=A` or `?variant=B`) are separately labelled and excluded from comparisons. Local preview controls appear on localhost and explicit preview links; ordinary hosted participants do not see them.

## Storage and privacy

Participants do not create accounts. Each new session receives a random, browser-held secret allowing only updates to that session. The database stores its hash, never the raw secret. Monotonic revisions protect against older retries overwriting newer snapshots. Pending responses retry after connection loss and on the next visit from the same browser. The completion screen reports when saving is acknowledged; participants should keep it open until saved.

Only the approved, verified researcher email can read central responses or pause/resume new attempts. Database row-level policies enforce this independently of the UI. Public clients cannot read response rows, session secret hashes or the researcher allowlist. The public configuration contains only the project URL and publishable key, which is intended for browser use. Never include a database password, service-role or secret key in frontend files.

Existing local-only historical attempts are not automatically uploaded. Central exports include centrally registered attempts, including unfinished and preview attempts. A reload starts a new attempt; inspect unfinished responses separately. Anonymous codes do not prove unique people, so distribute one study attempt per participant and review duplicates during analysis.

## Researcher access and export

Open the private workspace, enter the approved researcher email and use the emailed sign-in link in the same browser. Each browser and device needs its own sign-in. To use a laptop, open the emailed link on that laptop; opening it on a phone signs in only that phone. Use the newest email because each link works once. Use Refresh to retrieve current responses and Download Excel for a genuine .xlsx workbook containing Participant Summary, Event Log and Data Dictionary. Raw JSON is also available. Sign out when using a shared device.

New attempts can be paused from the researcher workspace; already registered participants can still finish. The project currently caps registered sessions at 500. The participant link remains public, so anonymous spam protection is limited; close collection after the study.

Each attempt records task-discovery and completion times, active times subtracting recorded background intervals, taps, other-task openings, scroll distance/episodes, event history, ease rating and feedback. Exploratory clicks are not automatically classified as errors; use the event history to assess paths. Comparisons include only build `study-6-pending-footer`. Earlier protocol attempts should not be pooled.

## Local preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/?variant=A or ?variant=B. With the committed public configuration, these previews save to Supabase with the preview label. Clear both configuration values to run a local-only copy. Do not distribute that copy for central collection.

## Hosting

GitHub Pages serves main branch root. Asset URLs are relative and .nojekyll disables Jekyll. Supabase authentication redirects are configured to the hosted researcher URL. Email delivery uses the project's configured authentication email service; if Supabase reports an email delivery restriction, configure an approved sender before relying on sign-in.

## Research basis

- OCBC: https://www.ocbc.com/personal-banking/estate-planning
- Singapore Courts: https://www.judiciary.gov.sg/family/apply-for-probate
- IRAS, deceased taxpayers: https://www.iras.gov.sg/taxes/individual-income-tax/my-situation/my-family-member-has-passed-away/
- IRAS, estate records: https://www.iras.gov.sg/taxes/other-taxes/trusts/basics-of-income-tax-of-estate-trust/keeping-proper-records-accounts
- SGX CDP: https://www.sgx.com/securities/retail-investor/cdp-faqs
- HDB resale: https://www.hdb.gov.sg/managing-my-home/selling-a-flat/process-for-selling-a-flat/resale-flat-application/application-process
- MyLegacy settlement: https://mylegacy.life.gov.sg/when-death-happens/settle-outstanding-bills-and-taxes

Sources support the general tasks; statuses, task splitting, assignees, prerequisites and the case story are study adaptations.


## Scenario and ownership revision

The scenario introduces Mr Tan Bee Hoon and explains the task chain. Tasks assigned to Daniel show Awaiting Daniel and cannot be submitted by the participant. Build study-4-scenario-ownership keeps these attempts separate from earlier protocol responses; existing records are retained.

## Five ready tasks

Build study-5-five-ready-tasks removes Record outstanding estate bills and invoices from both dashboards. Do Now contains five tasks; total task count is 17. Earlier responses remain available with their original build.

## Pending footer revision

Build study-6-pending-footer changes the banking dependency footer to Pending and adds a dark border around the message in both dashboards. Earlier attempts remain stored with their original build.
