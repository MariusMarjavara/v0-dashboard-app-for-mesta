import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contract = searchParams.get("contract")

    const supabase = await createClient()

    let query = supabase
      .from("registrations")
      .select("id, lat, lon, vegreferanse, incident_category, created_at, contract_area")
      .eq("registration_type", "voice_memo")
      .not("incident_category", "is", null)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })

    if (contract) {
      query = query.ilike("contract_area", `${contract}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ incidents: [], rejected: [] }, { status: 200 })
    }

    const incidents: any[] = []
    const rejected: any[] = []

    for (const row of data || []) {
      const rawLat = row.lat
      const rawLon = row.lon

      const lat = Number(typeof rawLat === "string" ? rawLat.replace(",", ".") : rawLat)
      const lon = Number(typeof rawLon === "string" ? rawLon.replace(",", ".") : rawLon)

      if (!isFinite(lat) || !isFinite(lon)) {
        rejected.push({
          id: row.id,
          reason: "Invalid coordinates (not finite)",
          rawLat,
          rawLon,
          created_at: row.created_at,
        })
        continue
      }

      if (lat < 57.9 || lat > 71.5 || lon < 4.5 || lon > 31.5) {
        rejected.push({
          id: row.id,
          reason: "Outside Norway bounds",
          rawLat,
          rawLon,
          lat,
          lon,
          created_at: row.created_at,
        })
        continue
      }

      incidents.push({
        id: row.id,
        lat,
        lon,
        vegreferanse: row.vegreferanse || "Ukjent lokasjon",
        category: row.incident_category || "Annet",
        reportedAt: row.created_at,
        ageMinutes: Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000),
      })
    }

    return NextResponse.json({ incidents, rejected })
  } catch (error) {
    return NextResponse.json({ incidents: [], rejected: [] }, { status: 200 })
  }
}
