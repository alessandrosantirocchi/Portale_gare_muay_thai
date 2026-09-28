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
Automatic pools are refreshed by a database trigger after registration changes; this keeps published groups consistent across all registration screens without admin action or client-side seeding.
The downloadable match-card workbook is built in the browser with ExcelJS; unlike the previous XLSX writer, it preserves red/blue cell fills in the downloaded file.
Registration weight divisions follow IFMA 2026 Rule 4 and are assigned by a database trigger using weight, gender and birth year at the event date; automatic pools require the same division so all registration entry points remain consistent.
Athlete roster entry uses one row per athlete with multi-row bulk insert, while medical certificate uploads remain on individual edit; this keeps batch registration fast without weakening file ownership checks.
