import type { Iscrizione } from "@/lib/fight-hub";
import { datiGara } from "@/lib/fight-hub";

type Pair = { numero: number | null; rosso_id: string; blu_id: string };
type Pool = { numero: number | null; iscrizione_ids: string[] };

export async function esportaMatchCard(evento: { nome: string; data_evento: string; luogo: string; orario: string | null }, iscrizioni: Iscrizione[], cards: Pair[], pools: Pool[]) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FIGHT HUB";
  const lookup = new Map(iscrizioni.map((i) => [i.id, datiGara(i, evento.data_evento)]));
  const roster = workbook.addWorksheet("Iscritti", { views: [{ state: "frozen", ySplit: 1 }] });
  roster.columns = [
    { header: "Nome", key: "nome", width: 22 }, { header: "Cognome", key: "cognome", width: 25 },
    { header: "Data nascita", key: "data_nascita", width: 17 }, { header: "Età", key: "eta", width: 10 },
    { header: "Genere", key: "sesso", width: 12 }, { header: "Team", key: "team", width: 30 },
    { header: "Coach", key: "coach", width: 25 }, { header: "Disciplina", key: "disciplina", width: 20 },
    { header: "Classe", key: "serie", width: 12 }, { header: "Categoria", key: "categoria", width: 24 },
    { header: "Peso kg", key: "peso", width: 13 }, { header: "Totale match", key: "match", width: 15 },
  ];
  iscrizioni.forEach((i) => roster.addRow(datiGara(i, evento.data_evento)));

  const poolSheet = workbook.addWorksheet("Pool", { views: [{ state: "frozen", ySplit: 1 }] });
  poolSheet.columns = [
    { header: "Numero pool", key: "numero", width: 16 }, { header: "Nome", key: "nome", width: 22 },
    { header: "Cognome", key: "cognome", width: 25 }, { header: "Team", key: "team", width: 30 },
    { header: "Coach", key: "coach", width: 25 }, { header: "Peso kg", key: "peso", width: 13 },
    { header: "Disciplina", key: "disciplina", width: 20 }, { header: "Classe", key: "serie", width: 12 },
    { header: "Categoria", key: "categoria", width: 24 }, { header: "Totale match", key: "match", width: 15 },
  ];
  pools.forEach((p) => p.iscrizione_ids.forEach((id) => poolSheet.addRow({ numero: p.numero, ...lookup.get(id) })));

  const sheet = workbook.addWorksheet("Match Card", { views: [{ state: "frozen", ySplit: 4 }] });
  sheet.columns = [
    { width: 14 }, { width: 25 }, { width: 27 }, { width: 28 },
    { width: 20 }, { width: 13 }, { width: 24 },
    { width: 25 }, { width: 27 }, { width: 28 },
  ];
  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = `${evento.nome.toLocaleUpperCase("it-IT")} · ${evento.luogo} · ${evento.data_evento}`;
  sheet.mergeCells("A2:J2");
  sheet.getCell("A2").value = evento.orario ? `INIZIO GARE · ${evento.orario}` : "MATCH CARD";
  sheet.mergeCells("B3:D3");
  sheet.mergeCells("E3:G3");
  sheet.mergeCells("H3:J3");
  sheet.getCell("A3").value = "MATCH";
  sheet.getCell("B3").value = "ANGOLO ROSSO";
  sheet.getCell("E3").value = "INCONTRO";
  sheet.getCell("H3").value = "ANGOLO BLU";
  sheet.getRow(4).values = ["Numero match", "Nome", "Cognome", "Team", "Disciplina", "Classe", "Categoria", "Nome", "Cognome", "Team"];

  const red = "FFCF1D26", blue = "FF116CB7", green = "FF8AC54A", yellow = "FFFFED38";
  const fill = (argb: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } });
  sheet.getRow(1).height = 40;
  sheet.getRow(2).height = 26;
  sheet.getRow(3).height = 28;
  sheet.getRow(4).height = 30;
  for (const [rowNumber, color] of [[1, green], [2, yellow]] as const) {
    const cell = sheet.getCell(`A${rowNumber}`);
    cell.fill = fill(color);
    cell.font = { name: "Arial", size: rowNumber === 1 ? 16 : 11, bold: true, color: { argb: "FF172029" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  }
  for (const [address, color] of [["B3", red], ["H3", blue], ["A3", "FFD7DADD"], ["E3", "FFD7DADD"]] as const) {
    const cell = sheet.getCell(address);
    cell.fill = fill(color);
    cell.font = { name: "Arial", size: 12, bold: true, color: { argb: color === red || color === blue ? "FFFFFFFF" : "FF172029" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  }
  sheet.getRow(4).eachCell((cell, col) => {
    cell.fill = fill(col >= 2 && col <= 4 ? "FFF8DFDF" : col >= 8 && col <= 10 ? "FFDDEBF7" : "FFE5E7E9");
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF172029" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  cards.forEach((c, index) => {
    const r = lookup.get(c.rosso_id), b = lookup.get(c.blu_id);
    const row = sheet.addRow([c.numero, r?.nome, r?.cognome, r?.team, r?.disciplina, r?.serie, r?.categoria, b?.nome, b?.cognome, b?.team]);
    row.height = 34;
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.fill = fill(index % 2 === 0 ? col >= 2 && col <= 4 ? "FFF8ECEC" : col >= 8 && col <= 10 ? "FFE8F2FB" : "FFE0E2E4" : col >= 2 && col <= 4 ? "FFFFF8F8" : col >= 8 && col <= 10 ? "FFF7FBFF" : "FFFFFFFF");
      cell.font = { name: "Arial", size: 11, color: { argb: "FF172029" }, bold: col === 1 };
      cell.alignment = { vertical: "middle", horizontal: col === 1 || col === 5 || col === 6 || col === 7 ? "center" : "left", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: "FF9DA3A8" } } };
    });
  });
  for (const other of [roster, poolSheet]) {
    other.getRow(1).height = 28;
    other.getRow(1).eachCell((cell) => { cell.fill = fill("FF24364A"); cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } }; cell.alignment = { vertical: "middle" }; });
    other.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(other.rowCount, 1), column: other.columnCount } };
  }
  sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheet.pageSetup.printTitlesRow = "1:4";
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `fight-hub-${evento.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}