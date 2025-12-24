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

  if (exportType === "user") {
    // Bruker eksporterer kun sine egne registreringer
    query = query.eq("user_id", user.id)
  } else if (exportType === "admin" && contractNummer) {
    // Sjekk om bruker er admin for denne kontrakten
    const { data: isAdmin } = await supabase
      .from("contract_admins")
      .select("*")
      .eq("user_id", user.id)
      .eq("contract_nummer", Number.parseInt(contractNummer))
      .single()

    if (!isAdmin && profile?.user_type !== "mesta") {
      return new NextResponse("Unauthorized - Not a contract admin", { status: 403 })
    }

    // Hent alle registreringer fra brukere i denne kontrakten
    const { data: contractUsers } = await supabase.from("profiles").select("id").eq("contract_area", contractNummer)

    if (contractUsers && contractUsers.length > 0) {
      const userIds = contractUsers.map((u) => u.id)
      query = query.in("user_id", userIds)
    }
  } else if (exportType === "all") {
    // Kun Mesta-brukere kan eksportere alt
    if (profile?.user_type !== "mesta") {
      return new NextResponse("Unauthorized - Mesta only", { status: 403 })
    }
    // Ingen filter - henter alt
  } else {
    return new NextResponse("Invalid export type", { status: 400 })
  }

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
    voice_memo: [] as any[], // Adding voice_memo export support
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
        exportData.voice_memo.push({
          ...baseData,
          Type: `Voice ${voiceType}`,
          Vakttlf: reg.data.vakttlf ? "Ja" : "Nei",
          Ringer: reg.data.ringer || "-",
          Hendelse: reg.data.hendelse || "-",
          Tiltak: reg.data.tiltak || "-",
          Transkripsjon: reg.data.transcript || "-",
          Kontrakt: reg.contract_area || "-",
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

  const filename = `registreringer_${exportType}_${new Date().toISOString().split("T")[0]}.xlsx`

  if (saveToSupabase) {
    const filePath = `exports/${exportType}/${contractNummer || "all"}/${filename}`

    const { error: uploadError } = await supabase.storage.from("registrations").upload(filePath, excelBuffer, {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: false,
    })

    if (uploadError) {
    } else {
      // Logg eksporten
      await supabase.from("export_logs").insert({
        user_id: user.id,
        export_type: exportType,
        contract_nummer: contractNummer ? Number.parseInt(contractNummer) : null,
        file_path: filePath,
        record_count: registrations?.length || 0,
      })
    }
  }

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
