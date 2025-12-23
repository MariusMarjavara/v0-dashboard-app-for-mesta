import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import ExcelJS from "exceljs"

export async function POST(req: Request) {
  try {
    const { from, to, userId } = await req.json()

    const supabase = await createClient()

    // Hent alle voice memos i perioden
    const { data: memos, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("user_id", userId)
      .eq("registration_type", "voice_memo")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true })

    if (error) throw error

    // Generer Excel-rapport
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
    memos?.forEach((memo) => {
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

    memos?.forEach((memo) => {
      if (memo.data.tiltak) {
        tiltakCounts[memo.data.tiltak] = (tiltakCounts[memo.data.tiltak] || 0) + 1
      }
      if (memo.data.hendelse) {
        hendelseCounts[memo.data.hendelse] = (hendelseCounts[memo.data.hendelse] || 0) + 1
      }
    })

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
    summarySheet.addRow({ category: "Totalt antall registreringer", count: memos?.length || 0 })
    summarySheet.addRow({
      category: "Vakttlf-hendelser",
      count: memos?.filter((m) => m.data.vakttlf).length || 0,
    })

    // Generer buffer
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=vaktrapport_${from}_${to}.xlsx`,
      },
    })
  } catch (error) {
    console.error("Vaktrapport error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
