import type { Iscrizione } from "@/lib/fight-hub";
import { datiGara } from "@/lib/fight-hub";

type Pair = { numero: number | null; rosso_id: string; blu_id: string };
type Pool = { numero: number | null; iscrizione_ids: string[] };

export async function esportaMatchCard(evento: { nome: string; data_evento: string; luogo: string; orario: string | null }, iscrizioni: Iscrizione[], cards: Pair[], pools: Pool[]) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FIGHT HUB";
  const lookup = new Map(iscrizioni.map((i) => [i.id, { ...datiGara(i, evento.data_evento), categoriaPeso: i.categoria_peso ?? "—" }]));
  const roster = workbook.addWorksheet("Iscritti", { views: [{ state: "frozen", ySplit: 1 }] });
  roster.columns = [
    { header: "Nome", key: "nome", width: 22 }, { header: "Cognome", key: "cognome", width: 25 },
    { header: "Data nascita", key: "data_nascita", width: 17 }, { header: "Età", key: "eta", width: 10 },
    { header: "Genere", key: "sesso", width: 12 }, { header: "Team", key: "team", width: 30 },
    { header: "Coach", key: "coach", width: 25 }, { header: "Disciplina", key: "disciplina", width: 20 },
    { header: "Classe", key: "serie", width: 12 }, { header: "Categoria di peso", key: "categoriaPeso", width: 24 },
    { header: "Peso kg", key: "peso", width: 13 }, { header: "Totale match", key: "match", width: 15 },
  ];
  iscrizioni.forEach((i) => roster.addRow(lookup.get(i.id)));

  const poolSheet = workbook.addWorksheet("Pool", { views: [{ state: "frozen", ySplit: 1 }] });
  poolSheet.columns = [
    { header: "Numero pool", key: "numero", width: 16 }, { header: "Nome", key: "nome", width: 22 },
    { header: "Cognome", key: "cognome", width: 25 }, { header: "Team", key: "team", width: 30 },
    { header: "Coach", key: "coach", width: 25 }, { header: "Peso kg", key: "peso", width: 13 },
    { header: "Disciplina", key: "disciplina", width: 20 }, { header: "Classe", key: "serie", width: 12 },
    { header: "Categoria di peso", key: "categoriaPeso", width: 24 }, { header: "Totale match", key: "match", width: 15 },
  ];
  pools.forEach((p) => p.iscrizione_ids.forEach((id) => poolSheet.addRow({ numero: p.numero, ...lookup.get(id) })));

  const sheet = workbook.addWorksheet("Match Card", { views: [{ state: "frozen", ySplit: 2 }] });
  sheet.columns = [
    { width: 10 }, { width: 22 }, { width: 25 }, { width: 28 },
    { width: 18 }, { width: 11 }, { width: 22 }, { width: 18 },
    { width: 22 }, { width: 25 }, { width: 28 },
  ];
  const red = "FFCF1D26", blue = "FF116CB7", green = "FF8AC54A", yellow = "FFFFED38";
  const fill = (argb: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } });
  sheet.mergeCells("A1:K1");
  sheet.getCell("A1").value = `${evento.nome.toLocaleUpperCase("it-IT")} · ${evento.luogo} · ${evento.data_evento}`;
  sheet.mergeCells("A2:K2");
  sheet.getCell("A2").value = "INIZIO GARE · ORE: ____________";
  sheet.getRow(1).height = 40;
  sheet.getRow(2).height = 26;
  for (const [rowNumber, color] of [[1, green], [2, yellow]] as const) {
    const cell = sheet.getCell(`A${rowNumber}`);
    cell.fill = fill(color);
    cell.font = { name: "Arial", size: rowNumber === 1 ? 16 : 11, bold: true, color: { argb: "FF172029" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  }

  const ordineEta = ["GIOCO SPORT", "YOUNG CADET", "OLD CADET", "JUNIOR", "SENIOR", "MASTER"];
  const ordineClasse = ["N", "C", "B", "A"];
  const iscr = new Map(iscrizioni.map((i) => [i.id, i]));
  const info = (id?: string) => {
    const i = id ? iscr.get(id) : undefined;
    if (!i) return null;
    const d = lookup.get(i.id)!;
    const light = (i.atleti?.formato ?? "") === "Light";
    const categoria = i.senior_17 ? "SENIOR 19–40 ANNI" : (d.categoria || "—").toUpperCase();
    const etaIdx = ordineEta.findIndex((e) => categoria.startsWith(e));
    const classe = light ? "LIGHT" : (d.serie || "—").toUpperCase();
    return { d, light, categoria, classe, etaIdx: etaIdx < 0 ? 99 : etaIdx, classeIdx: light ? -1 : Math.max(0, ordineClasse.indexOf(classe)), pesoNum: Number((i.categoria_peso ?? "").replace(/[^\d.]/g, "")) || 999 };
  };
  const coppie = [
    ...cards.map((c) => ({ rosso_id: c.rosso_id, blu_id: c.blu_id })),
    ...pools.flatMap((pool) => {
      const membri = pool.iscrizione_ids.filter((id) => lookup.has(id));
      return Array.from({ length: Math.ceil(membri.length / 2) }, (_, index) => ({ rosso_id: membri[index * 2], blu_id: membri[index * 2 + 1] as string | undefined }));
    }),
  ].map((c) => ({ ...c, k: info(c.rosso_id) ?? info(c.blu_id) })).filter((c) => c.k);
  // Light: one block per age category. KO: a single block, ordered by age, then class N→C→B→A, then weight.
  coppie.sort((a, b) => Number(b.k!.light) - Number(a.k!.light) || a.k!.etaIdx - b.k!.etaIdx || a.k!.classeIdx - b.k!.classeIdx || a.k!.pesoNum - b.k!.pesoNum);

  let numero = 0, bloccoCorrente = "";
  for (const c of coppie) {
    const k = c.k!;
    const blocco = k.light ? `${k.categoria} · LIGHT` : "KO · CONTATTO PIENO";
    if (blocco !== bloccoCorrente) {
      bloccoCorrente = blocco;
      sheet.addRow([]);
      const banner = sheet.addRow([`${blocco}   |   INIZIO ORE: ____________`]);
      sheet.mergeCells(`A${banner.number}:K${banner.number}`);
      banner.height = 26;
      const bc = banner.getCell(1);
      bc.fill = fill("FF24364A");
      bc.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      bc.alignment = { horizontal: "center", vertical: "middle" };
      const top = sheet.addRow(["MATCH", "ANGOLO ROSSO", "", "", "INCONTRO", "", "", "", "ANGOLO BLU", "", ""]);
      sheet.mergeCells(`B${top.number}:D${top.number}`);
      sheet.mergeCells(`E${top.number}:H${top.number}`);
      sheet.mergeCells(`I${top.number}:K${top.number}`);
      top.height = 24;
      for (const [col, color] of [[1, "FFD7DADD"], [2, red], [5, "FFD7DADD"], [9, blue]] as const) {
        const cell = top.getCell(col);
        cell.fill = fill(color);
        cell.font = { name: "Arial", size: 12, bold: true, color: { argb: color === red || color === blue ? "FFFFFFFF" : "FF172029" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
      const head = sheet.addRow(["N.", "Nome", "Cognome", "Team", "Disciplina", "Classe", "Categoria età", "Categoria di peso", "Nome", "Cognome", "Team"]);
      head.height = 26;
      head.eachCell((cell, col) => {
        cell.fill = fill(col >= 2 && col <= 4 ? "FFF8DFDF" : col >= 9 ? "FFDDEBF7" : "FFE5E7E9");
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF172029" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });
    }
    numero += 1;
    const r = c.rosso_id ? lookup.get(c.rosso_id) : undefined, b = c.blu_id ? lookup.get(c.blu_id) : undefined;
    const row = sheet.addRow([numero, r?.nome, r?.cognome, r?.team, k.d.disciplina, k.classe, k.categoria, r?.categoriaPeso ?? b?.categoriaPeso ?? "—", b?.nome, b?.cognome, b?.team]);
    row.height = 32;
    const pari = numero % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.fill = fill(pari ? col >= 2 && col <= 4 ? "FFF8ECEC" : col >= 9 ? "FFE8F2FB" : "FFE0E2E4" : col >= 2 && col <= 4 ? "FFFFF8F8" : col >= 9 ? "FFF7FBFF" : "FFFFFFFF");
      cell.font = { name: "Arial", size: 11, color: { argb: "FF172029" }, bold: col === 1 };
      cell.alignment = { vertical: "middle", horizontal: col === 1 || (col >= 5 && col <= 8) ? "center" : "left", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: "FF9DA3A8" } } };
    });
  }
  for (const other of [roster, poolSheet]) {
    other.getRow(1).height = 28;
    other.getRow(1).eachCell((cell) => { cell.fill = fill("FF24364A"); cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } }; cell.alignment = { vertical: "middle" }; });
    other.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(other.rowCount, 1), column: other.columnCount } };
  }
  sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheet.pageSetup.printTitlesRow = "1:2";
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `fight-hub-${evento.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}