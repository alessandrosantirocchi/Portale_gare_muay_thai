<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Event disciplines and match formats are separate: `eventi.discipline_ammesse` lists sports, while `eventi.formati_incontro` maps each sport to Light/Contatto pieno; this prevents contact intensity from appearing as a sport or calendar filter.
Public event pairing lists read only explicitly published pools and matches; event lifecycle state does not hide published pairings, so visitors can check assignments before an event is marked published.
Use the shared age-category normalizer for registration writes, filters, and match data; keep the Junior-to-Senior marker separate from the effective Senior category to avoid duplicate options without changing historical age bands.
Automatic pools are refreshed by a database trigger after registration changes; this keeps published groups consistent across all registration screens without admin action or client-side seeding.
Roster birth-date corrections synchronize registration birth-date snapshots through a database trigger only while event registration is open and before its deadline; closed-event history and intentionally selected age bands remain unchanged.
The downloadable match-card workbook is built in the browser with ExcelJS; unlike the previous XLSX writer, it preserves red/blue cell fills in the downloaded file.
Registration weight divisions follow IFMA 2026 Rule 4 and are assigned by a database trigger using weight, gender and birth year at the event date; automatic pools require the same division so all registration entry points remain consistent.
Athlete roster entry uses one row per athlete with multi-row bulk insert; medical certificates are not collected and the registration trigger ignores legacy certificate flags so every registration entry point follows the same rule.
Export pool athletes as separate, explicitly pool-labelled rows in Match Card even when no individual match cards exist; this makes the exported workbook usable before matchmaking is finalized.
Keep roster weight choices gender-specific to the supplied chart (M -48 through -91, F -45 through -75, minus labels only) and separate from the age band; event registration independently recalculates its official division from measured weight and event date to preserve grouping rules.
Roster age bands are selected by KO/Light and validated against the exact birth date; the roster preserves the chosen band so overlapping ages 18 and 40 can be assigned intentionally.
