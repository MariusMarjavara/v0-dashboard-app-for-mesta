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
      .select("id, data, vegreferanse, incident_category, created_at, contract_area, registration_type")
      .eq("registration_type", "voice_memo")
      .not("incident_category", "is", null)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })

    if (contract) {
      query = query.ilike("contract_area", `${contract}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json([], { status: 200 })
    }

    // Extract GPS from JSONB data and filter out entries without coordinates
    const incidents =
      data
        ?.map((row) => {
          const lat = row.data?.lat || row.data?.latitude
          const lon = row.data?.lon || row.data?.longitude

          if (!lat || !lon) return null

          return {
            id: row.id,
            lat: Number(lat),
            lon: Number(lon),
            vegreferanse: row.vegreferanse || "Ukjent lokasjon",
            category: row.incident_category || "Annet",
            reportedAt: row.created_at,
            ageMinutes: Math.floor((Date.now() - new Date(row.created_at).getTime()) / 60000),
          }
        })
        .filter((incident) => incident !== null) || []

    return NextResponse.json(incidents)
  } catch (error) {
    return NextResponse.json([], { status: 200 })
  }
}
