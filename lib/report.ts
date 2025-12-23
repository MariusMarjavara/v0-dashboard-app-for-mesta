import ExcelJS from "exceljs"

interface VoiceMemo {
  id: string
  created_at: string
  data: {
    type: "loggbok" | "notat"
    vakttlf?: boolean
    ringer?: string
    hendelse?: string
    tiltak?: string
    transcript?: string
    operationalStatus?: string
  }
}

export async function generateExcel(memos: VoiceMemo[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Vaktrapport")

  // Header
  worksheet.columns = [
    { header: "Tidspunkt", key: "timestamp", width: 20 },
    { header: "Type", key: "type", width: 15 },
    { header: "Vakttlf", key: "vakttlf", width: 10 },
    { header: "Ringer", key: "ringer", width: 20 },
    { header: "Hendelse", key: "hendelse", width: 20 },
    { header: "Tiltak", key: "tiltak", width: 20 },
    { header: "Transkripsjon", key: "transcript", width: 50 },
    { header: "Status", key: "status", width: 25 },
  ]

  // Styling
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0b1f3a" },
  }

  // Data
  memos.forEach((memo) => {
    worksheet.addRow({
      timestamp: new Date(memo.created_at).toLocaleString("nb-NO"),
      type: memo.data.type === "loggbok" ? "Loggbok" : "Notat",
      vakttlf: memo.data.vakttlf ? "Ja" : "Nei",
      ringer: memo.data.ringer || "-",
      hendelse: memo.data.hendelse || "-",
      tiltak: memo.data.tiltak || "-",
      transcript: memo.data.transcript || "",
      status: memo.data.operationalStatus || "NORMAL DRIFT",
    })
  })

  // Oppsummering
  const summarySheet = workbook.addWorksheet("Oppsummering")
  summarySheet.columns = [
    { header: "Kategori", key: "category", width: 25 },
    { header: "Antall", key: "count", width: 15 },
  ]

  const tiltakCounts: Record<string, number> = {}
  const hendelseCounts: Record<string, number> = {}

  memos.forEach((memo) => {
    if (memo.data.tiltak) {
      tiltakCounts[memo.data.tiltak] = (tiltakCounts[memo.data.tiltak] || 0) + 1
    }
    if (memo.data.hendelse) {
      hendelseCounts[memo.data.hendelse] = (hendelseCounts[memo.data.hendelse] || 0) + 1
    }
  })

  summarySheet.getRow(1).font = { bold: true }

  summarySheet.addRow({ category: "TILTAK", count: "" })
  Object.entries(tiltakCounts).forEach(([tiltak, count]) => {
    summarySheet.addRow({ category: tiltak, count })
  })

  summarySheet.addRow({ category: "", count: "" })
  summarySheet.addRow({ category: "HENDELSER", count: "" })
  Object.entries(hendelseCounts).forEach(([hendelse, count]) => {
    summarySheet.addRow({ category: hendelse, count })
  })

  summarySheet.addRow({ category: "", count: "" })
  summarySheet.addRow({ category: "Totalt antall registreringer", count: memos.length })
  summarySheet.addRow({
    category: "Vakttlf-hendelser",
    count: memos.filter((m) => m.data.vakttlf).length,
  })

  // Generer buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
