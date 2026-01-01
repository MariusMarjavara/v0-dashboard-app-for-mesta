import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export async function GET(request: Request) {
  const supabase = await createClient()

  // Sjekker om bruker er logget inn
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // Henter query parameters
  const { searchParams } = new URL(request.url)
  const exportType = searchParams.get("type") || "user" // 'user', 'admin', 'all'
  const contractNummer = searchParams.get("contract")
  const saveToSupabase = searchParams.get("save") === "true"

  // Henter brukerinfo
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  let query = supabase.from("registrations").select("*").order("created_at", { ascending: false })

  query = query.eq("user_id", user.id)

  const { data: registrations, error } = await query

  if (error) {
    return new NextResponse("Error fetching registrations", { status: 500 })
  }

  const exportData = {
    arbeidsdokumentering: [] as any[],
    avvik_ruh_forbedringer: [] as any[],
    vinterarbeid: [] as any[],
    maskinregistrering: [] as any[],
    friksjon: [] as any[],
    innkjop: [] as any[],
    voice_memo: [] as any[],
  }

  registrations?.forEach((reg) => {
    const baseData = {
      Dato: new Date(reg.created_at).toLocaleString("nb-NO"),
      "Registrert av": reg.registered_by_name,
    }

    switch (reg.registration_type) {
      case "arbeidsdokumentering":
        exportData.arbeidsdokumentering.push({
          ...baseData,
          "Har ordrenummer": reg.data.has_order_number ? "Ja" : "Nei",
          Ordrenummer: reg.data.order_number || "-",
          Ordrebeskrivelse: reg.data.order_description || "-",
          Arbeidsbeskrivelse: reg.data.work_description || "-",
          "Antall bilder": reg.data.image_count || 0,
          Vegreferanser:
            reg.data.full_images
              ?.map((img: any) => img.road_reference)
              .filter(Boolean)
              .join(", ") || "-",
        })
        break
      case "avvik_ruh_forbedringer":
        exportData.avvik_ruh_forbedringer.push({
          ...baseData,
          Type: reg.data.report_type || "-",
          "Registrert i Landax": reg.data.registered_in_landax ? "Ja" : "Nei",
          Beskrivelse: reg.data.description || "-",
          "Antall bilder": reg.data.image_count || 0,
        })
        break
      case "vinterarbeid":
        exportData.vinterarbeid.push({
          ...baseData,
          Sted: reg.data.location || "-",
          "Type arbeid": reg.data.work_type || "-",
          Kommentar: reg.data.comment || "-",
        })
        break
      case "maskinregistrering":
        exportData.maskinregistrering.push({
          ...baseData,
          Maskin: reg.data.machine || "-",
          Kommentar: reg.data.comment || "-",
          Timeverk: reg.data.hours || "-",
        })
        break
      case "friksjon":
        exportData.friksjon.push({
          ...baseData,
          Tiltak: reg.data.tiltak || "-",
          "Hvorfor ikke": reg.data.why_not || "-",
          Lokasjon: reg.data.location || "-",
          "Laveste friksjon": reg.data.lowest_friction || "-",
          "Generell friksjon": reg.data.general_friction || "-",
        })
        break
      case "innkjop":
        exportData.innkjop.push({
          ...baseData,
          Produkt: reg.data.product || "-",
          Antall: reg.data.quantity || "-",
          Pris: reg.data.price || "-",
          Kommentar: reg.data.comment || "-",
        })
        break
      case "voice_memo":
        const voiceType = reg.data.type === "loggbok" ? "Loggbok" : "Notat"
        const confidence = reg.data.confidence || {}
        const avgConfidence = Object.values(confidence).length
          ? (
              (Object.values(confidence).reduce((a: any, b: any) => a + b, 0) / Object.values(confidence).length) *
              100
            ).toFixed(0) + "%"
          : "-"

        exportData.voice_memo.push({
          ...baseData,
          Type: `Voice ${voiceType}`,
          Vakttlf: reg.data.vakttlf ? "Ja" : "Nei",
          Ringer: reg.data.ringer || "-",
          Hendelse: reg.data.hendelse || "-",
          Tiltak: reg.data.tiltak || "-",
          Transkripsjon: reg.data.transcript || "-",
          Kontrakt: reg.contract_area || "-",
          "Operativ status": reg.data.operationalStatus || "-",
          "Tale-kvalitet": avgConfidence, // Average voice recognition confidence
        })
        break
    }
  })

  const workbook = XLSX.utils.book_new()

  if (exportData.arbeidsdokumentering.length > 0) {
    const ws = XLSX.utils.json_to_sheet(exportData.arbeidsdokumentering)
    XLSX.utils.book_append_sheet(workbook, ws, "Arbeidsdokumentering")
  }

  if (exportData.avvik_ruh_forbedringer.length > 0) {
    const ws = XLSX.utils.json_to_sheet(exportData.avvik_ruh_forbedringer)
    XLSX.utils.book_append_sheet(workbook, ws, "Avvik, RUH og forbedringer")
  }

  if (exportData.vinterarbeid.length > 0) {
    const ws = XLSX.utils.json_to_sheet(exportData.vinterarbeid)
    XLSX.utils.book_append_sheet(workbook, ws, "Vinterarbeid")
  }

  if (exportData.maskinregistrering.length > 0) {
    const ws = XLSX.utils.json_to_sheet(exportData.maskinregistrering)
    XLSX.utils.book_append_sheet(workbook, ws, "Maskinregistrering")
  }

  if (exportData.friksjon.length > 0) {
    const ws = XLSX.utils.json_to_sheet(exportData.friksjon)
    XLSX.utils.book_append_sheet(workbook, ws, "Friksjon")
  }

  if (exportData.innkjop.length > 0) {
    const ws = XLSX.utils.json_to_sheet(exportData.innkjop)
    XLSX.utils.book_append_sheet(workbook, ws, "Innkjøp")
  }

  if (exportData.voice_memo.length > 0) {
    const ws = XLSX.utils.json_to_sheet(exportData.voice_memo)
    XLSX.utils.book_append_sheet(workbook, ws, "Voice Memo")
  }

  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  })

  const filename = `mine_registreringer_${new Date().toISOString().split("T")[0]}.xlsx`

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
