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
      .select("id, registration_type, lat, lon, vegreferanse, created_at, data")
      .not("lat", "is", null)
      .not("lon", "is", null)
      .order("created_at", { ascending: false })
      .limit(500)

    if (contract) {
      query = query.ilike("contract_area", `${contract}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Incidents API error:", error)
      return NextResponse.json([])
    }

    const incidents: any[] = []

    for (const row of data || []) {
      const rawLat = row.lat
      const rawLon = row.lon

      const lat = Number(typeof rawLat === "string" ? rawLat.replace(",", ".") : rawLat)
      const lon = Number(typeof rawLon === "string" ? rawLon.replace(",", ".") : rawLon)

      if (!isFinite(lat) || !isFinite(lon)) continue
      if (lat < 57.9 || lat > 71.5 || lon < 4.5 || lon > 31.5) continue

      let type = "annet"
      if (row.registration_type === "voice_memo") {
        type = "vakttlf"
      } else if (row.registration_type === "friksjon") {
        type = "friksjon"
      } else if (row.registration_type === "arbeidsdok") {
        type = "tiltak"
      } else if (row.registration_type === "utbedring") {
        type = "tiltak"
      }

      const confidence = row.data?.classification?.confidence ?? null

      incidents.push({
        id: row.id,
        type,
        lat,
        lon,
        vegreferanse: row.vegreferanse || null,
        timestamp: row.created_at,
        confidence,
      })
    }

    return NextResponse.json(incidents)
  } catch (error) {
    console.error("[v0] Incidents API exception:", error)
    return NextResponse.json([])
  }
}
